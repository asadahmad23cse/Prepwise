# Product Requirements Document — PrepWise

**Version:** 1.0
**Date:** 2026-03-12
**Status:** Draft

---

## 1. Executive Summary

PrepWise is an AI-powered interview preparation and coaching platform that helps job seekers practice interviews in real time, receive structured answer guidance, improve delivery, and tailor preparation to specific job descriptions and resumes. It consists of a **web application** (landing, dashboard, billing, resume tools) and a **desktop application** (mock interview workspace with live audio coaching).

**Ethical framing:** PrepWise is strictly a preparation and coaching tool. It is NOT a covert live-interview answer generator. All real-time AI assistance operates exclusively in mock/practice/coaching mode.

---

## 2. Problem Statement

Job seekers lack affordable, personalized, and interactive ways to prepare for interviews. Existing solutions are either:
- Static question banks with no feedback
- Expensive human coaching ($100–300/session)
- Generic advice not tailored to specific roles or companies

PrepWise bridges this gap with AI-driven mock interviews, real-time coaching, resume optimization, and JD-aware question generation.

---

## 3. Target Users

| Role | Description |
|------|------------|
| **Job Seeker** | Primary user — prepares for interviews, uploads resumes, practices mock sessions |
| **Career Changer** | Needs extra guidance translating skills across domains |
| **New Graduate** | Limited experience, needs STAR story coaching |
| **Senior Professional** | System design, leadership, strategy interview prep |

---

## 4. User Roles & Permissions

### 4.1 Guest
- View marketing site, pricing, features, FAQ
- Cannot access dashboard or practice tools

### 4.2 Authenticated User
- Full access to dashboard
- Upload resumes and job descriptions
- Run mock interview sessions (within plan limits)
- Access AI resume builder
- View history, feedback, transcripts
- Manage subscription and billing

### 4.3 Admin
- All user permissions
- User management (view, suspend, impersonate)
- Plan & pricing management
- Credit management
- Feature flag toggles
- Support ticket management
- Analytics dashboard (revenue, usage, retention)

---

## 5. Product Modules

### Module A — Marketing Website
- Hero section with product demo video/animation
- Feature highlights (mock interviews, resume builder, JD analyzer)
- Social proof — testimonials and review cards
- Pricing table with plan comparison
- FAQ accordion
- CTA for free trial signup
- Desktop app download promotion
- Footer with legal links

### Module B — Authentication & Onboarding
- Email/password registration
- Google and GitHub OAuth
- Onboarding wizard:
  1. Select target role (SWE, PM, DS, Design, etc.)
  2. Select interview type (behavioral, technical, system design, mixed)
  3. Upload resume (PDF/DOCX)
  4. Paste or upload job description
  5. Choose experience level (entry, mid, senior, staff+)
  6. AI generates personalized prep plan

### Module C — Dashboard
- Interview readiness score (composite metric)
- Recent mock interview sessions with scores
- Saved resumes list
- Saved job descriptions list
- Recommended practice questions (AI-generated)
- Usage: credits remaining, sessions this month
- Subscription status and upgrade CTA
- Quick-start buttons for new session

### Module D — Mock Interview Workspace (Desktop)
- Session setup: choose role, company, domain, interview type
- Voice input via system microphone
- Live transcript panel (rolling STT output)
- Detected question panel (AI identifies question from speech)
- Suggested answer framework panel:
  - STAR structure for behavioral
  - Approach/tradeoff hints for technical
  - Key points to mention
  - Concept explanations
- Follow-up question suggestions
- Behavioral vs technical mode toggle
- Session timer with configurable duration
- End session → AI generates summary and coaching report
- Save transcript and feedback to cloud dashboard

### Module E — Feedback Engine
After each session, AI produces:
- **Clarity score** — how clear and understandable
- **Relevance score** — alignment with the question
- **Confidence score** — inferred from pace, filler words, hedging
- **Structure score** — use of frameworks (STAR, etc.)
- **Conciseness score** — signal-to-noise ratio
- **Filler-word analysis** — count and frequency of "um", "like", "you know"
- **Pacing analysis** — words per minute, pauses
- **Improvement suggestions** — actionable next steps

