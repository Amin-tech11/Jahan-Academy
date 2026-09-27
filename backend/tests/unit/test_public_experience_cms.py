from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.modules.content.domain import FaqTargetType
from app.modules.content.schemas import FaqAssignmentWrite
from app.modules.experience.schemas import CountryGuideWrite, PublicPageWrite


def _page_payload() -> dict[str, object]:
    return {
        "slug": "home",
        "pageKind": "home",
        "translations": {
            "fa": {"title": "خانه", "blocks": [{"type": "hero", "title": "جهان"}]},
            "en": {"title": "Home", "blocks": [{"type": "hero", "title": "Jahan"}]},
        },
    }


def test_public_page_requires_bilingual_translations_and_home_slug() -> None:
    assert PublicPageWrite.model_validate(_page_payload()).slug == "home"
    invalid = _page_payload()
    invalid["slug"] = "welcome"
    with pytest.raises(ValidationError, match="home page slug"):
        PublicPageWrite.model_validate(invalid)

    missing_locale = _page_payload()
    missing_locale["translations"] = {"fa": {"title": "خانه"}}
    with pytest.raises(ValidationError, match="translations"):
        PublicPageWrite.model_validate(missing_locale)


def test_public_page_sanitizes_rich_text_and_rejects_unsafe_cta_links() -> None:
    payload = _page_payload()
    payload["translations"]["en"]["body"] = "<script>alert(1)</script><p>Safe copy</p>"  # type: ignore[index]
    payload["translations"]["en"]["blocks"][0]["ctaHref"] = "/en/consultation"  # type: ignore[index]
    page = PublicPageWrite.model_validate(payload)
    assert page.translations["en"].body is not None
    assert "script" not in page.translations["en"].body

    payload["translations"]["en"]["blocks"][0]["ctaHref"] = "javascript:alert(1)"  # type: ignore[index]
    with pytest.raises(ValidationError, match="ctaHref"):
        PublicPageWrite.model_validate(payload)


def test_country_guide_has_structured_bilingual_sections_and_sources() -> None:
    country_id = uuid4()
    payload = {
        "countryId": str(country_id),
        "translations": {
            "fa": {
                "title": "تحصیل در کانادا",
                "summary": "راهنمای مقدماتی",
                "facts": [{"label": "گام بعدی", "value": "مشاوره"}],
                "sections": [{"title": "شروع", "body": "مسیر مناسب خود را بررسی کنید."}],
                "sources": [{"label": "Official source", "url": "https://www.canada.ca/"}],
            },
            "en": {
                "title": "Study in Canada",
                "summary": "An initial guide",
                "facts": [{"label": "Next step", "value": "Consultation"}],
                "sections": [{"title": "Start", "body": "Review the path that fits you."}],
                "sources": [{"label": "Official source", "url": "https://www.canada.ca/"}],
            },
        },
    }
    guide = CountryGuideWrite.model_validate(payload)
    assert guide.country_id == country_id
    assert guide.translations["en"].sections[0].title == "Start"


def test_faq_targets_support_home_country_page_and_article_scopes() -> None:
    assert FaqAssignmentWrite(target_type=FaqTargetType.HOMEPAGE).target_id is None
    for target_type in (FaqTargetType.COUNTRY, FaqTargetType.PAGE, FaqTargetType.ARTICLE):
        assignment = FaqAssignmentWrite(target_type=target_type, target_id=uuid4())
        assert assignment.target_type is target_type
    with pytest.raises(ValidationError, match="targetId"):
        FaqAssignmentWrite(target_type=FaqTargetType.ARTICLE)
