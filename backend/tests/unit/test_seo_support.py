from __future__ import annotations

from app.modules.seo.service import SeoService


def test_entity_metadata_has_reciprocal_language_links_and_valid_schema() -> None:
    metadata = SeoService("https://jahanacademy.example").entity_metadata(
        resource="university",
        slug="technical-university-of-munich",
        locale="fa",
        name="دانشگاه فنی مونیخ",
        seo_title=None,
        seo_description="یک دانشگاه نمونه",
        updated_at=None,
    )

    assert metadata.canonical == (
        "https://jahanacademy.example/fa/universities/technical-university-of-munich"
    )
    assert [(link.locale, link.href) for link in metadata.alternate_links] == [
        ("fa", "https://jahanacademy.example/fa/universities/technical-university-of-munich"),
        ("en", "https://jahanacademy.example/en/universities/technical-university-of-munich"),
        (
            "x-default",
            "https://jahanacademy.example/en/universities/technical-university-of-munich",
        ),
    ]
    assert metadata.robots == "index,follow"
    assert {item["@type"] for item in metadata.structured_data} == {
        "BreadcrumbList",
        "CollegeOrUniversity",
    }


def test_filtered_listing_is_noindex_and_canonical_has_no_query_string() -> None:
    metadata = SeoService("https://jahanacademy.example").listing_metadata(
        resource="programs", locale="en", filtered=True
    )

    assert metadata.robots == "noindex,follow"
    assert metadata.canonical == "https://jahanacademy.example/en/programs"
    assert "?" not in metadata.canonical


def test_sitemap_escapes_untrusted_database_values_and_robots_blocks_nonpublic_paths() -> None:
    service = SeoService("https://jahanacademy.example")
    sitemap = service.sitemap_xml([{"loc": "https://jahanacademy.example/en/articles/a&b"}])

    assert "a&amp;b" in sitemap
    assert "Disallow: /admin/" in service.robots_txt()
    assert "Sitemap: https://jahanacademy.example/sitemap.xml" in service.robots_txt()
