# 🚀 VoxPrice

### AI-Powered Voice-to-Quotation Automation Platform

\<p align="center">
&#x20; \*\*Turn customer conversations into professional quotations — faster, smarter, and more consistently.\*\*
\</p>

\<p align="center">
&#x20; \<img src="[https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge\&logo=python\&logoColor=white)" alt="Python"/>
&#x20; \<img src="[https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge\&logo=fastapi\&logoColor=white)" alt="FastAPI"/>
&#x20; \<img src="[https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge\&logo=google\&logoColor=white)" alt="Gemini"/>
&#x20; \<img src="[https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge\&logo=postgresql\&logoColor=white)" alt="PostgreSQL"/>
&#x20; \<img src="[https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge\&logo=vercel\&logoColor=white)" alt="Vercel"/>
\</p>

\<p align="center">
&#x20; \<a href="[https://github.com/WaheedAbbas199/Voice-based-pricing-automation](https://github.com/WaheedAbbas199/Voice-based-pricing-automation)">GitHub Repository\</a> •
&#x20; \<a href="#-features">Features\</a> •
&#x20; \<a href="#-installation">Installation\</a> •
&#x20; \<a href="#-deployment">Deployment\</a>
\</p>

---

## 💡 About VoxPrice

**VoxPrice** is an AI-powered business automation platform designed to simplify the quotation process.

Instead of manually listening to customer orders, identifying products, entering quantities, and calculating prices, businesses can use voice input or audio uploads to generate structured quotation data.

Powered by **Google Gemini AI**, VoxPrice transforms spoken customer requirements into editable order information. Users can review the extracted details, calculate accurate prices, and save quotations for future reference.

Beyond voice processing, VoxPrice includes an administrator dashboard and a configurable Content Management System (CMS), giving businesses control over products, pricing, website content, AI behavior, and application settings.

### The idea behind VoxPrice

\<blockquote>
&#x20; Automate repetitive quotation tasks so businesses can spend less time on manual data entry and more time serving their customers.
\</blockquote>

---

## ✨ Features

### 🎙️ AI-Powered Voice Processing

- Record customer orders directly through the browser.
- Upload existing audio recordings.
- Convert browser recordings to WAV before processing.
- Process audio using Google Gemini.
- Extract structured product and quantity information.
- Review and edit AI-generated order details.
- Handle missing API keys and AI processing errors.

### 🧾 Smart Quotation Management

- Maintain a centralized product catalog.
- Match extracted order details with available products.
- Calculate quotation totals on the backend.
- Save quotations to PostgreSQL.
- Maintain pricing history.
- Review previously generated quotations.
- Keep pricing calculations under server-side control.

### 🔐 Authentication & Access Control

- User registration and authentication.
- Secure login and logout.
- Profile and password management.
- Optional password-reset email support through SMTP.
- Backend-enforced role-based permissions.
- Login rate limiting.
- CSRF-related request protection.
- Secure HTTP-only session cookies.
- Security headers.

### 🛠️ Powerful Admin Dashboard

Manage important application operations from a centralized administration area:

- User and role management.
- Account activation and deactivation.
- Product catalog and pricing management.
- System limits and application settings.
- Activity logs and error monitoring.
- Administrative controls.

### 🎨 Dynamic Content Management System

Update application content without changing source code.

| CMS Module       | Capabilities                                               |
| ---------------- | ---------------------------------------------------------- |
| Website Content  | Brand name, headings, descriptions, footer                 |
| Landing Page     | Features, benefits, statistics and sections                |
| Pricing Content  | Pricing plans and related information                      |
| Social Proof     | Testimonials and FAQs                                      |
| Product Catalog  | Product information and prices                             |
| Theme Settings   | Colors, fonts and corner radius                            |
| AI Configuration | Gemini model, temperature and extraction prompt            |
| Feature Controls | Registration, recording, uploads and landing-page sections |

---

## ⚙️ How It Works

VoxPrice follows an AI-assisted quotation workflow:

