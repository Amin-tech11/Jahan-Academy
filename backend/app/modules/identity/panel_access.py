"""Panel section policy, separate from staff roles and lead ownership."""

SECTION_PERMISSIONS: dict[str, frozenset[str]] = {
    "dashboard": frozenset({"report.read"}),
    "leads": frozenset({"lead.read.assigned", "lead.write.assigned"}),
    "universities": frozenset({"catalog.read", "catalog.write"}),
    "programs": frozenset({"catalog.read", "catalog.write"}),
    "media": frozenset({"media.read", "media.write"}),
    **{
        key: frozenset({"content.read", "content.write", "content.publish"})
        for key in ("articles", "faqs", "categories", "tags", "authors")
    },
    **{
        key: frozenset({"reference_data.read", "reference_data.write"})
        for key in (
            "countries",
            "cities",
            "academic-levels",
            "fields-of-study",
            "intakes",
            "currencies",
        )
    },
}
DELEGABLE_SECTIONS = frozenset(SECTION_PERMISSIONS)
ALL_SECTIONS = DELEGABLE_SECTIONS | {"staff", "audit", "access"}
DEFAULT_SECTIONS = frozenset({"leads"})


def section_for_path(path: str) -> str | None:
    path = path.removeprefix("/api/v1")
    if path == "/reporting/dashboard":
        return "dashboard"
    if not path.startswith("/admin/"):
        return None
    parts = path.strip("/").split("/")
    section = parts[1]
    if section == "content":
        return {"category": "categories", "tag": "tags", "author": "authors"}.get(
            parts[2] if len(parts) > 2 else "", "unknown"
        )
    if section == "reference-data":
        return parts[2] if len(parts) > 2 else "unknown"
    return {"audit-logs": "audit"}.get(section, section)
