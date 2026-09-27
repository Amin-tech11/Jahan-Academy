from enum import StrEnum


class ContentStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ArticleType(StrEnum):
    ARTICLE = "article"
    NEWS = "news"
    GUIDE = "guide"


class ContentResource(StrEnum):
    CATEGORY = "category"
    TAG = "tag"
    AUTHOR = "author"


class FaqTargetType(StrEnum):
    GENERAL = "general"
    UNIVERSITY = "university"
    PROGRAM = "program"
    SERVICE = "service"


class FaqSort(StrEnum):
    DISPLAY_ORDER = "display_order"
    UPDATED_DESC = "updated_desc"
    QUESTION_ASC = "question_asc"


class ArticleSort(StrEnum):
    RELEVANCE = "relevance"
    NEWEST = "newest"
    OLDEST = "oldest"
    TITLE_ASC = "title_asc"
    TITLE_DESC = "title_desc"
    UPDATED_DESC = "updated_desc"


class StaleContentError(Exception):
    pass
