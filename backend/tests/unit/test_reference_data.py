from uuid import uuid4

import pytest
from pydantic import TypeAdapter, ValidationError

from app.modules.catalog.domain import ReferenceKind
from app.modules.catalog.router import ReferenceWrite
from app.modules.catalog.router import _parse_if_match as parse_if_match
from app.modules.catalog.schemas import CountryWrite, CurrencyWrite, IntakeWrite
from app.modules.catalog.service import ReferenceDataService
from app.shared.exceptions import ApplicationError


def test_country_requires_complete_bilingual_translations() -> None:
    with pytest.raises(ValidationError, match="Both fa and en translations"):
        CountryWrite.model_validate(
            {
                "iso2": "de",
                "slug": "germany",
                "translations": {"fa": {"name": "آلمان"}},
            }
        )


def test_iso_and_currency_codes_are_normalized() -> None:
    country = CountryWrite.model_validate(
        {
            "iso2": "de",
            "iso3": "deu",
            "slug": "germany",
            "translations": {
                "fa": {"name": "آلمان"},
                "en": {"name": "Germany"},
            },
        }
    )
    currency = CurrencyWrite.model_validate(
        {
            "code": "eur",
            "symbol": "€",
            "translations": {
                "fa": {"name": "یورو"},
                "en": {"name": "Euro"},
            },
        }
    )

    assert country.iso2 == "DE"
    assert country.iso3 == "DEU"
    assert currency.code == "EUR"


def test_intake_payload_is_not_misclassified_as_academic_level() -> None:
    payload: ReferenceWrite = TypeAdapter(ReferenceWrite).validate_python(
        {
            "code": "spring",
            "translations": {
                "fa": {"name": "بهار"},
                "en": {"name": "Spring"},
            },
        }
    )

    assert isinstance(payload, IntakeWrite)


def test_if_match_parser_accepts_strong_and_weak_etags() -> None:
    assert parse_if_match('"3"') == 3
    assert parse_if_match('W/"4"') == 4

    with pytest.raises(ApplicationError) as missing:
        parse_if_match(None)
    assert missing.value.status_code == 428


class FieldRepositoryStub:
    session = None

    async def exists(self, kind: ReferenceKind, item_id: object) -> bool:
        return True


async def test_field_of_study_cannot_be_its_own_parent() -> None:
    item_id = uuid4()
    service = ReferenceDataService(FieldRepositoryStub())  # type: ignore[arg-type]

    with pytest.raises(ApplicationError) as caught:
        await service._prepare(  # noqa: SLF001 - focused domain-rule unit test
            ReferenceKind.FIELDS_OF_STUDY,
            {
                "code": "computer_science",
                "slug": "computer-science",
                "parent_id": item_id,
                "active": True,
                "display_order": 10,
                "translations": {
                    "fa": {"name": "علوم کامپیوتر", "description": None},
                    "en": {"name": "Computer Science", "description": None},
                },
            },
            item_id=item_id,
        )

    assert caught.value.code == "INVALID_PARENT"
    assert caught.value.field_errors == {"parentId": ["SELF_REFERENCE"]}
