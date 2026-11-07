"""FastAPI application: JSON API under /api and the static frontend at /."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from . import api_admin, api_auth, api_cms, api_core
from .config import FRONTEND_DIR, UPLOAD_DIR
from .seed import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}
CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; "
       "img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    init_db()
    yield


app = FastAPI(title="VoxPrice API", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


@app.middleware("http")
async def guard(request: Request, call_next):
    # CSRF defence: browsers cannot add a custom header cross-site without a CORS preflight, which we never allow.
    if request.url.path.startswith("/api/") and request.method in UNSAFE and request.headers.get("x-requested-with") != "VoxPrice":
        return JSONResponse({"detail": "Missing request header."}, status_code=403)
    resp = await call_next(request)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "same-origin")
    resp.headers.setdefault("Content-Security-Policy", CSP)
    resp.headers.setdefault("Permissions-Policy", "microphone=(self)")
    if request.url.path.startswith("/api/"):
        resp.headers.setdefault("Cache-Control", "no-store")
    return resp


for r in (api_auth.router, api_core.router, api_admin.router, api_cms.router):
    app.include_router(r, prefix="/api")


@app.get("/js/env.js", include_in_schema=False)
def env_js():
    """Served by the backend so the same frontend files switch from demo mode to real-API mode automatically."""
    return Response("window.__ENV__ = { API_BASE_URL: '/api', USE_MOCK: false, BACKEND: true };\n", media_type="application/javascript", headers={"Cache-Control": "no-cache"})


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
