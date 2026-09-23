from __future__ import annotations

from enum import StrEnum


class ProgramStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class MoneyMode(StrEnum):
    EXACT = "exact"
    RANGE = "range"
    CONTACT = "contact"


class ApplicationFeeMode(StrEnum):
    EXACT = "exact"
    FREE = "free"
    CONTACT = "contact"


class DurationUnit(StrEnum):
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


class IntakeStatus(StrEnum):
    PLANNED = "planned"
    OPEN = "open"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class ProgramSort(StrEnum):
    FEATURED = "featured"
    TITLE_ASC = "title_asc"
    TITLE_DESC = "title_desc"
    TUITION_ASC = "tuition_asc"
    DEADLINE_ASC = "deadline_asc"
    NEWEST = "newest"
    UPDATED_DESC = "updated_desc"


class StaleProgramError(Exception):
    pass
