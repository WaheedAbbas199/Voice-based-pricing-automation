# 🚀 VoxPrice

### AI-Powered Voice-to-Quotation Automation Platform

\<p align="center">   \<strong>Transform customer conversations into professional quotations — faster, smarter, and more consistently.\</strong> \</p>

\<p align="center">   \<img src="[https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge\&logo=python\&logoColor=white)" alt="Python"/>   \<img src="[https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge\&logo=fastapi\&logoColor=white)" alt="FastAPI"/>   \<img src="[https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge\&logo=google\&logoColor=white)" alt="Google Gemini"/>   \<img src="[https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge\&logo=postgresql\&logoColor=white)" alt="PostgreSQL"/>   \<img src="[https://img.shields.io/badge/Deployment-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white](https://img.shields.io/badge/Deployment-Vercel-000000?style=for-the-badge\&logo=vercel\&logoColor=white)" alt="Vercel"/> \</p>

\<p align="center">   \<a href="[https://voice-based-pricing-automation-liard.vercel.app/](https://voice-based-pricing-automation-liard.vercel.app/)">Live Application\</a> •   \<a href="[https://github.com/WaheedAbbas199/Voice-based-pricing-automation](https://github.com/WaheedAbbas199/Voice-based-pricing-automation)">GitHub Repository\</a> •   \<a href="#-features">Features\</a> •   \<a href="#-installation">Installation\</a> •   \<a href="#-deployment">Deployment\</a> \</p>

---

## 💡 About VoxPrice

**VoxPrice** is an AI-powered business automation platform that simplifies and accelerates the quotation generation process.

Traditional quotation workflows often require employees to manually listen to customer orders, identify products, enter quantities, search product catalogs, and calculate prices.

VoxPrice streamlines this process through AI-powered voice understanding and automated quotation management.

Using **Google Gemini AI**, the platform processes recorded customer conversations and audio uploads, extracts structured product requirements, and converts them into editable quotation data.

Users can review extracted information, match products against a centralized catalog, calculate accurate prices through backend-controlled logic, and save quotations for future reference.

The platform also provides an administrative dashboard and a configurable Content Management System (CMS), allowing administrators to manage products, pricing, users, website content, AI settings, and application configurations.

### 🎯 Project Vision

> Turn customer conversations into structured business data and professional quotations while reducing repetitive manual work.

---

## ✨ Features

### 🎙️ AI-Powered Voice Processing

- Record customer orders directly through the browser.
- Upload existing audio recordings.
- Convert browser recordings into WAV format before processing.
- Process audio using Google Gemini AI.
- Extract structured product names and quantities.
- Review and edit AI-generated order information.
- Handle missing API keys and AI processing errors.

### 🧾 Smart Quotation Management

- Centralized product catalog.
- AI-assisted product matching.
- Backend-controlled quotation calculations.
- Automated quotation total generation.
- PostgreSQL-based quotation storage.
- Pricing history management.
- Previous quotation retrieval and review.

### 🔐 Authentication & Security

- User registration and authentication.
- Secure login and logout.
- Profile and password management.
- Optional password-reset email support through SMTP.
- Backend-enforced role-based permissions.
- Login rate limiting.
- CSRF-related request protection.
- HTTP-only session cookies.
- Security headers.

### 🛠️ Administration Dashboard

Manage application operations through a centralized administrative interface.

- User and role management.
- Account activation and deactivation.
- Product catalog management.
- Pricing management.
- Application configuration.
- System limits.
- Activity monitoring.
- Error and administrative logs.

### 🎨 Dynamic Content Management System

Update application content without directly modifying source code.

| CMS Module       | Capabilities                                               |
| ---------------- | ---------------------------------------------------------- |
| Website Content  | Brand name, headings, descriptions and footer              |
| Landing Page     | Features, benefits, statistics and sections                |
| Pricing Content  | Pricing plans and related information                      |
| Social Proof     | Testimonials and FAQs                                      |
| Product Catalog  | Product information and prices                             |
| Theme Settings   | Colors, typography and corner radius                       |
| AI Configuration | Gemini model, temperature and extraction prompts           |
| Feature Controls | Registration, recording, uploads and landing-page sections |

---

## ⚙️ How VoxPrice Works

VoxPrice follows an AI-assisted quotation workflow.

