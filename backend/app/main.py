import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, engine
from app import models
from app.routers.auth import router as auth_router
from app.routers.contacts import router as contacts_router
from app.routers.messages import router as messages_router
from app.routers.realtime import router as realtime_router
from app.routers.media import router as media_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create missing tables during development.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sha'sapp API",
    description="Backend API for the Sha'sapp messaging platform",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["Authorization", "Content-Type"],
)

# Register API routers.
app.include_router(auth_router)
app.include_router(contacts_router)
app.include_router(messages_router)
app.include_router(realtime_router)
app.include_router(media_router)


@app.get("/")
def home():
    return {
        "app": "Sha'sapp",
        "status": "online",
        "message": "Sha'sapp API is running",
    }


@app.get("/api/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except SQLAlchemyError:
        return {
            "status": "unhealthy",
            "database": "disconnected",
        }