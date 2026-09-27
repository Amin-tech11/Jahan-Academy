"""Approved MVP staff-role permission contract.

Resource ownership remains enforced by the owning domain: notably, a Consultant's
``lead.*.assigned`` capabilities require the lead's current assignee to be that user.
"""

from collections.abc import Mapping

ROLE_PERMISSION_MATRIX: Mapping[str, frozenset[str]] = {
    "super_admin": frozenset(
        {
            "identity.manage", "role.manage", "users.manage_staff", "audit.read",
            "reference_data.read", "reference_data.write", "catalog.read", "catalog.write",
            "media.read", "media.write", "content.read", "content.write", "content.publish",
            "lead.read.all", "lead.write.all", "lead.assign", "lead.sync.retry",
        }
    ),
    "support": frozenset(
        {"lead.read.all", "lead.write.all", "lead.assign", "lead.sync.retry"}
    ),
    "consultant": frozenset({"lead.read.assigned", "lead.write.assigned"}),
    "content_editor": frozenset(
        {
            "reference_data.read", "reference_data.write", "catalog.read", "catalog.write",
            "media.read", "media.write", "content.read", "content.write", "content.publish",
        }
    ),
}

