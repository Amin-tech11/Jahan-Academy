"""One memory-heavy operation per API process, shared by authentication and media."""

from threading import BoundedSemaphore

heavy_work_slot = BoundedSemaphore(1)
