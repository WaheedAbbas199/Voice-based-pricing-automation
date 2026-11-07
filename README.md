# VoxPrice — Voice-based pricing automation (frontend + backend)

Speak or upload an order → **Google Gemini** transcribes it and extracts the details → you edit them → price is calculated → saved in **PostgreSQL**.
A built-in **CMS** lets an administrator change the website content, products, theme, AI prompt and feature switches without touching code.

```
voxprice/
├── main.py              ← run this. Starts database setup + backend + frontend
├── requirements.txt
├── .env.example         ← copy to .env (main.py does it for you)
├── docker-compose.yml   ← optional PostgreSQL in one command
├── backend/             ← FastAPI: auth, customers, quotations, history, audio→Gemini, admin, CMS
└── frontend/            ← HTML/CSS/vanilla JS (served by the backend)
```

## Quick start (all steps)

1. **Install Python 3.10+** (check: `python --version`).
2. **Get PostgreSQL** (pick one):
   - Docker: `docker compose up -d db` (matches the default `.env`), **or**
   - Install PostgreSQL yourself and put its address in `DATABASE_URL` in `.env`.
   - *No PostgreSQL yet?* Skip this and use `python main.py --sqlite` to try everything first.
3. **Get a Gemini API key** at https://aistudio.google.com/apikey.
4. Run once so `.env` is created: `python main.py` (it will also create `.venv` and install packages on first run — needs internet). Stop it with `Ctrl+C`.
5. **Edit `.env`**: set `GEMINI_API_KEY=...` (and `DATABASE_URL` if not using the Docker one).
6. **Run:** `python main.py`  → the browser opens `http://localhost:8000`.
7. **Log in** with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (default `admin@example.com` / `ChangeMe123!`) and **change the password** under *Profile*.
8. Open **Voice Assistant**, allow the microphone, record, **Process audio** → Gemini result appears → edit → **Calculate price** → **Save**.

`python main.py --help` shows: `--sqlite`, `--port`, `--host`, `--no-browser`.

## What the backend does
| Area | Details |
|---|---|
| Auth | Register/login/logout, password reset by email link (SMTP optional — otherwise the link is printed in the console), change password, profile. Scrypt password hashes, signed **httpOnly** session cookie, login rate-limit, CSRF header check, security headers/CSP. |
| Roles (enforced on the server) | **Admin** (everything + admin console + CMS) · **Manager** (create/edit/delete) · **Agent** (create/edit) · **Viewer** (read-only). |
| Data | PostgreSQL via SQLAlchemy: users, products, customers, quotations, pricing history, audio requests, activity, audit log, error log, settings, CMS items. Tables are created automatically. |
| Voice | `POST /api/audio/upload` stores the file; `POST /api/audio/transcribe` sends it to Gemini (model + prompt editable in the CMS). Browser recordings are converted to WAV in the browser first. If the key is missing or Gemini fails, you get a clear error — nothing is faked. |
| Maths | Totals are always recomputed on the server. |

## CMS (admin → sidebar → **CMS**)
Everything is stored in the database and takes effect immediately:
- **Site texts** — hero title, descriptions, headings, footer, brand name.
- **Features / How it works / Benefits / Stat boxes / Pricing plans / Testimonials / FAQ** — add, edit, delete, hide, reorder.
- **Products** — the price catalog used by the calculator and by Gemini matching.
- **Theme & fonts** — colours, corner radius, heading/body fonts (live preview, applies to every page).
- **AI (Gemini)** — model, temperature, full extraction prompt, *Test connection* button.
- **Features on/off** — hide landing sections, allow sign-ups, allow recording/upload.

The **Admin console** adds user management (roles, activate/deactivate, temp passwords), per-product prices, system limits, logs and error monitoring.

## Configuration (`.env`)
`DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_DEMO_DATA`, `HOST`, `PORT`, `COOKIE_SECURE`, `PUBLIC_URL`, `SMTP_*`, `SECRET_KEY` — all explained inside `.env.example`. The API key never reaches the browser.

## Deploying
Set `COOKIE_SECURE=true`, `PUBLIC_URL=https://your-domain`, a strong `ADMIN_PASSWORD`, and put the app behind HTTPS (nginx/Caddy). Run `python main.py --host 0.0.0.0 --no-browser`. Back up the PostgreSQL database and the `data/uploads` folder (audio is auto-deleted after the retention set in Admin → System).

## Frontend only (no backend)
`cd frontend && python -m http.server 8000` runs a **demo mode** with sample data in localStorage (transcription is simulated and labelled as sample data). When the backend serves the files, `js/env.js` switches the app to real-API mode automatically.

## Development notes
- Frontend: single `window.VP` namespace, no build step. `js/api.js` is the only file that calls `fetch`.
- To restyle: `frontend/css/variables.css` (or use the CMS Theme tab). Dark values live in `themes.css`.
