"""Convenience entrypoint exposing the FastAPI app for Uvicorn."""

from __future__ import annotations

from backend.app.main import app as fastapi_app

__all__ = ["app"]

# Expose the FastAPI instance for `uvicorn backend.main:app`.
app = fastapi_app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

