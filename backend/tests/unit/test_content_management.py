from typing import Any
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.modules.content.schemas import ArticleWrite, ContentReferenceWrite


def _translations() -> dict[str, dict[str, str]]:
    return {
        "fa": {"title": "راهنمای اپلای", "excerpt": "راهنمای کوتاه", "body": "متن کامل"},
        "en": {"title": "Application Guide", "excerpt": "Short guide", "body": "Full body"},
    }


def test_article_requires_bilingual_translations_and_unique_relations() -> None:
    category_id = uuid4()
    article = ArticleWrite.model_validate(
        {
            "slug": "application-guide",
            "categoryIds": [str(category_id)],
            "primaryCategoryId": str(category_id),
            "tagIds": [str(uuid4())],
            "translations": _translations(),
        }
    )
    assert article.primary_category_id == category_id

    with pytest.raises(ValidationError):
        ArticleWrite.model_validate(
            {
                "slug": "invalid-guide",
                "categoryIds": [str(category_id), str(category_id)],
                "translations": _translations(),
            }
        )


def test_primary_category_must_be_selected() -> None:
    with pytest.raises(ValidationError):
        ArticleWrite.model_validate(
            {
                "slug": "invalid-primary",
                "categoryIds": [str(uuid4())],
                "primaryCategoryId": str(uuid4()),
                "translations": _translations(),
            }
        )


def test_content_reference_shape_matches_resource() -> None:
    author = ContentReferenceWrite.model_validate(
        {
            "resource": "author",
            "slug": "jahan-editor",
            "translations": {
                "fa": {"name": "تحریریه جهان", "title": "تیم محتوا"},
                "en": {"name": "Jahan Editorial", "title": "Content Team"},
            },
        }
    )
    assert author.resource.value == "author"

    with pytest.raises(ValidationError):
        ContentReferenceWrite.model_validate(
            {
                "resource": "tag",
                "slug": "migration",
                "avatarMediaId": str(uuid4()),
                "translations": {
                    "fa": {"name": "مهاجرت"},
                    "en": {"name": "Migration"},
                },
            }
        )


def test_article_body_is_sanitized_with_a_rich_text_allowlist() -> None:
    payload: dict[str, Any] = {
        "slug": "safe-rich-text",
        "translations": _translations(),
    }
    payload["translations"]["en"]["body"] = (
        '<p onclick="alert(1)">Safe</p><script>alert(1)</script>'
        '<a href="javascript:alert(1)">link</a>'
    )

    article = ArticleWrite.model_validate(payload)
    body = article.translations["en"].body

    assert "onclick" not in body
    assert "script" not in body
    assert "javascript:" not in body
    assert "<p>Safe</p>" in body
