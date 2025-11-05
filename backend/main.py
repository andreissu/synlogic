"""Convenience entrypoint exposing the FastAPI app for Uvicorn."""

from __future__ import annotations

try:  # When imported as ``backend.main`` from the repo root
    from backend.app.main import app as fastapi_app
except ModuleNotFoundError:  # When running from within ``backend/``
    from app.main import app as fastapi_app

__all__ = ["app"]

# Expose the FastAPI instance for `uvicorn backend.main:app`.
app = fastapi_app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

