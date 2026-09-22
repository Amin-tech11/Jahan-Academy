import ast
from pathlib import Path

MODULE_ROOT = Path(__file__).resolve().parents[2] / "app" / "modules"


def test_modules_do_not_import_other_module_internals() -> None:
    violations: list[str] = []
    for path in MODULE_ROOT.glob("*/*.py"):
        owner = path.parent.name
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            imported = ""
            if isinstance(node, ast.ImportFrom):
                imported = node.module or ""
            elif isinstance(node, ast.Import):
                imported = next(
                    (alias.name for alias in node.names if alias.name.startswith("app.modules.")),
                    "",
                )
            prefix = "app.modules."
            if not imported.startswith(prefix):
                continue
            target_parts = imported[len(prefix) :].split(".")
            target = target_parts[0]
            internal = len(target_parts) > 1 and target_parts[1] in {"models", "repository"}
            if target != owner and internal:
                violations.append(f"{path}: imports {imported}")
    assert violations == []