```mermaid
flowchart TD
    A["Customer Order"] --> B["Browser Recording / Audio Upload"]
    B --> C["FastAPI Backend"]
    C --> D["Google Gemini AI"]
    D --> E["Transcription & Data Extraction"]
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

### Workflow Explained

1. **Capture:** Record a customer order or upload an audio file.
2. **Process:** Send the audio to the FastAPI backend.
3. **Understand:** Google Gemini extracts structured order information.
4. **Review:** The user verifies and edits the extracted details.
5. **Match:** Extracted products are matched against the product catalog.
6. **Calculate:** The backend calculates the quotation total.
7. **Save:** The quotation and related information are stored in PostgreSQL.

> **AI verification matters:** AI-generated information can contain errors. Always review product names, quantities, and order details before saving a quotation.

---

## 🧰 Technology Stack

| Technology        | Purpose                               |
| ----------------- | ------------------------------------- |
| Python 3.12       | Core programming language             |
| FastAPI           | Backend API and application server    |
| HTML5             | Frontend structure                    |
| CSS3              | Interface styling                     |
| JavaScript        | Frontend functionality                |
| Google Gemini API | Audio understanding and extraction    |
| PostgreSQL        | Persistent relational database        |
| Neon              | Cloud PostgreSQL hosting              |
| SQLAlchemy        | Database ORM                          |
| Psycopg           | PostgreSQL database driver            |
| Vercel            | Application deployment                |
| Git & GitHub      | Version control and source management |

---

## 🏗️ Project Architecture

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
│
├── scripts/
│
├── tests/
│
├── .env.example
├── .gitignore
├── pyproject.toml
├── requirements.txt
├── vercel.json
└── README.md
```

*The structure above is a simplified overview. Additional modules, frontend assets, and configuration files may exist in the repository.*

---

## 🚀 Installation

Follow these steps to run VoxPrice locally.

### Prerequisites

Make sure you have:

- Python 3.12 or newer.
- Git.
- A Google Gemini API key.
- PostgreSQL for the full database setup.
- Internet access for installing dependencies.

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

### 3. Install Dependencies

```bash
python -m pip install --upgrade pip

pip install -r requirements.txt
```

Alternatively:

```bash
pip install .
```

### 4. Configure Environment Variables

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure the required values.

### 5. Configure Google Gemini

Get your API key from:

[https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)

Add the key to `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Keep your API key private.

### 6. Configure PostgreSQL

For a local PostgreSQL database, use a connection string similar to:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME
```

Make sure the database exists and your PostgreSQL server is running.

### 7. Start the Application

```bash
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

Open VoxPrice in your browser:

[**http://localhost:8000**](http://localhost:8000)

---

## 🔑 Environment Variables

VoxPrice uses environment variables to separate application configuration from source code.

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
| `PORT`           | Server port                           |
| `SMTP_HOST`      | Optional SMTP server                  |
| `SMTP_PORT`      | Optional SMTP port                    |
| `SMTP_USER`      | SMTP username                         |
| `SMTP_PASSWORD`  | SMTP password                         |
| `SMTP_FROM`      | Email sender address                  |

### Example `.env`

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

**Configuration guidelines:**

- Use `.env.example` as the configuration template.
- Keep real credentials in `.env`.
- Never upload `.env` to GitHub.
- Use a strong, unique administrator password.
- Enable secure cookies when using HTTPS.
- Configure SMTP only when email delivery is required.
- Use the appropriate data directory for your hosting environment.

---

## 🗄️ Database Configuration

VoxPrice uses SQLAlchemy and PostgreSQL for application data.

### Neon PostgreSQL

For cloud deployment, VoxPrice supports Neon PostgreSQL.

**Setup:**

1. Create an account at [Neon](https://neon.tech/).
2. Create a PostgreSQL project.
3. Create or select your database.
4. Copy the connection string.
5. Add it to your deployment environment as `DATABASE_URL`.
6. Deploy or redeploy the application.

The application initializes its database tables during startup.

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

For production, configure regular database backups and test database restoration.

---

## ☁️ Deployment

VoxPrice is configured for deployment as a Python FastAPI application on Vercel.

### Deployment Architecture

```text
                 ┌────────────────────┐
                 │      Vercel        │
                 │  FastAPI Runtime   │
                 └─────────┬──────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
      ┌──────▼───────┐            ┌──────▼──────┐
      │   Frontend   │            │   Backend   │
      │ HTML/CSS/JS  │            │   FastAPI   │
      └──────────────┘            └──────┬──────┘
                                         │
                          ┌──────────────┴──────────────┐
                          │                             │
                   ┌──────▼──────┐               ┌──────▼──────┐
                   │ Google      │               │ Neon        │
                   │ Gemini AI   │               │ PostgreSQL  │
                   └─────────────┘               └─────────────┘
```

### Step 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Update VoxPrice application"
git push origin main
```

Before committing, verify that `.env` and all secret files are excluded by `.gitignore`.

### Step 2. Import the Repository into Vercel