### Module F — Resume Builder
- Upload resume (PDF or DOCX)
- AI parses sections: experience, skills, education, projects, certifications
- Compare against target job description
- ATS keyword optimization — highlight missing keywords
- Bullet point rewriting suggestions
- Cover letter generation from resume + JD
- Export optimized resume to PDF
- Version history

### Module G — Billing & Subscriptions
- Plans: Free Trial (7 days), Starter (monthly), Pro (monthly), Annual
- Credit packs for pay-as-you-go usage
- Stripe Checkout for payment
- Stripe Customer Portal for self-service billing management
- Usage metering: sessions, AI calls, resume builds
- Webhooks for plan changes, payment failures, cancellations
- Grace period on failed payments

### Module H — Admin Panel
- User list with search, filter, sort
- User detail: profile, usage, subscription, sessions
- Plan management: create, edit, disable plans
- Credit management: grant, revoke, adjust
- Feature flags: toggle features per plan or globally
- Support ticket queue with status workflow
- Analytics: revenue, MRR, churn, active users, session volume

---

## 6. Key Workflows

### 6.1 New User Signup → First Mock Interview
1. User visits landing page
2. Clicks "Start Free Trial"
3. Signs up with email or OAuth
4. Completes onboarding wizard
5. AI generates personalized question set
6. User downloads desktop app (or uses web preview)
7. Starts mock interview session
8. Speaks into microphone → STT transcribes
9. AI detects question type and generates coaching response
10. User completes session
11. AI produces feedback report
12. Summary saved to dashboard

### 6.2 Resume Optimization
1. User uploads resume
2. AI parses and structures content
3. User pastes target JD
4. AI compares and identifies gaps
5. AI suggests keyword additions and bullet rewrites
6. User accepts/edits suggestions
7. Exports optimized PDF

### 6.3 Subscription Upgrade
1. User hits usage limit or sees upgrade CTA
2. Selects plan on pricing page
3. Stripe Checkout processes payment
4. Webhook confirms subscription
5. Credits and limits updated immediately
6. User continues with expanded access

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance** | Dashboard loads < 2s, STT latency < 500ms, AI response < 3s |
| **Scale** | Support 10K concurrent users, 1M stored sessions |
| **Security** | HTTPS everywhere, encrypted PII, signed file uploads, rate limiting |
| **Privacy** | GDPR-aware data handling, user data export, account deletion |
| **Availability** | 99.9% uptime target for web app |
| **Accessibility** | WCAG 2.1 AA compliance for web app |
| **Audit** | Log all destructive actions, admin actions, billing events |

---

## 8. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Web) | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Desktop App | Tauri 2.x (Rust + WebView), React frontend |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | Clerk |
| Billing | Stripe (Checkout, Billing Portal, Webhooks) |
| LLM | OpenAI GPT-4o (with fallback to GPT-4o-mini) |
| Speech-to-Text | Deepgram Nova-2 (real-time WebSocket) |
| File Storage | S3-compatible (AWS S3 or Cloudflare R2) |
| Queue/Jobs | Inngest or BullMQ |
| Deployment | Vercel (web), GitHub Releases (desktop) |
| Monitoring | Sentry, Vercel Analytics |

---

## 9. Success Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| Registered users | 10,000 |
| Paid subscribers | 500 |
| Monthly mock sessions | 25,000 |
| Resume builds | 5,000 |
| NPS | > 50 |
| MRR | $15,000 |
| Churn rate | < 5% monthly |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Misuse as live-interview cheating tool | Enforce practice-mode-only framing, add ethical disclaimers, no stealth mode |
| High LLM costs | Token budgets per plan, caching common responses, GPT-4o-mini fallback |
| STT accuracy issues | Use Deepgram Nova-2 (best-in-class), allow manual corrections |
| Stripe webhook failures | Idempotent handlers, retry logic, manual reconciliation admin tool |
| Data privacy concerns | Encrypt PII, auto-delete old sessions, GDPR compliance |
