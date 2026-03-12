# Implementation Roadmap — PrepWise

## Phase 0 — Foundation (Week 1–2)

### 0.1 Project Setup
- [x] Initialize Next.js 14 project with TypeScript
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Set up Prisma with PostgreSQL
- [x] Configure Clerk authentication
- [x] Set up environment variables
- [x] Initialize Git, ESLint, Prettier
- [x] Create base layout components (shell, nav, footer)
- [x] Set up CI/CD (GitHub Actions → Vercel)

### 0.2 Database & Auth
- [ ] Define full Prisma schema
- [ ] Run migrations
- [ ] Clerk webhook to sync users to DB
- [ ] Middleware for route protection
- [ ] Role-based access (user vs admin)

---

## Phase 1 — Marketing Site + Auth (Week 2–3)

### 1.1 Marketing Pages
- [ ] Landing page with hero, features, social proof
- [ ] Features page
- [ ] Pricing page with plan comparison
- [ ] FAQ page
- [ ] Reviews page
- [ ] Desktop app download page

### 1.2 Auth Flow
- [ ] Sign up page (email + OAuth)
- [ ] Sign in page
- [ ] Onboarding wizard (5-step flow)
- [ ] Profile setup and preferences

---

## Phase 2 — Dashboard + Core Data (Week 3–5)

### 2.1 Dashboard
- [ ] Dashboard overview page
- [ ] Readiness score widget
- [ ] Recent sessions list
- [ ] Quick-start actions
- [ ] Credits/subscription status bar

### 2.2 Resume Management
- [ ] Resume upload (PDF/DOCX → S3)
- [ ] Resume parsing job (AI extraction)
- [ ] Resume list view
- [ ] Resume detail/edit view

### 2.3 Job Description Management
- [ ] JD creation form (paste text)
- [ ] JD analysis job (AI extraction)
- [ ] JD list view
- [ ] JD detail view with extracted skills
- [ ] Question generation from JD

---

## Phase 3 — Mock Interview Engine (Week 5–8)

### 3.1 Session Infrastructure
- [ ] Session creation API
- [ ] Session setup UI (role, type, duration)
- [ ] WebSocket server for real-time streaming
- [ ] Audio capture and streaming

### 3.2 Speech-to-Text
- [ ] Deepgram WebSocket integration
- [ ] Real-time transcript rendering
- [ ] Transcript chunk persistence

### 3.3 AI Coaching Pipeline
- [ ] Question detection from transcript
- [ ] Answer framework generation (STAR, technical, system design)
- [ ] Key points and concept hints
- [ ] Follow-up question generation
- [ ] Real-time coaching panel UI

### 3.4 Session Completion
- [ ] End session flow
- [ ] Post-session feedback generation (background job)
- [ ] Session summary view
- [ ] Transcript view with timestamps
- [ ] Coaching report with scores

---

## Phase 4 — Feedback Engine (Week 8–9)

- [ ] Scoring algorithms (clarity, relevance, confidence, structure, conciseness)
- [ ] Filler-word detection and counting
- [ ] Pacing analysis (WPM calculation)
- [ ] Improvement suggestion generation
- [ ] Historical score tracking
- [ ] Progress charts on dashboard

---

## Phase 5 — Resume Builder (Week 9–11)

- [ ] Full resume editor UI
- [ ] Section-by-section editing
- [ ] JD keyword comparison view
- [ ] AI bullet rewriting
- [ ] ATS optimization score
- [ ] Cover letter generation
- [ ] PDF export with template
- [ ] Resume version history

---

## Phase 6 — Billing & Subscriptions (Week 11–13)

- [ ] Stripe product/price setup
- [ ] Checkout flow
- [ ] Billing portal integration
- [ ] Webhook handlers (subscription lifecycle)
- [ ] Credit system with ledger
- [ ] Credit pack purchases
- [ ] Usage metering per session
- [ ] Plan limit enforcement
- [ ] Invoice history page
- [ ] Grace period handling

---

## Phase 7 — Desktop App (Week 13–16)

- [ ] Tauri project setup
- [ ] Shared React components from web app
- [ ] Native microphone access
- [ ] Audio streaming to backend
- [ ] Real-time transcript + coaching panels
- [ ] Session management
- [ ] Auto-update system
- [ ] Cross-platform builds (Windows, macOS, Linux)
- [ ] Download page with platform detection

---

## Phase 8 — Admin Panel (Week 16–18)

- [ ] Admin layout and navigation
- [ ] User management (list, search, detail, suspend)
- [ ] Plan management CRUD
- [ ] Credit management (grant, adjust)
- [ ] Feature flag management
- [ ] Support ticket queue
- [ ] Analytics dashboard (revenue, users, sessions)
- [ ] Audit log viewer

---

## Phase 9 — Polish & Launch (Week 18–20)

- [ ] Comprehensive error handling and loading states
- [ ] Rate limiting implementation
- [ ] Security audit (OWASP top 10)
- [ ] Performance optimization
- [ ] SEO optimization for marketing pages
- [ ] Dark mode refinement
- [ ] Mobile responsive testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Privacy policy and terms of service
- [ ] GDPR compliance (data export, deletion)
- [ ] End-to-end testing
- [ ] Monitoring and alerting setup (Sentry)
- [ ] Production deployment
- [ ] Beta user testing
- [ ] Launch 🚀

---

## Phase 10 — Post-Launch (Ongoing)

- [ ] User feedback collection
- [ ] A/B testing on pricing and CTAs
- [ ] Mobile app (React Native)
- [ ] Team/enterprise plans
- [ ] Interview recording (video)
- [ ] Interviewer mode (practice being the interviewer)
- [ ] Community question bank
- [ ] Integration with LinkedIn, job boards
