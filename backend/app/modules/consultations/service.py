from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.modules.consultations.domain import (
    ConsultationReceiptData,
    SourceEntityType,
    SubmissionResult,
    normalize_mobile,
)
from app.modules.consultations.rate_limit import ConsultationRateLimiter
from app.modules.consultations.repository import ConsultationRepository, IdempotencyRecord
from app.modules.consultations.schemas import ConsultationCreate
from app.shared.exceptions import ApplicationError


class ConsultationService:
    def __init__(
        self,
        repository: ConsultationRepository,
        rate_limiter: ConsultationRateLimiter,
        settings: Settings,
    ) -> None:
        self._repository = repository
        self._rate_limiter = rate_limiter
        self._settings = settings
        self._secret = settings.session_secret.get_secret_value().encode()

    async def submit(
        self,
        payload: ConsultationCreate,
        *,
        idempotency_key: str | None,
        client_ip: str,
        user_agent: str,
    ) -> SubmissionResult:
        normalized_mobile = normalize_mobile(payload.mobile)
        mobile_hash = self._hmac(normalized_mobile)
        if not await self._rate_limiter.allow(mobile_hash):
            raise ApplicationError(
                code="RATE_LIMITED",
                message="Too many consultation requests. Please try again later.",
                status_code=429,
                headers={"Retry-After": str(self._rate_limiter.window_seconds)},
            )

        await self._validate_references(payload)
        request_hash = self._request_hash(payload, normalized_mobile)
        if idempotency_key:
            await self._repository.advisory_lock(self._lock_key(f"idempotency:{idempotency_key}"))
            previous = await self._repository.get_idempotency(idempotency_key)
            if previous is not None:
                return await self._replay_idempotency(previous, request_hash)

        deduplication_key = self._deduplication_key(payload, normalized_mobile)
        await self._repository.advisory_lock(self._lock_key(f"dedup:{deduplication_key}"))
        duplicate = await self._repository.find_duplicate(
            deduplication_key,
            self._settings.consultation_duplicate_window_hours,
        )
        fingerprint = self._hmac(f"{client_ip}|{user_agent[:500]}")
        now = datetime.now(UTC)

        if duplicate is not None:
            await self._repository.increment_duplicate(duplicate.id)
            await self._repository.record_submission_event(
                lead_id=duplicate.id,
                event_type="duplicate",
                source_url=payload.source.page_url,
                request_fingerprint_hash=fingerprint,
                metadata_safe={"locale": payload.locale},
            )
            receipt = ConsultationReceiptData(
                reference=duplicate.public_reference,
                duplicate=True,
                received_at=now,
                message=self._message(payload.locale, duplicate=True),
            )
            if idempotency_key:
                await self._save_idempotency(
                    idempotency_key, request_hash, 200, receipt, duplicate.id
                )
            await self._repository.session.commit()
            return SubmissionResult(receipt=receipt, status_code=200)

        reference = self._new_reference()
        try:
            lead = await self._repository.create_lead(
                self._lead_values(payload, normalized_mobile, deduplication_key, reference)
            )
            evidence = {"ipHash": self._hmac(client_ip), "pageUrl": payload.source.page_url}
            await self._repository.record_consent(
                lead_id=lead.id,
                consent_type="privacy_policy",
                policy_version=self._settings.privacy_policy_version,
                locale=payload.locale,
                evidence=evidence,
            )
            await self._repository.record_consent(
                lead_id=lead.id,
                consent_type="contact_permission",
                policy_version=self._settings.contact_consent_version,
                locale=payload.locale,
                evidence=evidence,
            )
            await self._repository.initialize_lead_workflow(lead.id)
            await self._repository.record_submission_event(
                lead_id=lead.id,
                event_type="accepted",
                source_url=payload.source.page_url,
                request_fingerprint_hash=fingerprint,
                metadata_safe={"locale": payload.locale},
            )
            receipt = ConsultationReceiptData(
                reference=lead.public_reference,
                duplicate=False,
                received_at=lead.created_at,
                message=self._message(payload.locale, duplicate=False),
            )
            if idempotency_key:
                await self._save_idempotency(idempotency_key, request_hash, 201, receipt, lead.id)
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise ApplicationError(
                code="CONSULTATION_SUBMISSION_CONFLICT",
                message="The consultation request could not be recorded. Please try again.",
                status_code=409,
            ) from exc
        return SubmissionResult(receipt=receipt, status_code=201)

    async def _validate_references(self, payload: ConsultationCreate) -> None:
        if payload.desired_country_id is not None:
            if not await self._repository.country_is_public(payload.desired_country_id):
                raise self._invalid_reference("desiredCountryId")
        if payload.investment_budget is not None:
            if not await self._repository.currency_is_active(payload.investment_budget.currency):
                raise self._invalid_reference("investmentBudget.currency")
        if payload.source.entity_type is not None and payload.source.entity_id is not None:
            if not await self._repository.source_is_public(
                payload.source.entity_type, payload.source.entity_id
            ):
                raise self._invalid_reference("source.entityId")

    async def _replay_idempotency(
        self, previous: IdempotencyRecord, request_hash: str
    ) -> SubmissionResult:
        if not hmac.compare_digest(previous.request_hash, request_hash):
            raise ApplicationError(
                code="IDEMPOTENCY_KEY_REUSED",
                message="The idempotency key was already used for a different request.",
                status_code=409,
            )
        body = previous.response_body
        receipt = ConsultationReceiptData(
            reference=body["reference"],
            duplicate=body["duplicate"],
            received_at=datetime.fromisoformat(body["receivedAt"]),
            message=body["message"],
        )
        await self._repository.session.commit()
        return SubmissionResult(receipt=receipt, status_code=previous.response_status)

    async def _save_idempotency(
        self,
        key: str,
        request_hash: str,
        response_status: int,
        receipt: ConsultationReceiptData,
        lead_id: UUID,
    ) -> None:
        await self._repository.save_idempotency(
            key=key,
            request_hash=request_hash,
            response_status=response_status,
            response_body=self._receipt_body(receipt),
            lead_id=lead_id,
        )

    @staticmethod
    def _receipt_body(receipt: ConsultationReceiptData) -> dict[str, Any]:
        return {
            "reference": receipt.reference,
            "duplicate": receipt.duplicate,
            "receivedAt": receipt.received_at.isoformat(),
            "message": receipt.message,
        }

    @staticmethod
    def _lead_values(
        payload: ConsultationCreate,
        mobile: str,
        deduplication_key: str,
        reference: str,
    ) -> dict[str, Any]:
        investment = payload.investment_budget
        source_type = payload.source.entity_type
        return {
            "public_reference": reference,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "mobile_raw": payload.mobile,
            "mobile_normalized": mobile,
            "email": payload.email,
            "desired_country_id": payload.desired_country_id,
            "desired_country_text": payload.desired_country_text,
            "intake_code": payload.intake_term,
            "start_year": payload.start_year,
            "age": payload.age,
            "gender_code": payload.gender,
            "gender_self_description": payload.gender_self_description,
            "occupation": payload.occupation,
            "marital_status_code": payload.marital_status,
            "investment_range_code": investment.range_code if investment else None,
            "investment_currency": investment.currency if investment else None,
            "message": payload.message,
            "locale": payload.locale,
            "source_url": payload.source.page_url,
            "source_university_id": (
                payload.source.entity_id if source_type == SourceEntityType.UNIVERSITY else None
            ),
            "source_program_id": (
                payload.source.entity_id if source_type == SourceEntityType.PROGRAM else None
            ),
            "deduplication_key": deduplication_key,
        }

    def _request_hash(self, payload: ConsultationCreate, mobile: str) -> str:
        canonical = payload.model_dump(mode="json", by_alias=True)
        canonical["mobile"] = mobile
        country_text = canonical.get("desiredCountryText")
        if country_text:
            canonical["desiredCountryText"] = " ".join(country_text.split()).casefold()
        serialized = json.dumps(canonical, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(serialized.encode()).hexdigest()

    @staticmethod
    def _deduplication_key(payload: ConsultationCreate, mobile: str) -> str:
        country = (
            str(payload.desired_country_id)
            if payload.desired_country_id
            else " ".join((payload.desired_country_text or "").split()).casefold()
        )
        value = f"{mobile}|{country}|{payload.intake_term}|{payload.start_year}"
        return hashlib.sha256(value.encode()).hexdigest()

    def _hmac(self, value: str) -> str:
        return hmac.new(self._secret, value.encode(), hashlib.sha256).hexdigest()

    @staticmethod
    def _lock_key(value: str) -> int:
        digest = hashlib.sha256(value.encode()).digest()[:8]
        return int.from_bytes(digest, byteorder="big", signed=True)

    @staticmethod
    def _new_reference() -> str:
        token = base64.b32encode(secrets.token_bytes(10)).decode().rstrip("=")
        return f"JA-{token}"

    @staticmethod
    def _message(locale: str, *, duplicate: bool) -> str:
        if locale == "fa":
            if duplicate:
                return "درخواست شما قبلاً ثبت شده است؛ همان کد پیگیری معتبر است."
            return "درخواست مشاوره شما با موفقیت ثبت شد."
        if duplicate:
            return "Your request was already received; the same tracking code remains valid."
        return "Your consultation request was submitted successfully."

    @staticmethod
    def _invalid_reference(field: str) -> ApplicationError:
        return ApplicationError(
            code="REFERENCE_NOT_FOUND",
            message="A selected reference does not exist or is unavailable.",
            status_code=422,
            field_errors={field: ["REFERENCE_NOT_FOUND"]},
        )