```mermaid
flowchart TD
    A["Customer Order"] --> B["Browser Recording / Audio Upload"]
    B --> C["FastAPI Backend"]
    C --> D["Google Gemini AI"]
    D --> E["Structured Data Extraction"]
    E --> F["User Reviews Extracted Information"]
    F --> G["Product Matching"]
    G --> H["Server-Side Price Calculation"]
    H --> I["PostgreSQL Database"]
    I --> J["Saved Quotation & Pricing History"]

    style A fill:#2563eb,color:#fff
    style D fill:#4285f4,color:#fff
    style I fill:#336791,color:#fff
    style J fill:#059669,color:#fff
```

### Workflow Breakdown

1. **Capture:** Record a customer order or upload an audio file.
2. **Process:** Send the audio to the FastAPI backend.
3. **Understand:** Google Gemini extracts structured order information.
4. **Review:** Users verify and edit the extracted information.
5. **Match:** Extracted products are matched against the product catalog.
6. **Calculate:** The backend calculates quotation prices and totals.
7. **Save:** Quotations and related information are stored in PostgreSQL.

> **Important:** AI-generated information may contain errors. Always verify product names, quantities, and order details before generating or saving a quotation.

---

## 🧰 Technology Stack

| Technology        | Purpose                                 |
| ----------------- | --------------------------------------- |
| Python 3.12+      | Core programming language               |
| FastAPI           | Backend API and application server      |
| HTML5             | Frontend structure                      |
| CSS3              | User interface styling                  |
| JavaScript        | Frontend functionality                  |
| Google Gemini API | Audio understanding and data extraction |
| PostgreSQL        | Relational database                     |
| Neon              | Cloud PostgreSQL hosting                |
| SQLAlchemy        | Database ORM                            |
| Psycopg           | PostgreSQL database driver              |
| Vercel            | Application deployment                  |
| Git & GitHub      | Version control and source management   |

---

## 🏗️ Project Architecture

The following is a simplified conceptual overview. Refer to the actual repository for the complete and current directory structure.

```text
Voice-based-pricing-automation/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── seed.py
│   ├── api_admin.py
│   ├── api_auth.py
│   ├── api_cms.py
│   ├── api_core.py
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── ...
│
├── data/
├── scripts/
├── tests/
│
├── .env.example
├── .gitignore
├── pyproject.toml
├── requirements.txt
├── vercel.json
└── README.md
```

---

## 🚀 Installation & Local Setup

Follow these instructions to run VoxPrice locally.

### Prerequisites

- Python 3.12 or newer.
- Git.
- Google Gemini API key.
- PostgreSQL database.
- Internet connection for dependency installation.

### 1. Clone the Repository

```bash
git clone https://github.com/WaheedAbbas199/Voice-based-pricing-automation.git

cd Voice-based-pricing-automation
```

### 2. Create a Virtual Environment

**Windows PowerShell:**

```powershell
python -m venv .venv

.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
python3 -m venv .venv

source .venv/bin/activate
```

### 3. Install Dependencies

```bash
python -m pip install --upgrade pip

pip install -r requirements.txt
```

Alternatively, if the project metadata supports installation:

```bash
pip install .
```

### 4. Configure Environment Variables

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Update the required configuration values inside `.env`.

### 5. Configure Google Gemini

Get your API key from:

