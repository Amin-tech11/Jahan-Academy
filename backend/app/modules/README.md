# Domain Module Contract

Each module owns its business language and may add these files only when needed:

- `router.py`: FastAPI HTTP translation and dependency wiring.
- `schemas.py`: Pydantic request/response contracts.
- `domain.py`: framework-independent entities, value objects, and state rules.
- `service.py`: application use cases and transaction orchestration.
- `repository.py`: repository protocols and SQLAlchemy implementations.
- `models.py`: SQLAlchemy persistence mappings owned by this module.
- `policies.py`: authorization decisions for commands and objects.
- `events.py`: versioned internal/outbox event contracts.
- `tasks.py`: thin Celery adapters that invoke services.

Modules must not import another module's `models.py` or repository implementation. Cross-module behavior uses an application-service interface, stable read contract, or outbox/internal event. `app.core` contains infrastructure composition; `app.shared` contains only small stable primitives.
