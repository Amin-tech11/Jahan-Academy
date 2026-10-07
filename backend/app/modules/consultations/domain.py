from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum

from app.shared.exceptions import ApplicationError

E164_PATTERN = re.compile(r"^\+[1-9][0-9]{7,14}$")
IRAN_MOBILE_PATTERN = re.compile(r"^9[0-9]{9}$")
DIGIT_TRANSLATION = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


class IntakeTerm(StrEnum):
    SPRING = "spring"
    SUMMER = "summer"
    FALL = "fall"
    WINTER = "winter"
    UNKNOWN = "unknown"


class SourceEntityType(StrEnum):
    UNIVERSITY = "university"
    PROGRAM = "program"


class GenderCode(StrEnum):
    FEMALE = "female"
    MALE = "male"
    NON_BINARY = "non_binary"
    SELF_DESCRIBED = "self_described"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class MaritalStatusCode(StrEnum):
    SINGLE = "single"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class LeadStatus(StrEnum):
    NEW = "new"
    ASSIGNED = "assigned"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    NOT_QUALIFIED = "not_qualified"
    CONVERTED = "converted"
    CLOSED = "closed"


class SyncStatus(StrEnum):
    PENDING = "pending"
    SYNCED = "synced"
    FAILED = "failed"


class LeadArchiveFilter(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    ALL = "all"


class LeadSort(StrEnum):
    CREATED_DESC = "created_desc"
    CREATED_ASC = "created_asc"
    UPDATED_DESC = "updated_desc"


class LeadSearchField(StrEnum):
    REFERENCE = "reference"
    FULL_NAME = "fullName"
    MOBILE = "mobile"


LEAD_STATUS_TRANSITIONS: dict[LeadStatus, frozenset[LeadStatus]] = {
    LeadStatus.NEW: frozenset({LeadStatus.ASSIGNED, LeadStatus.CLOSED}),
    LeadStatus.ASSIGNED: frozenset({LeadStatus.CONTACTED, LeadStatus.CLOSED}),
    LeadStatus.CONTACTED: frozenset(
        {LeadStatus.QUALIFIED, LeadStatus.NOT_QUALIFIED, LeadStatus.CLOSED}
    ),
    LeadStatus.QUALIFIED: frozenset(
        {LeadStatus.CONVERTED, LeadStatus.NOT_QUALIFIED, LeadStatus.CLOSED}
    ),
    LeadStatus.NOT_QUALIFIED: frozenset({LeadStatus.QUALIFIED, LeadStatus.CLOSED}),
    LeadStatus.CONVERTED: frozenset({LeadStatus.CLOSED}),
    LeadStatus.CLOSED: frozenset(
        {
            LeadStatus.NEW,
            LeadStatus.ASSIGNED,
            LeadStatus.CONTACTED,
            LeadStatus.QUALIFIED,
            LeadStatus.NOT_QUALIFIED,
            LeadStatus.CONVERTED,
        }
    ),
}


STATUSES_REQUIRING_ASSIGNEE = frozenset(
    {
        LeadStatus.ASSIGNED,
        LeadStatus.CONTACTED,
        LeadStatus.QUALIFIED,
        LeadStatus.NOT_QUALIFIED,
        LeadStatus.CONVERTED,
    }
)


@dataclass(frozen=True, slots=True)
class ConsultationReceiptData:
    reference: str
    duplicate: bool
    received_at: datetime
    message: str


@dataclass(frozen=True, slots=True)
class SubmissionResult:
    receipt: ConsultationReceiptData
    status_code: int


def normalize_mobile(value: str) -> str:
    translated = value.translate(DIGIT_TRANSLATION).strip()
    if any(character.isalpha() for character in translated):
        raise _invalid_mobile()
    compact = re.sub(r"[\s()\-.]", "", translated)
    if compact.startswith("00"):
        compact = f"+{compact[2:]}"
    if compact.startswith("+980"):
        compact = f"+98{compact[4:]}"
    if compact.startswith("+98"):
        national = compact[3:]
        if not IRAN_MOBILE_PATTERN.fullmatch(national):
            raise _invalid_mobile()
        return f"+98{national}"
    if compact.startswith("0"):
        national = compact[1:]
        if not IRAN_MOBILE_PATTERN.fullmatch(national):
            raise _invalid_mobile()
        return f"+98{national}"
    if IRAN_MOBILE_PATTERN.fullmatch(compact):
        return f"+98{compact}"
    if not E164_PATTERN.fullmatch(compact):
        raise _invalid_mobile()
    return compact


def _invalid_mobile() -> ApplicationError:
    return ApplicationError(
        code="INVALID_MOBILE",
        message="Enter a valid Iranian or international mobile number.",
        status_code=422,
        field_errors={"mobile": ["INVALID_MOBILE"]},
    )
