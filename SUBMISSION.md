# SHL Tech Internship – Task 1: Mini CRM Dashboard
## Official Project Submission Document

---

### 1. 🔗 Live Project Link
- **Production URL:** [https://mini-crm-dashboard-eta.vercel.app](https://mini-crm-dashboard-eta.vercel.app)
- **Deployment Platform:** Vercel (Production Environment with HTTPS & Edge Routing)
- **Status:** Active, Live & Connected to Supabase Cloud Database

---

### 2. 💻 GitHub Repository
- **Repository URL:** [https://github.com/ajayrawat3715/mini-crm-dashboard](https://github.com/ajayrawat3715/mini-crm-dashboard)
- **Main Branch:** `main`
- **Visibility:** Public

---

### 3. 📖 What Was Built & How to Run It

#### What Was Built:
A modern, full-stack, responsive Lead Management CRM web application designed to help businesses organize incoming sales inquiries, track their pipeline stages, and convert leads into paying customers.

**Core Capabilities:**
1. **Overview Dashboard & KPI Metrics:**
   - Real-time tally of **Total Leads**, **New Inquiries**, **In Discussion (Contacted)**, and **Converted Customers**.
   - Automatic live calculation of **Conversion Rate (%)** ($$\text{Converted} / \text{Total} \times 100$$).
2. **Comprehensive Lead Management (Full CRUD):**
   - **Create:** Modal dialog with strict validation (Name, Email, Phone, Business Name, Status, Notes).
   - **Read:** Live synchronized list from Supabase cloud database with instant loading skeletons.
   - **Update:** Pre-filled edit modal to modify lead attributes and contextual notes.
   - **Delete:** Two-step confirmation modal to prevent accidental data loss.
3. **Real-time Multi-attribute Search & Filtering:**
   - Instant client-side search across contact name, email, company name, and phone number simultaneously.
   - Status filter tabs (`All`, `New`, `Contacted`, `Converted`) with dynamic badge counters.
   - **One-click inline status toggle:** Change a lead's stage directly from the table or card without opening a modal.
4. **Data Portability:**
   - Built-in **Export to CSV** feature to download filtered inquiries.
   - **Load Demo Leads** button to populate 8 realistic sample inquiries with 1 click.
5. **Responsive UX & Visual Feedback:**
   - Dual-mode layout: dense desktop data table and dedicated touch-friendly mobile cards.
   - Animated toast notifications for all create, update, delete, and network events.
   - Context-aware empty states for zero leads, unmatched search queries, and error recovery.

---

#### How to Run Locally:

**Prerequisites:**
- Node.js v18.0.0 or higher
- npm (or yarn / pnpm)

```bash
# 1. Clone the repository
git clone https://github.com/ajayrawat3715/mini-crm-dashboard.git
cd mini-crm-dashboard

# 2. Install dependencies
npm install

# 3. Setup environment variables (zero setup needed for local SQLite)
cp .env.example .env

# 4. Generate database schema & seed demo data
npx prisma db push
npm run seed

# 5. Start development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 4. 🗄️ Database Setup Instructions

The application is engineered with a **Dual-Engine Architecture**:
1. **Cloud Database (Supabase PostgreSQL):** Used in production for multi-user cloud persistence.
2. **Local Database (Prisma ORM + SQLite):** Automatically used when running locally without cloud credentials, ensuring evaluators can test the project completely offline in under 60 seconds with zero setup friction.

---

#### Option A: Supabase Cloud Setup (Production)
1. **Create Project:** Sign in at [supabase.com](https://supabase.com) and create a new project.
2. **Execute Database Schema:**
   - Navigate to **SQL Editor** in your Supabase dashboard.
   - Paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql):
   ```sql
   CREATE TABLE IF NOT EXISTS public.leads (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       email TEXT NOT NULL,
       phone TEXT NOT NULL,
       business_name TEXT NOT NULL,
       status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Converted')),
       notes TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
   CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
   CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

   ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow public select on leads" ON public.leads FOR SELECT USING (true);
   CREATE POLICY "Allow public insert on leads" ON public.leads FOR INSERT WITH CHECK (true);
   CREATE POLICY "Allow public update on leads" ON public.leads FOR UPDATE USING (true);
   CREATE POLICY "Allow public delete on leads" ON public.leads FOR DELETE USING (true);
   ```
3. **Configure Environment Variables:**
   - In `.env`, provide your Supabase URL and Publishable/Anon Key:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-or-publishable-key"
   ```
   *The application automatically detects Supabase credentials and switches the UI badge to `DB: Supabase`.*

---

#### Option B: Local SQLite Setup (Zero Configuration)
- No database installation or account required.
- The SQLite database file resides at `prisma/dev.db`.
- Run `npx prisma db push` to create tables.
- Run `npm run seed` to insert sample records.

---

### 5. 🛠️ Technologies Used & Challenges Faced

#### Technologies Used & Rationale:

| Technology | Role | Why Chosen? |
| :--- | :--- | :--- |
| **Next.js 16.4.6 (App Router)** | Full-Stack Framework | Modern React 19 architecture with server-side API Route Handlers, high-performance static rendering, and streaming UI. |
| **TypeScript** | Programming Language | End-to-end type safety across database entities (`Lead`), API contracts (`ApiResponse`), and UI components. |
| **Supabase (PostgreSQL)** | Cloud Database | Enterprise-grade PostgreSQL with Row Level Security (RLS), auto-indexing, PostgREST REST APIs, and instant cloud persistence. |
| **Prisma ORM (v6.4.1)** | Object-Relational Mapper | Declarative schema modeling, automatic migration management, and clean offline SQLite fallback capability. |
| **Tailwind CSS** | Styling System | Utility-first responsive styling with clean color palettes, custom scrollbars, and accessible focus states. |
| **Lucide React** | Iconography | Lightweight, consistent SVG icon system enhancing readability and visual polish. |

---

#### Engineering Challenges Faced & Solutions:

1. **Vercel Security Compliance & Build System Upgrades (CVE Mitigations):**
   - *Challenge:* Vercel blocked legacy Next.js deployments due to critical security advisories (CVE-2025-66478 and CVE-2025-55184). In addition, canary builds with Turbopack caused occasional build panics on serverless containers.
   - *Solution:* Upgraded the application to Next.js `16.4.6` and configured `next build --webpack` in `package.json`, ensuring both strict security compliance and rock-solid compilation on Vercel build pipelines.

2. **Serverless Socket Freezing & Undici Latency (`TypeError: fetch failed`):**
   - *Challenge:* Vercel serverless functions in Washington D.C. (`iad1`) connecting to Supabase in Singapore (`ap-southeast-1`) experienced connection drops. When AWS Lambda containers froze and thawed, Node's Undici HTTP client attempted to reuse stale TCP keep-alive sockets closed by Cloudflare edge proxies, throwing `TypeError: fetch failed`.
   - *Solution:* Engineered a **Dual-Layer Connection Architecture**:
     - **Browser-Direct Client:** A dedicated client-side module ([`src/lib/supabase-client.ts`](./src/lib/supabase-client.ts)) that connects directly from the user's browser to Supabase PostgREST API with public RLS policies, bypassing the serverless middleman hop completely.
     - **Serverless Resilience:** On the server side ([`src/lib/db.ts`](./src/lib/db.ts)), configured `Connection: close` headers to prevent stale socket reuse, added `dns.setDefaultResultOrder("ipv4first")` to eliminate IPv6 DNS delays, and implemented a raw REST fallback.

3. **Evaluator Portability vs Production Reliability:**
   - *Challenge:* Many technical task evaluations fail because evaluators cannot run the project locally without installing specific database engines or setting up cloud accounts.
   - *Solution:* Designed a unified database abstraction layer ([`src/lib/db.ts`](./src/lib/db.ts)) that supports both Supabase Cloud PostgreSQL and a self-contained local SQLite database via Prisma. Reviewers can test online via Vercel or locally offline with zero configuration.

4. **Data Density on Mobile vs Desktop:**
   - *Challenge:* Full-width CRM tables with 7 columns (Name, Business, Email, Phone, Status, Date, Actions) cause awkward horizontal scrolling on mobile screens.
   - *Solution:* Built an adaptive responsive layout ([`src/components/LeadsTable.tsx`](./src/components/LeadsTable.tsx)) that renders a clean data grid on desktop screens (`md:` breakpoint and above) and transforms into card views on mobile devices.

5. **Optimistic UI Updates for Instant Interactivity:**
   - *Challenge:* Waiting for a network roundtrip every time an operator updates a lead's status makes CRM workflows feel sluggish.
   - *Solution:* Implemented optimistic state updates with rollback on failure. When a status badge is clicked, the UI updates instantly while the PATCH request executes in the background.

---

### 👨‍💻 Candidate Information
- **Candidate:** Ajay Rawat
- **Target Role:** SHL Tech Internship
- **Task:** Task 1 – Mini CRM Dashboard
- **Submission Date:** November 2026
