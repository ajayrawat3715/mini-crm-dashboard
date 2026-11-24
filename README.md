# Mini CRM Dashboard 📊
> **SHL Tech Internship – Task 1: Mini CRM Dashboard**  
> A full-stack, responsive lead management web application designed to track, organize, and convert business enquiries into loyal customers.

---

## 🚀 Live Demo & Repository
- **Live Demo:** [https://mini-crm-dashboard-eta.vercel.app](https://mini-crm-dashboard-eta.vercel.app)
- **GitHub Repository:** [https://github.com/ajayrawat3715/mini-crm-dashboard](https://github.com/ajayrawat3715/mini-crm-dashboard)

---

## 🌟 Highlights & Features

### 1. 📈 Dashboard Overview
- **Total Leads Counter:** Real-time tally of all received enquiries.
- **New Leads Count:** Highlights inquiries awaiting first response.
- **In Discussion / Contacted:** Tracks ongoing client interactions.
- **Converted Customers:** Measures closed deals.
- **Conversion Rate Metric:** Automatic percentage calculation to gauge sales efficiency.

### 2. 🗂️ Lead Management (Full CRUD)
- **Add New Lead:** Modal dialog with comprehensive input validation.
- **Edit Existing Lead:** Pre-filled edit modal to modify details or add notes.
- **Delete Lead:** Modal confirmation to prevent accidental loss of important data.
- **Lead Data Attributes:**
  - `name`: Full customer / contact person name.
  - `email`: Formatted email address with RFC-compliant validation.
  - `phone`: Contact telephone number with digit validation.
  - `businessName`: Company or organization name.
  - `status`: `New` | `Contacted` | `Converted`.
  - `notes`: Optional context (scope, meeting notes, requirements).

### 3. 🔍 Search, Filter & Quick Actions
- **Real-Time Search:** Search across contact name, email, company, and phone number simultaneously.
- **Status Filter Tabs:** One-click filter pills (`All`, `New`, `Contacted`, `Converted`) with live badge counts.
- **Inline Status Changer:** Change a lead's status directly from the table or card in 1 click without opening a modal.
- **Export to CSV:** One-click CSV download of active filtered leads.

### 4. 🗄️ Database & Backend Architecture
- **Persistent Storage:** Data is stored persistently using **Prisma ORM** with **SQLite** by default (zero cloud credentials needed to test) with immediate compatibility with **PostgreSQL / Supabase**.
- **RESTful API Routes:** Modular Next.js Route Handlers powering clean JSON endpoints for all CRUD operations.
- **One-Click Demo Data:** A built-in "Seed Sample Data" feature to instantly load 8 realistic business enquiries for testing.

### 5. 🎨 Polished User Experience (UX)
- **Responsive Layout:** Adaptive desktop table view and dedicated mobile card layout for phones and tablets.
- **Loading Skeletons:** Animated skeleton placeholders during network requests for a smooth visual experience.
- **Helpful Empty States:** Distinct, actionable empty states for "No leads yet", "No search results match", and "Network error".
- **Toast Notifications:** Non-intrusive animated feedback banners for success, update, error, and deletion events.
- **Robust Validation:** Double-layered form validation (client-side immediate visual cues + server-side schema protection).

---

## 🛠️ Tech Stack & Rationale

| Layer | Technology | Why Chosen? |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16.4.6 (App Router)** | Industry standard for modern React applications; provides unified routing, server-side API handlers, and high-performance client rendering. |
| **Language** | **TypeScript** | Strict type safety across database models, API payloads, and UI components; eliminates entire categories of runtime bugs. |
| **Cloud Database** | **Supabase (PostgreSQL)** | Production-grade cloud database with Row Level Security (RLS), real-time capabilities, PostgREST APIs, and automatic timestamps. |
| **Local Database & ORM** | **Prisma ORM (v6) + SQLite** | Self-contained, zero-configuration local fallback allowing evaluators to run and test the project completely offline with zero setup friction. |
| **Styling** | **Tailwind CSS** | Utility-first CSS providing a clean, accessible, consistent design system with rapid responsive layout styling. |
| **Icons** | **Lucide React** | Clean, modern, lightweight SVG icons that enhance UI readability. |

---

## 📁 Project Structure

```text
SHL_Project/
├── prisma/
│   ├── schema.prisma          # Database schema definition (Lead model)
│   └── seed.ts                # Database seeder script for realistic leads
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── leads/
│   │   │       ├── route.ts         # GET (list & stats), POST (create lead)
│   │   │       ├── [id]/
│   │   │       │   └── route.ts     # GET, PATCH (update), DELETE (remove)
│   │   │       └── seed/
│   │   │           └── route.ts     # POST (reset & seed demo leads)
│   │   ├── globals.css        # Tailwind directives and custom scrollbars/animations
│   │   ├── layout.tsx         # Root HTML layout with responsive metadata
│   │   └── page.tsx           # Main CRM Dashboard single-page experience
│   ├── components/
│   │   ├── Header.tsx         # Navbar with actions (Refresh, Seed, Add Lead)
│   │   ├── StatsOverview.tsx  # 4 KPI summary cards (Total, New, Contacted, Converted)
│   │   ├── SearchAndFilter.tsx# Search bar, filter pills, counter, and CSV export
│   │   ├── LeadsTable.tsx     # Desktop table & Mobile card views
│   │   ├── StatusBadge.tsx    # Color-coded interactive status badge
│   │   ├── LeadModal.tsx      # Add & Edit modal with field validation
│   │   ├── DeleteConfirmModal.tsx # Safe deletion prompt
│   │   ├── EmptyState.tsx     # Context-aware empty states
│   │   ├── SkeletonLoader.tsx # Pulse placeholders for loading states
│   │   └── Toast.tsx          # Lightweight animated toast notifications
│   ├── lib/
│   │   ├── prisma.ts          # Global Prisma client singleton
│   │   ├── seed-data.ts       # Initial demo dataset
│   │   └── validation.ts      # Shared input validation rules & regex
│   └── types/
│       └── lead.ts            # TypeScript interfaces for Lead, Stats & API
├── .env.example               # Template environment configuration
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

---

## ⚡ Quick Start Guide (Run Locally)

### Prerequisites
- **Node.js** v18+ or v20+ or v24+
- **npm**, **pnpm**, or **yarn**

### Step 1: Clone the repository
```bash
git clone https://github.com/ajayrawat3715/mini-crm-dashboard.git
cd mini-crm-dashboard
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create your local environment file from the provided template:
```bash
cp .env.example .env
```
*(By default, `.env` points to `file:./dev.db` which requires zero setup)*

### Step 4: Initialize and Seed Database
Sync the database schema and populate with initial demo leads:
```bash
npx prisma db push
npm run seed
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to test the CRM dashboard!

---

## 🗄️ Database Setup Instructions

This project includes a **dual-engine database architecture**:
1. **Supabase (Cloud PostgreSQL):** Fully integrated via `@supabase/supabase-js` and instant SQL migration script.
2. **Local SQLite (Zero-Config):** Automatically enabled whenever Supabase credentials are not provided, allowing zero-friction offline execution for evaluators.

---

### Option A: Supabase Integration (Cloud Database)
1. **Create a Free Project on Supabase:**
   - Sign up or log in at [supabase.com](https://supabase.com) and create a new project.
2. **Run the Database Schema:**
   - In your Supabase dashboard, go to the **SQL Editor** (`/project/_/sql`).
   - Open the provided [`supabase/schema.sql`](file:///Users/ajayrawat/Desktop/SHL_Project/supabase/schema.sql) file.
   - Copy the SQL content, paste it into the Supabase SQL Editor, and click **Run**.
   - This creates the `leads` table, indexes, RLS policies, and triggers.
3. **Copy Your API Keys to `.env`:**
   - In Supabase, navigate to **Project Settings** -> **API**.
   - Copy the **Project URL** and **anon public key**.
   - Add them to your `.env` file:
     ```env
     NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
     NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
     ```
4. **Restart the Next.js Server:**
   ```bash
   npm run dev
   ```
   *The app automatically detects the keys, switches to Supabase, and displays `DB: Supabase` in the navigation bar!*

---

### Option B: Local SQLite (Default, Zero-Config)
- Requires **no installation** or database server.
- The database is stored locally in `prisma/dev.db`.
- Run `npx prisma db push` to generate the file and table.
- Run `npm run seed` to insert initial leads.

---

## 🔌 API Reference

All endpoints return JSON responses with standard status codes.

| Method | Endpoint | Description | Payload / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/leads` | List leads and KPI stats | `?search=...&status=New` |
| `POST` | `/api/leads` | Create a new lead | `{ name, email, phone, businessName, status, notes? }` |
| `GET` | `/api/leads/:id` | Fetch single lead details | None |
| `PATCH` | `/api/leads/:id` | Update lead details or status | Partial `{ status?, name?, email?, ... }` |
| `DELETE` | `/api/leads/:id` | Permanently remove a lead | None |
| `POST` | `/api/leads/seed` | Reset & re-populate demo leads | None |

### Sample `POST /api/leads` Request:
```json
{
  "name": "David Miller",
  "email": "david.m@apexretail.co",
  "phone": "+1 (555) 987-6543",
  "businessName": "Apex Retail Solutions",
  "status": "New",
  "notes": "Interested in cloud inventory management."
}
```

### Sample Validation Error Response (`400 Bad Request`):
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": "Please enter a valid email address (e.g., name@example.com)"
  }
}
```

---

## 🧠 Challenges Faced & Solutions

1. **Seamless Reviewer Experience vs Database Portability:**
   - *Challenge:* Many candidate submissions fail evaluation because the reviewer doesn't have the candidate's exact local MySQL/PostgreSQL server running or cloud credentials expire.
   - *Solution:* Used Prisma ORM configured to SQLite by default with automated schema pushing and zero setup steps. In addition, built a one-click **"Load Demo Leads"** button directly in the web UI and an automated seed script so the evaluator can test immediately.

2. **Mobile Layout vs Desktop Data Density:**
   - *Challenge:* CRM dashboards typically feature wide tables with 6+ columns (lead name, company, email, phone, status, date, actions). On mobile screens, wide tables result in clunky horizontal scrolling.
   - *Solution:* Implemented dual presentation views: a clean high-density table on desktop (`md:` breakpoint and above) and responsive, tactile contact cards on mobile devices.

3. **Optimistic UI Updates for Instant Status Toggling:**
   - *Challenge:* Waiting for a network roundtrip every time an operator updates a lead's status makes CRM workflows feel sluggish.
   - *Solution:* Implemented optimistic state updates with rollback on network failure. When a status badge is clicked, the UI updates instantly while the PATCH request executes in the background.

4. **Multi-layer Validation:**
   - *Challenge:* Preventing bad data entry without frustrating users with delayed feedback.
   - *Solution:* Created a centralized validation module (`src/lib/validation.ts`) reused across both frontend forms (real-time validation with red borders & error notes) and server API endpoints (safeguarding against malformed direct requests).

---

## 🚢 Deployment to Production (Vercel)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete mini crm dashboard"
   git remote add origin https://github.com/your-username/mini-crm-dashboard.git
   git push -u origin main
   ```
2. Import the project into [Vercel](https://vercel.com).
3. Connect a PostgreSQL database (e.g. Supabase or Vercel Postgres) by adding the `DATABASE_URL` environment variable in the Vercel dashboard.
4. Deploy! Vercel runs `npm run build` which automatically executes `prisma generate && next build`.

---

## 👨‍💻 Author
- **Applicant:** Ajay Rawat
- **Role:** SHL Tech Internship – Task 1
- **Submission Date:** November 2026
