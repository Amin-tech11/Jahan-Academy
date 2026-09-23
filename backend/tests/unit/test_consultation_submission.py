from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.modules.consultations.domain import normalize_mobile
from app.modules.consultations.schemas import ConsultationCreate
from app.shared.exceptions import ApplicationError


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("0912 123 4567", "+989121234567"),
        ("912-123-4567", "+989121234567"),
        ("+98 (912) 123 4567", "+989121234567"),
        ("+9809121234567", "+989121234567"),
        ("00989121234567", "+989121234567"),
        ("۰۹۱۲۱۲۳۴۵۶۷", "+989121234567"),
        ("+447911123456", "+447911123456"),
    ],
)
def test_mobile_normalization_accepts_iranian_and_international_formats(
    raw: str, expected: str
) -> None:
    assert normalize_mobile(raw) == expected


@pytest.mark.parametrize("raw", ["02112345678", "0912ABC4567", "+123"])
def test_mobile_normalization_rejects_invalid_numbers(raw: str) -> None:
    with pytest.raises(ApplicationError) as caught:
        normalize_mobile(raw)
    assert caught.value.code == "INVALID_MOBILE"


def _valid_payload() -> dict[str, object]:
    return {
        "firstName": "مینا",
        "lastName": "احمدی",
        "mobile": "09121234567",
        "desiredCountryText": "آلمان",
        "intakeTerm": "FALL",
        "startYear": datetime.now(UTC).year + 1,
        "locale": "fa",
        "source": {"pageUrl": "/fa/consultation"},
        "privacyConsent": True,
        "contactConsent": True,
    }


def test_consultation_schema_requires_both_consents() -> None:
    payload = _valid_payload()
    payload["privacyConsent"] = False
    with pytest.raises(ValidationError):
        ConsultationCreate.model_validate(payload)


def test_consultation_schema_rejects_blank_required_names() -> None:
    payload = _valid_payload()
    payload["firstName"] = "   "
    with pytest.raises(ValidationError, match="must not be blank"):
        ConsultationCreate.model_validate(payload)


def test_consultation_schema_rejects_filled_honeypot() -> None:
    payload = _valid_payload()
    payload["website"] = "https://spam.example"
    with pytest.raises(ValidationError, match="must be empty"):
        ConsultationCreate.model_validate(payload)


def test_consultation_schema_requires_one_country_representation() -> None:
    payload = _valid_payload()
    payload["desiredCountryId"] = "445977fc-5549-4daa-9697-2c26dfd99172"
    with pytest.raises(ValidationError, match="exactly one"):
        ConsultationCreate.model_validate(payload)


def test_self_described_gender_requires_description() -> None:
    payload = _valid_payload()
    payload["gender"] = "SELF_DESCRIBED"
    with pytest.raises(ValidationError, match="genderSelfDescription"):
        ConsultationCreate.model_validate(payload)


def test_consultation_schema_normalizes_enums_and_currency() -> None:
    payload = _valid_payload()
    payload["investmentBudget"] = {"rangeCode": "under_10k", "currency": "eur"}
    model = ConsultationCreate.model_validate(payload)

    assert model.intake_term == "fall"
    assert model.investment_budget is not None
    assert model.investment_budget.currency == "EUR"
