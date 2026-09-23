from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class ReferenceKind(StrEnum):
    COUNTRIES = "countries"
    CITIES = "cities"
    ACADEMIC_LEVELS = "academic-levels"
    FIELDS_OF_STUDY = "fields-of-study"
    INTAKES = "intakes"
    CURRENCIES = "currencies"


class StaleReferenceDataError(Exception):
    """Raised when an optimistic write targets an outdated row version."""


@dataclass(frozen=True, slots=True)
class ReferenceDefinition:
    table: str
    translation_table: str
    translation_fk: str
    code_field: str
    translation_description_field: str
    writable_fields: tuple[str, ...]
    public_predicate: str


REFERENCE_DEFINITIONS: dict[ReferenceKind, ReferenceDefinition] = {
    ReferenceKind.COUNTRIES: ReferenceDefinition(
        table="countries",
        translation_table="country_translations",
        translation_fk="country_id",
        code_field="iso2",
        translation_description_field="summary",
        writable_fields=("iso2", "iso3", "slug", "status", "featured", "display_order"),
        public_predicate="base.status = 'published' AND base.deleted_at IS NULL",
    ),
    ReferenceKind.CITIES: ReferenceDefinition(
        table="cities",
        translation_table="city_translations",
        translation_fk="city_id",
        code_field="slug",
        translation_description_field="description",
        writable_fields=(
            "country_id",
            "normalized_name",
            "slug",
            "active",
            "display_order",
        ),
        public_predicate="base.active = true AND base.deleted_at IS NULL",
    ),
    ReferenceKind.ACADEMIC_LEVELS: ReferenceDefinition(
        table="academic_levels",
        translation_table="academic_level_translations",
        translation_fk="academic_level_id",
        code_field="code",
        translation_description_field="description",
        writable_fields=("code", "active", "display_order"),
        public_predicate="base.active = true",
    ),
    ReferenceKind.FIELDS_OF_STUDY: ReferenceDefinition(
        table="fields_of_study",
        translation_table="field_of_study_translations",
        translation_fk="field_of_study_id",
        code_field="code",
        translation_description_field="description",
        writable_fields=("parent_id", "code", "slug", "active", "display_order"),
        public_predicate="base.active = true",
    ),
    ReferenceKind.INTAKES: ReferenceDefinition(
        table="intakes",
        translation_table="intake_translations",
        translation_fk="intake_id",
        code_field="code",
        translation_description_field="description",
        writable_fields=("code", "active", "display_order"),
        public_predicate="base.active = true",
    ),
    ReferenceKind.CURRENCIES: ReferenceDefinition(
        table="currencies",
        translation_table="currency_translations",
        translation_fk="currency_id",
        code_field="code",
        translation_description_field="description",
        writable_fields=(
            "code",
            "numeric_code",
            "symbol",
            "decimal_places",
            "active",
            "display_order",
        ),
        public_predicate="base.active = true",
    ),
}
