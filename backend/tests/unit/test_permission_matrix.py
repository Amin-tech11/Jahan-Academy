from app.modules.identity.permission_matrix import ROLE_PERMISSION_MATRIX


def test_approved_staff_matrix_is_least_privilege() -> None:
    assert ROLE_PERMISSION_MATRIX["consultant"] == {
        "lead.read.assigned",
        "lead.write.assigned",
    }
    assert ROLE_PERMISSION_MATRIX["support"] == {
        "lead.read.all",
        "lead.write.all",
        "lead.assign",
        "lead.sync.retry",
    }
    assert "lead.read.all" not in ROLE_PERMISSION_MATRIX["content_editor"]
    assert "identity.manage" not in ROLE_PERMISSION_MATRIX["support"]


def test_super_admin_contains_global_mvp_operational_capabilities() -> None:
    super_admin = ROLE_PERMISSION_MATRIX["super_admin"]
    assert {
        "lead.read.all",
        "lead.write.all",
        "lead.assign",
        "lead.sync.retry",
        "identity.manage",
        "role.manage",
    } <= super_admin
