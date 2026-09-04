"""FastAPI application factory (implementation/02-project-structure.md, 15-backend-api.md).

Layers (L2/L3) are entrypoints that call the Runtime (L4+). Runtime is built once at
startup and stored on app.state. No business logic lives in the app factory.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import instruction, tasks
from app.log import get_logger, configure_logging
from app.realtime.websocket import router as realtime_router
from app.runtime.runtime import build_runtime

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    app.state.runtime = await build_runtime()
    logger.info("startup_complete")
    yield
    logger.info("shutdown")


def create_app() -> FastAPI:
    app = FastAPI(title="AI Agent Platform", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(instruction.router)
    app.include_router(tasks.router)
    app.include_router(realtime_router)

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
