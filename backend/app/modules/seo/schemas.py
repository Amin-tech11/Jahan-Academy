from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

Locale = Literal["fa", "en"]
SeoResource = Literal["country", "university", "article", "page"]
SeoListing = Literal["countries", "universities", "articles", "services"]


class HreflangLink(BaseModel):
    locale: Literal["fa", "en", "x-default"]
    href: str


class SeoMetadata(BaseModel):
    title: str = Field(max_length=180)
    description: str | None = Field(default=None, max_length=320)
    canonical: str
    robots: Literal["index,follow", "noindex,follow"]
    alternate_links: list[HreflangLink]
    open_graph: dict[str, str]
    structured_data: list[dict[str, Any]]
    last_modified: datetime | None = None
