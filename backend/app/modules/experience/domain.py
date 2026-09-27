from enum import StrEnum


class ExperienceStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class PublicPageKind(StrEnum):
    HOME = "home"
    STATIC = "static"
    SERVICE = "service"


class StaleExperienceError(Exception):
    pass