1. Open [Vercel](https://vercel.com/).
2. Select **Add New Project**.
3. Import your GitHub repository.
4. Select the `main` branch.
5. Keep the project root directory as `./`.
6. Use the FastAPI framework configuration.

### Step 3. Configure Environment Variables

Open:

**Vercel → Project → Settings → Environment Variables**

Add the following production variables:

| Variable         | Value                             |
| ---------------- | --------------------------------- |
| `DATABASE_URL`   | Neon PostgreSQL connection string |
| `GEMINI_API_KEY` | Your Gemini API key               |
| `GEMINI_MODEL`   | `gemini-2.5-flash`                |
| `SECRET_KEY`     | Strong randomly generated secret  |
| `ADMIN_EMAIL`    | Administrator email               |
| `ADMIN_PASSWORD` | Strong administrator password     |
| `SEED_DEMO_DATA` | `false`                           |
| `COOKIE_SECURE`  | `true`                            |
| `PUBLIC_URL`     | Your deployed HTTPS URL           |
| `DATA_DIR`       | `/tmp/voxprice-data`              |

Add the variables to the deployment environments where required.

### Step 4. Generate a Secret Key

Run locally:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Add the generated value as `SECRET_KEY` in Vercel.

Never publish this value.

### Step 5. Deploy

1. Save the environment variables.
2. Open the Deployments section.
3. Deploy the latest GitHub commit.
4. Wait for the build to complete.
5. Open the generated deployment URL.

### Step 6. Verify the Application

Test the following:

- Homepage and frontend loading.
- Administrator login.
- Database connectivity.
- Product catalog.
- Audio upload.
- Gemini processing.
- Quotation calculations.
- Saving and reviewing quotations.
- CMS functionality.

A successful build does not by itself guarantee that all runtime features work. Test the deployed application after every important deployment.

### ⚠️ Important: Vercel File Storage

Vercel serverless environments do not provide permanent local filesystem storage.

VoxPrice uses:

```env
DATA_DIR=/tmp/voxprice-data
```

for its Vercel runtime data directory.

**Important:** Files stored in `/tmp` are temporary and may disappear when an instance is recycled.

For permanent uploaded audio and other files, integrate persistent object storage such as Vercel Blob or an S3-compatible service.

Neon PostgreSQL provides persistent database storage separately.

---

## 🔐 Security

Security is an important part of a business application.

Recommended practices:

- Never commit `.env` to GitHub.
- Never expose API keys in frontend JavaScript.
- Protect database credentials.
- Use strong and unique administrator credentials.
- Keep `SECRET_KEY` private.
- Use HTTPS in production.
- Enable secure session cookies.
- Apply server-side permission checks.
- Verify AI-generated information before saving quotations.
- Configure database backups.
- Use persistent storage for important uploaded files.
- Monitor application logs and errors.

---

## 🧪 Development

For local development:

```bash
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

The `--reload` option automatically restarts the development server when code changes are detected.

### Useful Development Practices

- Keep API requests centralized.
- Separate application configuration from source code.
- Keep database operations on the backend.
- Validate user input before processing.
- Keep pricing calculations server-controlled.
- Avoid exposing sensitive environment variables.
- Test changes before pushing them to the main branch.

---

## 🛠️ Troubleshooting

| Problem                      | What to Check                              |
| ---------------------------- | ------------------------------------------ |
| Application does not start   | Python version and installed dependencies  |
| Database connection fails    | `DATABASE_URL` and PostgreSQL availability |
| Gemini processing fails      | API key, model name and API availability   |
| Microphone unavailable       | Browser microphone permissions             |
| Audio upload fails           | File type, size and upload configuration   |
| Login fails                  | Credentials and database initialization    |
| Password-reset email missing | SMTP configuration                         |
| Vercel build fails           | Latest build logs and dependencies         |
| Vercel returns a 500 error   | Latest deployment Runtime Logs             |
| Uploaded files disappear     | Use persistent external storage            |
| Frontend displays demo data  | Open the backend-served application        |

For deployment issues, inspect:

**Vercel Dashboard → Project → Deployments → Latest Deployment → Runtime Logs**

Always investigate the newest error rather than relying on logs from previous deployments.

---

## 🗺️ Future Roadmap

Potential future improvements for VoxPrice include:

- [ ] Persistent cloud audio storage.
- [ ] PDF quotation generation.
- [ ] Email quotation delivery.
- [ ] Advanced quotation analytics.
- [ ] Multi-company support.
- [ ] Advanced product matching.
- [ ] Quotation approval workflows.
- [ ] Subscription and billing integration.
- [ ] More AI-powered business automation.

---

## 👨‍💻 Author

**Waheed Abbas**

AI Engineer | AI Automation & Agentic AI Enthusiast

- **GitHub:** [WaheedAbbas199](https://github.com/WaheedAbbas199)
- **Project:** [Voice-based-pricing-automation](https://github.com/WaheedAbbas199/Voice-based-pricing-automation)

---

## 📄 License

No open-source license has currently been specified.

Until a license is added, all rights remain with the copyright holder. Reuse, modification, and redistribution may be restricted.

---

\<p align="center">   \*\*VoxPrice\*\*   \<br/>   \<i>From customer voice to professional quotation.\</i>   \<br/>\<br/>   Built to make business quotation workflows smarter, faster, and more efficient. \</p>
