# AGENTS.md

## 1. AI Landing Page Auditor (Frontend)

- Location: `src/app/`
- Description: React/Next.js interface for inputting URLs and displaying AI audits.
- Key Components:
  - `Page.tsx`: Main page with URL input form
  - `layout.tsx`: App layout and styling
  - `globals.css`: Tailwind CSS styles

## 2. Landing Page Auditor Backend (Scraper + AI)

- Location: `landing-page-auditor/`
- Description: FastAPI backend that scrapes landing pages and runs AI analysis
- Key Components:
  - `app/main.py`: FastAPI application entry point
  - `app/scraper.py`: HTML scraping with `httpx` and `BeautifulSoup`
  - `app/ai_analyst.py`: Gemini AI prompt engineering for analysis
  - `app/llm.py`: Gemini API integration and response parsing
  - `app/schemas.py`: Pydantic models for data validation
  - `.env.local`: Environment variables and API keys
  - `requirements.txt`: Python dependencies

## 3. Supabase Database (PostgreSQL)

- Location: Managed service via Supabase
- Schema:
  - `audits` table: Stores audit results with URL, title, description, content, ai_summary
  - `created_at` timestamp
- Tables:
  - `public.audits`
  - `public.documents`
- Column structure:
  - `id`: UUID primary key
  - `url`: VARCHAR
  - `title`: TEXT
  - `content`: TEXT
  - `ai_summary`: JSONB
  - `created_at`: TIMESTAMPTZ
