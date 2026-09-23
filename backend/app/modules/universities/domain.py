from __future__ import annotations

from enum import StrEnum


class UniversityStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class InstitutionType(StrEnum):
    PUBLIC = "public"
    PRIVATE = "private"
    NON_PROFIT = "non_profit"
    OTHER = "other"


class TuitionMode(StrEnum):
    EXACT = "exact"
    RANGE = "range"
    CONTACT = "contact"


class UniversityMediaRole(StrEnum):
    LOGO = "logo"
    HERO = "hero"
    GALLERY = "gallery"


class UniversitySort(StrEnum):
    FEATURED = "featured"
    NAME_ASC = "name_asc"
    NAME_DESC = "name_desc"
    RANK_ASC = "rank_asc"
    NEWEST = "newest"
    UPDATED_DESC = "updated_desc"


class StaleUniversityError(Exception):
    pass
