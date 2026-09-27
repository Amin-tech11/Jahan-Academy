from __future__ import annotations

from datetime import datetime
from typing import Any
from urllib.parse import quote, urlsplit

from app.modules.seo.schemas import HreflangLink, SeoMetadata

_PATHS = {
    "country": "countries",
    "university": "universities",
    "program": "programs",
    "article": "articles",
}


class SeoService:
    def __init__(self, frontend_url: str) -> None:
        parsed = urlsplit(frontend_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("frontend_url must be an absolute HTTP(S) URL")
        self.base_url = f"{parsed.scheme}://{parsed.netloc}"

    def entity_metadata(
        self,
        *,
        resource: str,
        slug: str,
        locale: str,
        name: str,
        seo_title: str | None,
        seo_description: str | None,
        updated_at: datetime | None,
        article_type: str | None = None,
        university_name: str | None = None,
    ) -> SeoMetadata:
        canonical = self.url_for(resource, slug, locale)
        title = seo_title or name
        description = seo_description
        structured_data = [
            self._breadcrumb(resource=resource, name=name, canonical=canonical, locale=locale)
        ]
        if resource == "university":
            structured_data.append(
                {
                    "@context": "https://schema.org",
                    "@type": "CollegeOrUniversity",
                    "name": name,
                    "url": canonical,
                }
            )
        elif resource == "program":
            item: dict[str, str] = {
                "@context": "https://schema.org",
                "@type": "EducationalOccupationalProgram",
                "name": name,
                "url": canonical,
            }
            if university_name:
                item["provider"] = university_name
            structured_data.append(item)
        elif resource == "article":
            structured_data.append(
                {
                    "@context": "https://schema.org",
                    "@type": "NewsArticle" if article_type == "news" else "Article",
                    "headline": name,
                    "mainEntityOfPage": canonical,
                }
            )
        return SeoMetadata(
            title=title,
            description=description,
            canonical=canonical,
            robots="index,follow",
            alternate_links=self.alternates(resource, slug),
            open_graph={
                "title": title,
                "type": "article" if resource == "article" else "website",
                "url": canonical,
            },
            structured_data=structured_data,
            last_modified=updated_at,
        )

    def listing_metadata(self, *, resource: str, locale: str, filtered: bool) -> SeoMetadata:
        canonical = self.url_for_listing(resource, locale)
        titles = {"universities": "Universities", "programs": "Programs", "articles": "Articles"}
        title = titles[resource]
        return SeoMetadata(
            title=title,
            canonical=canonical,
            robots="noindex,follow" if filtered else "index,follow",
            alternate_links=self.listing_alternates(resource),
            open_graph={"title": title, "type": "website", "url": canonical},
            structured_data=[
                {"@context": "https://schema.org", "@type": "WebSite", "url": self.base_url},
                {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": "Jahan Academy",
                    "url": self.base_url,
                },
            ],
        )

    def url_for(self, resource: str, slug: str, locale: str) -> str:
        return f"{self.base_url}/{locale}/{_PATHS[resource]}/{quote(slug, safe='-')}"

    def url_for_listing(self, resource: str, locale: str) -> str:
        return f"{self.base_url}/{locale}/{resource}"

    def alternates(self, resource: str, slug: str) -> list[HreflangLink]:
        return [
            HreflangLink(locale="fa", href=self.url_for(resource, slug, "fa")),
            HreflangLink(locale="en", href=self.url_for(resource, slug, "en")),
            HreflangLink(locale="x-default", href=self.url_for(resource, slug, "en")),
        ]

    def listing_alternates(self, resource: str) -> list[HreflangLink]:
        return [
            HreflangLink(locale="fa", href=self.url_for_listing(resource, "fa")),
            HreflangLink(locale="en", href=self.url_for_listing(resource, "en")),
            HreflangLink(locale="x-default", href=self.url_for_listing(resource, "en")),
        ]

    def sitemap_xml(self, entries: list[dict[str, Any]]) -> str:
        namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
        urls: list[str] = []
        for entry in entries:
            url = f"<url><loc>{_xml_escape(str(entry['loc']))}</loc>"
            if entry.get("last_modified"):
                last_modified = entry["last_modified"].date().isoformat()
                url += f"<lastmod>{_xml_escape(last_modified)}</lastmod>"
            urls.append(f"{url}</url>")
        header = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="{namespace}">'
        return f"{header}{''.join(urls)}</urlset>"

    def robots_txt(self) -> str:
        return "\n".join(
            [
                "User-agent: *",
                "Disallow: /admin/",
                "Disallow: /api/",
                f"Sitemap: {self.base_url}/sitemap.xml",
                "",
            ]
        )

    def _breadcrumb(
        self, *, resource: str, name: str, canonical: str, locale: str
    ) -> dict[str, Any]:
        listing = self.url_for_listing(_PATHS[resource], locale)
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Jahan Academy",
                    "item": f"{self.base_url}/{locale}",
                },
                {"@type": "ListItem", "position": 2, "name": _PATHS[resource], "item": listing},
                {"@type": "ListItem", "position": 3, "name": name, "item": canonical},
            ],
        }


def _xml_escape(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