[Google AI Studio](https://aistudio.google.com/apikey)

Add the following configuration:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Keep your API key private. Never expose it in frontend JavaScript or commit it to GitHub.

### 6. Configure PostgreSQL

Example database connection string:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME
```

Ensure your PostgreSQL server is running and the database exists.

### 7. Start the Application

Use the startup command supported by your repository.

For a backend module exposing `app`:

```bash
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

Open:

[**http://localhost:8000**](http://localhost:8000)

If your repository uses a different application entry point, use the corresponding command documented in its startup configuration.

---

## 🔑 Environment Variables

VoxPrice uses environment variables to keep application configuration separate from source code.

| Variable         | Description                           |
| ---------------- | ------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string          |
| `GEMINI_API_KEY` | Google Gemini API key                 |
| `GEMINI_MODEL`   | Gemini model identifier               |
| `ADMIN_EMAIL`    | Initial administrator email           |
| `ADMIN_PASSWORD` | Initial administrator password        |
| `SECRET_KEY`     | Application security secret           |
| `DATA_DIR`       | Application data and upload directory |
| `SEED_DEMO_DATA` | Demo/seed data configuration          |
| `COOKIE_SECURE`  | Secure-cookie configuration           |
| `PUBLIC_URL`     | Public application URL                |
| `HOST`           | Server bind host                      |
| `PORT`           | Application server port               |
| `SMTP_HOST`      | Optional SMTP server                  |
| `SMTP_PORT`      | Optional SMTP port                    |
| `SMTP_USER`      | SMTP username                         |
| `SMTP_PASSWORD`  | SMTP password                         |
| `SMTP_FROM`      | Email sender address                  |

### Example Configuration

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=CHANGE_THIS_PASSWORD

SECRET_KEY=

SEED_DEMO_DATA=false

DATA_DIR=./data

COOKIE_SECURE=false
PUBLIC_URL=

HOST=127.0.0.1
PORT=8000

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=no-reply@voxprice.local
```

**Configuration Guidelines**

- Use `.env.example` as the configuration template.
- Keep real credentials inside `.env`.
- Never commit `.env` to GitHub.
- Use a strong, unique administrator password.
- Enable secure cookies in HTTPS production environments.
- Configure SMTP only when email delivery is required.
- Use suitable persistent storage for important uploaded files.

---

## 🗄️ Database Configuration

VoxPrice uses SQLAlchemy and PostgreSQL for persistent application data.

### Neon PostgreSQL Setup

For cloud deployment, VoxPrice supports Neon PostgreSQL.

1. Create an account at [Neon](https://neon.tech/).
2. Create a PostgreSQL project.
3. Create or select your database.
4. Copy the PostgreSQL connection string.
5. Add it to your deployment environment as `DATABASE_URL`.
6. Deploy or redeploy the application.

The application initializes its database tables through its configured startup process.

### Main Data Areas

- Users and authentication.
- Products and catalog information.
- Customers.
- Quotations.
- Pricing history.
- Audio processing records.
- CMS content.
- Application settings.
- Activity and audit records.
- Error logs.

For production environments, configure regular database backups and test database restoration procedures.

---

## ☁️ Deployment

VoxPrice is configured for deployment as a Python FastAPI application on Vercel.

### Deployment Architecture

```text
                    ┌─────────────────────┐
                    │       Vercel        │
                    │   Application Host  │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          ┌──────▼──────┐             ┌──────▼──────┐
          │  Frontend   │             │  FastAPI    │
          │ HTML/CSS/JS │             │   Backend   │
          └─────────────┘             └──────┬──────┘
                                             │
                               ┌─────────────┴─────────────┐
                               │                           │
                        ┌──────▼──────┐             ┌──────▼──────┐
                        │ Gemini AI   │             │ Neon        │
                        │             │             │ PostgreSQL  │
                        └─────────────┘             └─────────────┘
```

### 1. Push Code to GitHub

```bash
git add .

git commit -m "Update VoxPrice application"

git push origin main
```

Before committing, verify that `.env` and sensitive credentials are excluded through `.gitignore`.

### 2. Import the Repository into Vercel

1. Open [Vercel](https://vercel.com/).
2. Select **Add New Project**.
3. Import your GitHub repository.
4. Select the `main` branch.
5. Configure the project root directory.
6. Verify the Python runtime and deployment configuration.

### 3. Configure Production Environment Variables

Navigate to:

**Vercel → Project → Settings → Environment Variables**

Configure the required values:

| Variable         | Production Configuration          |
| ---------------- | --------------------------------- |
| `DATABASE_URL`   | Neon PostgreSQL connection string |
| `GEMINI_API_KEY` | Your Gemini API key               |
| `GEMINI_MODEL`   | Supported Gemini model            |
| `SECRET_KEY`     | Strong randomly generated secret  |
| `ADMIN_EMAIL`    | Administrator email               |
| `ADMIN_PASSWORD` | Strong administrator password     |
| `SEED_DEMO_DATA` | `false`                           |
| `COOKIE_SECURE`  | `true`                            |
| `PUBLIC_URL`     | Your deployed HTTPS URL           |
| `DATA_DIR`       | `/tmp/voxprice-data`              |

Only configure variables that are actually supported by the application.

### 4. Generate a Secret Key

Run locally:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Add the generated value to Vercel as `SECRET_KEY`.

Never publish this value.

### 5. Deploy

1. Save environment variables.
2. Open the Deployments section.
3. Deploy the latest GitHub commit.
4. Wait for the deployment to complete.
5. Open the deployed application.

### 6. Verify Production Functionality

Test the following:

- Homepage and frontend loading.
- Administrator authentication.
- Database connectivity.
- Product catalog.
- Audio recording and upload.
- Gemini processing.
- Quotation calculations.
- Saving and retrieving quotations.
- CMS functionality.
- User permissions and security controls.

A successful deployment build does not guarantee that every runtime feature works. Verify important workflows after deployment.

### ⚠️ Important: Vercel File Storage

Vercel serverless environments do not provide permanent local filesystem storage.

For temporary runtime files, VoxPrice can use:

```env
DATA_DIR=/tmp/voxprice-data
```

Files stored in `/tmp` are temporary and may disappear when an instance is recycled.

For permanent audio uploads and other important files, integrate persistent object storage such as Vercel Blob or an S3-compatible service.

Neon PostgreSQL provides persistent database storage separately.

---

## 🔐 Security Best Practices

Security is essential for a business application that handles customer orders, quotations, and account information.

Recommended practices:

- Never commit `.env` to GitHub.
- Never expose API keys in frontend code.
- Protect database credentials.
- Use strong administrator credentials.
- Keep `SECRET_KEY` private.
- Enforce HTTPS in production.
- Enable secure session cookies.
- Apply backend permission checks.
- Validate uploaded audio files.
- Verify AI-generated information before saving quotations.
- Configure database backups.
- Use persistent storage for important files.
- Monitor application logs and errors.

---

## 🧪 Development & Testing

For local development:

```bash
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

The `--reload` option automatically restarts the development server when code changes are detected.

### Recommended Development Practices

- Keep API requests centralized.
- Separate application configuration from source code.
- Perform database operations on the backend.
- Validate user input before processing.
- Keep pricing calculations server-controlled.
- Protect sensitive environment variables.
- Test changes before pushing to the main branch.

---

## 🛠️ Troubleshooting

| Problem                      | What to Check                                    |
| ---------------------------- | ------------------------------------------------ |
| Application does not start   | Python version and installed dependencies        |
| Database connection fails    | `DATABASE_URL` and PostgreSQL availability       |
| Gemini processing fails      | API key, model name and API availability         |
| Microphone unavailable       | Browser microphone permissions and HTTPS         |
| Audio upload fails           | File type, file size and upload configuration    |
| Login fails                  | Credentials and database initialization          |
| Password-reset email missing | SMTP configuration                               |
| Vercel build fails           | Build logs and dependencies                      |
| Vercel returns HTTP 500      | Latest deployment Runtime Logs                   |
| Uploaded files disappear     | Persistent external storage                      |
| Frontend displays demo data  | API configuration and backend-served application |

For deployment issues, inspect:

**Vercel Dashboard → Project → Deployments → Latest Deployment → Runtime Logs**

Always investigate the latest deployment logs rather than relying on errors from previous deployments.

---

## 🗺️ Future Roadmap

Potential improvements for future VoxPrice releases:

- [ ] Persistent cloud audio storage.
- [ ] Professional PDF quotation generation.
- [ ] Email quotation delivery.
- [ ] Advanced quotation analytics.
- [ ] Multi-company and multi-tenant support.
- [ ] Advanced AI-powered product matching.
- [ ] Quotation approval workflows.
- [ ] Subscription and billing integration.
- [ ] Advanced reporting and business insights.
- [ ] Additional AI-powered business automation.

---

## 👨‍💻 Author

**Waheed Abbas**

AI Engineer | AI Automation & Agentic AI Enthusiast

- **GitHub:** [WaheedAbbas199](https://github.com/WaheedAbbas199)
- **Project Repository:** [VoxPrice – Voice-based Pricing Automation](https://github.com/WaheedAbbas199/Voice-based-pricing-automation)
- **Live Application:** [VoxPrice](https://voice-based-pricing-automation-liard.vercel.app/)

---

## 📄 License

No open-source license has currently been specified.

Until a license is added, all rights remain with the copyright holder. Reuse, modification, and redistribution may be restricted.

---

\<p align="center">
&#x20; \<strong>VoxPrice\</strong>
&#x20; \<br/>
&#x20; \<em>From customer voice to professional quotation.\</em>
&#x20; \<br/>\<br/>
&#x20; Built to make business quotation workflows smarter, faster, and more efficient.
\</p>
