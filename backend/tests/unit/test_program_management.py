from __future__ import annotations

from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.modules.programs.schemas import ApplicationFeeWrite, ProgramWrite, TuitionWrite


def _payload() -> dict[str, object]:
    primary_field = uuid4()
    return {
        "universityId": str(uuid4()),
        "academicLevelId": str(uuid4()),
        "primaryFieldId": str(primary_field),
        "fieldIds": [str(primary_field)],
        "slug": "master-computer-science",
        "durationValue": 2,
        "durationUnit": "year",
        "tuition": {
            "mode": "range",
            "minimumMinor": 90000,
            "maximumMinor": 120000,
            "currency": "eur",
        },
        "applicationFee": {"mode": "exact", "amountMinor": 7500, "currency": "eur"},
        "translations": {
            "fa": {"title": "کارشناسی ارشد علوم کامپیوتر"},
            "en": {"title": "Master of Computer Science"},
        },
        "intakes": [],
        "requirements": [],
    }


def test_program_requires_bilingual_content_and_primary_field_membership() -> None:
    payload = _payload()
    payload["translations"] = {"fa": {"title": "برنامه"}}
    with pytest.raises(ValidationError, match="Both fa and en"):
        ProgramWrite.model_validate(payload)

    payload = _payload()
    payload["primaryFieldId"] = str(uuid4())
    with pytest.raises(ValidationError, match="included in fieldIds"):
        ProgramWrite.model_validate(payload)


def test_duration_and_intake_pairs_must_be_complete_and_unique() -> None:
    payload = _payload()
    payload.pop("durationUnit")
    with pytest.raises(ValidationError, match="supplied together"):
        ProgramWrite.model_validate(payload)

    payload = _payload()
    intake_id = str(uuid4())
    payload["intakes"] = [
        {"intakeId": intake_id, "year": 2027, "applicationDeadline": "2027-01-01"},
        {"intakeId": intake_id, "year": 2027, "applicationDeadline": "2027-02-01"},
    ]
    with pytest.raises(ValidationError, match="intake and year"):
        ProgramWrite.model_validate(payload)


def test_tuition_and_application_fee_money_shapes() -> None:
    tuition = TuitionWrite.model_validate(
        {"mode": "exact", "minimumMinor": 1000, "currency": "eur"}
    )
    fee = ApplicationFeeWrite.model_validate(
        {"mode": "exact", "amountMinor": 500, "currency": "usd"}
    )
    assert tuition.currency == "EUR"
    assert fee.currency == "USD"

    with pytest.raises(ValidationError, match="contact tuition"):
        TuitionWrite.model_validate({"mode": "contact", "minimumMinor": 1})
    with pytest.raises(ValidationError, match="must not include"):
        ApplicationFeeWrite.model_validate({"mode": "free", "amountMinor": 0})
