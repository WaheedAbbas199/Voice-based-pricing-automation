import pypandoc

readme = r"""# VoxPrice

**Voice-powered pricing automation for faster, more consistent quotations.**

VoxPrice turns spoken or uploaded customer orders into editable quotation line items. Google Gemini processes the audio and extracts order details; users review the result, calculate pricing, and save quotations to PostgreSQL.

The application also includes an administrator-managed CMS for updating website content, product catalog data, theme settings, AI extraction behavior, and feature availability without changing source code.

---

## Table of contents

- [Table of contents](#table-of-contents)
- [Overview](#overview)
- [Key features](#key-features)
  - [Voice-based order processing](#voice-based-order-processing)
  - [Quotation and pricing workflow](#quotation-and-pricing-workflow)
  - [Authentication and access control](#authentication-and-access-control)
  - [Administration and CMS](#administration-and-cms)
- [How it works](#how-it-works)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Getting started](#getting-started)
  - [1. Get the source code](#1-get-the-source-code)
  - [2. Check Python](#2-check-python)
  - [3. Configure the database](#3-configure-the-database)
  - [4. Create the environment file and install dependencies](#4-create-the-environment-file-and-install-dependencies)
  - [5. Add your Gemini API key](#5-add-your-gemini-api-key)
  - [6. Start VoxPrice](#6-start-voxprice)
  - [7. Sign in as administrator](#7-sign-in-as-administrator)
  - [8. Process your first order](#8-process-your-first-order)
- [Environment configuration](#environment-configuration)
- [Using VoxPrice](#using-voxprice)
  - [Standard quotation workflow](#standard-quotation-workflow)
  - [Frontend demo mode](#frontend-demo-mode)
- [Roles and permissions](#roles-and-permissions)
- [Admin CMS](#admin-cms)
- [Database](#database)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [Development notes](#development-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

Traditional quotation workflows often require staff to listen to customer orders, manually enter products and quantities, calculate totals, and save the results. VoxPrice streamlines this process with a voice-assisted workflow.

1. Record an order in the browser or upload an audio file.
2. VoxPrice sends the audio to the backend.
3. Google Gemini transcribes and extracts structured order details.
4. The user reviews and edits the extracted information.
5. The backend recalculates the quotation total.
6. The quotation is saved and can be reviewed later.

> **Important:** AI-extracted information is a starting point for the user to review. Always verify products, quantities, and other order details before saving a quotation.

## Key features

### Voice-based order processing
- Record an order using the browser microphone.
- Upload an existing audio file.
- Convert browser recordings to WAV before processing.
- Use Google Gemini for transcription and structured detail extraction.
- Review and edit extracted details before calculating a price.
- Receive clear errors when the Gemini API key is missing or the service fails. The application does not present simulated transcription as a real result.

### Quotation and pricing workflow
- Maintain a product catalog.
- Match extracted order details against catalog products.
- Calculate quotation totals on the server.
- Save quotations and retain pricing history.
- Review previous quotations.

### Authentication and access control
- Register, log in, and log out.
- Change profile details and passwords.
- Support password-reset links through SMTP, or print the reset link to the server console when SMTP is not configured.
- Use server-enforced role-based permissions.
- Apply login rate limiting, CSRF header checks, secure session cookies, and security headers.

### Administration and CMS
Administrators can manage:
- Website text, headings, descriptions, and footer content.
- Landing-page sections such as features, benefits, statistics, pricing plans, testimonials, and FAQs.
- Product catalog entries used by the pricing calculator and AI matching.
- Theme colors, corner radius, and heading/body fonts.
- Gemini model settings, temperature, and extraction prompt.
- Feature switches, including sign-ups, recording, uploads, and landing-page sections.
- Users, roles, account activation, product prices, system limits, logs, and error monitoring.

CMS changes are stored in the database and take effect without editing application source files.

## How it works

```text
Customer order
     |
     v
Browser recording / audio upload
     |
     v
FastAPI audio endpoint
     |
     v
Google Gemini
(transcription + structured extraction)
     |
     v
User reviews and edits order details
     |
     v
Server-side pricing calculation
     |
     v
PostgreSQL quotation + pricing history
```

## Technology stack

| Layer | Technology |
|---|---|
| Backend API | Python, FastAPI |
| Frontend | HTML, CSS, vanilla JavaScript |
| AI audio processing | Google Gemini |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | Signed HTTP-only session cookie, Scrypt password hashing |
| Local fallback database | SQLite |
| Optional local database service | Docker Compose |

## Project structure

```text
voxprice/
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
├── .env.example            # Environment configuration template
├── docker-compose.yml      # Optional PostgreSQL service
├── backend/                # FastAPI application
│   ├── auth/               # Authentication and session handling
│   ├── customers/          # Customer management
│   ├── quotations/         # Quotation and pricing workflows
│   ├── audio/              # Audio upload and Gemini processing
│   ├── admin/              # Administrative APIs
│   └── cms/                # CMS functionality
└── frontend/
    ├── index.html
    ├── css/
    │   ├── variables.css   # Main theme variables
    │   └── themes.css      # Theme definitions
    └── js/
        ├── api.js          # Centralized API requests
        └── env.js          # Runtime environment detection
```

The backend and frontend subfolders may contain additional modules and assets beyond this simplified overview.

## Requirements

- Python 3.10 or newer
- A Google Gemini API key
- PostgreSQL for the production-style database setup, or SQLite for a quick local trial
- Docker Desktop (optional, if using the included PostgreSQL service)
- Internet access during first-time dependency installation

## Getting started

### 1. Get the source code

Clone the repository and enter the project directory:

```bash
git clone <YOUR_REPOSITORY_URL>
cd voxprice
```

If you already have the project files, open a terminal in the project root.

### 2. Check Python

```bash
python --version
```

Make sure Python 3.10 or newer is installed.

### 3. Configure the database

Choose one of the following options.

**Option A — PostgreSQL with Docker Compose**

Start the database service:

```bash
docker compose up -d db
```

Make sure the `DATABASE_URL` in your `.env` matches the credentials and port configured in `docker-compose.yml`.

**Option B — Existing PostgreSQL installation**

Create or select a PostgreSQL database, then set its connection URL in `.env`.

**Option C — SQLite quick trial**

You can try the application without setting up PostgreSQL:

```bash
python main.py --sqlite
```

SQLite is intended as a convenient local trial option. Use PostgreSQL for a production deployment.

### 4. Create the environment file and install dependencies

Run the application once:

```bash
python main.py
```

According to the project startup behavior, the first run creates `.env` when it is missing, creates a virtual environment, and installs the required packages. This step requires internet access.

Stop the application with `Ctrl+C` after the initial setup if you need to edit configuration.

### 5. Add your Gemini API key

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).

Open `.env` and set:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Also configure `DATABASE_URL` if you are using PostgreSQL.

### 6. Start VoxPrice

```bash
python main.py
```

The application should start at:

[http://localhost:8000](http://localhost:8000)

To see all supported command-line options:

```bash
python main.py --help
```

Available options include:

| Option | Purpose |
|---|---|
| `--sqlite` | Use SQLite for a local trial |
| `--port` | Set the application port |
| `--host` | Set the host/interface to bind to |
| `--no-browser` | Do not automatically open a browser |

### 7. Sign in as administrator

Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured in `.env`.

The documented initial defaults are:

- Email: `admin@example.com`
- Password: `ChangeMe123!`

These defaults are for local setup only. Change the administrator password immediately after signing in. Never use default credentials in a public deployment.

### 8. Process your first order

1. Open **Voice Assistant**.
2. Allow microphone access, or upload an audio recording.
3. Select **Process audio**.
4. Review the details returned by Gemini.
5. Correct product names, quantities, or other extracted fields as needed.
6. Select **Calculate price**.
7. Review the calculated total and select **Save**.

## Environment configuration

The `.env.example` file documents the available configuration. Common variables include:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Database connection URL |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Gemini model identifier |
| `ADMIN_EMAIL` | Initial administrator email |
| `ADMIN_PASSWORD` | Initial administrator password |
| `SEED_DEMO_DATA` | Controls demo/seed data behavior |
| `HOST` | Server bind host |
| `PORT` | Server port |
| `COOKIE_SECURE` | Enables secure-cookie behavior |
| `PUBLIC_URL` | Public application URL |
| `SMTP_*` | Optional email delivery configuration |
| `SECRET_KEY` | Secret used for signing/security-related operations |

Use the exact variable names and formats in your local `.env.example`. Do not commit `.env` or real credentials to Git.

## Using VoxPrice

### Standard quotation workflow

The typical workflow is:

- Select or create a customer.
- Capture or upload the customer's spoken order.
- Process the audio with Gemini.
- Review and correct the extracted order details.
- Calculate the quotation.
- Save the quotation for future reference.

The backend recalculates totals so the browser is not trusted as the source of pricing truth.

### Frontend demo mode

The frontend can be run without the backend for a limited UI demonstration:

```bash
cd frontend
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

In this mode, the frontend uses sample data stored in `localStorage`. Transcription is simulated and labelled as sample data. This is not the real Gemini-backed workflow.

When the frontend is served by the backend, `js/env.js` automatically switches the app to real-API mode.

## Roles and permissions

Permissions are enforced by the backend, not just hidden in the frontend.

| Role | Permissions |
|---|---|
| **Admin** | Full access, including administration and CMS |
| **Manager** | Create, edit, and delete operational records |
| **Agent** | Create and edit permitted records |
| **Viewer** | Read-only access |

Actual permissions should always be verified against the server-side authorization rules in the running version.

## Admin CMS

Open the administrator area and select **CMS** from the sidebar.

| CMS area | What administrators can manage |
|---|---|
| Site content | Brand name, hero title, descriptions, headings, footer |
| Landing-page sections | Features, benefits, statistics, pricing plans, testimonials, FAQs |
| Products | Product catalog and pricing data used by the calculator and AI matching |
| Theme and fonts | Colors, corner radius, heading font, body font |
| Gemini settings | Model, temperature, extraction prompt, connection test |
| Feature switches | Landing sections, sign-ups, recording, and upload availability |

The Admin Console also provides user and role management, account activation/deactivation, temporary passwords, system limits, logs, and error monitoring.

## Database

VoxPrice uses SQLAlchemy to work with PostgreSQL. The application creates its tables automatically during startup.

The documented data areas include:

- Users
- Products
- Customers
- Quotations
- Pricing history
- Audio requests
- Activity records
- Audit logs
- Error logs
- Application settings
- CMS items

For production, configure regular database backups and test the restore process.

## Deployment

For a production deployment:

1. Provision a PostgreSQL database.
2. Configure all required environment variables in the hosting provider's secret/environment settings.
3. Set `COOKIE_SECURE=true`.
4. Set `PUBLIC_URL` to the HTTPS URL of the deployed application.
5. Set a strong, unique `ADMIN_PASSWORD` and `SECRET_KEY`.
6. Configure SMTP if password-reset emails should be delivered.
7. Run the application with a production-appropriate process/server configuration.
8. Put the application behind HTTPS using a reverse proxy such as Nginx or Caddy, or an equivalent managed platform.
9. Configure persistent storage for required uploads.
10. Back up PostgreSQL and the `data/uploads` directory.
11. Configure and verify the audio-retention policy in **Admin → System**.

The documented command for starting the app without automatically opening a browser is:

```bash
python main.py --host 0.0.0.0 --no-browser
```

**Hosting note:** This project is a Python FastAPI application that serves its frontend. A static-only hosting configuration is not sufficient for the complete application. Choose a hosting platform that supports a persistent Python web service and configure database and upload storage appropriately. Confirm the platform's filesystem, process, timeout, and database requirements before deployment.

## Security notes

- Keep `.env` out of version control.
- Never expose `GEMINI_API_KEY`, `SECRET_KEY`, database credentials, or SMTP credentials to frontend code.
- Replace default administrator credentials before exposing the app publicly.
- Use HTTPS and secure cookies in production.
- Restrict database access to trusted services.
- Back up the database and required uploaded files.
- Review access logs, audit logs, and error logs.
- Treat AI-extracted order details as unverified until reviewed by a user.

## Development notes

- The frontend uses HTML, CSS, and vanilla JavaScript; no frontend build step is required by the documented setup.
- Frontend modules share a `window.VP` namespace.
- `frontend/js/api.js` is the centralized location for API `fetch` calls.
- `frontend/css/variables.css` contains the main theme variables.
- `frontend/css/themes.css` contains dark-theme values.
- Theme settings can also be changed through the CMS.
- Keep secrets and environment-specific values in environment configuration, not source files.

## Troubleshooting

| Issue | What to check |
|---|---|
| Application cannot connect to PostgreSQL | Confirm PostgreSQL is running and `DATABASE_URL` is correct |
| Gemini processing fails | Confirm `GEMINI_API_KEY`, model configuration, network access, and API availability |
| Microphone is unavailable | Check browser microphone permissions; use a supported browser context |
| Password-reset email is not received | Configure and verify the `SMTP_*` settings; otherwise check the server console for the reset link |
| Frontend shows sample data | Confirm you opened the backend-served application rather than the standalone demo server |
| Port is already in use | Start the application with a different `--port` value |
| Uploads are missing after deployment | Check that `data/uploads` uses persistent storage on the hosting platform |

## License

No license has been specified yet. Unless a license is added to this repository, all rights remain with the copyright holder and reuse, modification, or redistribution may be restricted.

---

**VoxPrice** — Turn spoken orders into reviewed, calculated, and saved quotations.
"""

output_path = "/mnt/data/README.md"
pypandoc.convert_text(readme, "md", format="md", outputfile=output_path, extra_args=["--standalone"])
print(f"Created {output_path}")
