from __future__ import annotations

from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.modules.universities.schemas import TuitionWrite, UniversityWrite


def _payload() -> dict[str, object]:
    return {
        "slug": "technical-university-of-munich",
        "countryId": str(uuid4()),
        "cityId": str(uuid4()),
        "institutionType": "public",
        "foundedYear": 1868,
        "tuition": {
            "mode": "range",
            "minimumMinor": 90000,
            "maximumMinor": 120000,
            "currency": "eur",
        },
        "translations": {
            "fa": {"name": "دانشگاه فنی مونیخ"},
            "en": {"name": "Technical University of Munich"},
        },
        "rankings": [{"organization": "QS", "year": 2026, "rank": 28}],
        "media": [],
    }


def test_university_write_requires_both_translations() -> None:
    payload = _payload()
    payload["translations"] = {"fa": {"name": "دانشگاه"}}
    with pytest.raises(ValidationError, match="Both fa and en"):
        UniversityWrite.model_validate(payload)


def test_tuition_modes_enforce_amount_shape_and_normalize_currency() -> None:
    tuition = TuitionWrite.model_validate(
        {"mode": "range", "minimumMinor": 100, "maximumMinor": 200, "currency": "eur"}
    )
    assert tuition.currency == "EUR"

    with pytest.raises(ValidationError, match="contact tuition"):
        TuitionWrite.model_validate({"mode": "contact", "minimumMinor": 100})
    with pytest.raises(ValidationError, match="valid minimum"):
        TuitionWrite.model_validate(
            {"mode": "range", "minimumMinor": 300, "maximumMinor": 200, "currency": "EUR"}
        )


def test_university_media_roles_and_rankings_are_unique() -> None:
    payload = _payload()
    asset_a = str(uuid4())
    asset_b = str(uuid4())
    payload["media"] = [
        {"mediaAssetId": asset_a, "role": "logo"},
        {"mediaAssetId": asset_b, "role": "logo"},
    ]
    with pytest.raises(ValidationError, match="only one logo"):
        UniversityWrite.model_validate(payload)

    payload = _payload()
    payload["rankings"] = [
        {"organization": "QS", "year": 2026, "rank": 28},
        {"organization": "qs", "year": 2026, "band": "21-30"},
    ]
    with pytest.raises(ValidationError, match="organization and year"):
        UniversityWrite.model_validate(payload)
