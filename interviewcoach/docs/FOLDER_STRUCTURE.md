# Folder Structure — PrepWise

## Web App (`/web`)

```
web/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (marketing)/           # Marketing pages (public)
│   │   │   ├── page.tsx           # Landing / hero
│   │   │   ├── features/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── desktop/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)/                # Auth pages
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── onboarding/            # Onboarding wizard
│   │   │   └── page.tsx
│   │   ├── dashboard/             # Main app (protected)
│   │   │   ├── page.tsx           # Overview
│   │   │   ├── resumes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── interviews/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── admin/                 # Admin panel (admin-only)
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── plans/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── tickets/page.tsx
│   │   │   ├── feature-flags/page.tsx
│   │   │   ├── audit-log/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── users/
│   │   │   │   └── me/route.ts
│   │   │   ├── resumes/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── optimize/route.ts
│   │   │   │       └── export/route.ts
│   │   │   ├── job-descriptions/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── questions/route.ts
│   │   │   ├── sessions/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── feedback/route.ts
│   │   │   │       └── transcript/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── detect-question/route.ts
│   │   │   │   ├── generate-answer/route.ts
│   │   │   │   ├── analyze-jd/route.ts
│   │   │   │   ├── parse-resume/route.ts
│   │   │   │   ├── optimize-bullets/route.ts
│   │   │   │   ├── cover-letter/route.ts
│   │   │   │   ├── session-feedback/route.ts
│   │   │   │   └── readiness-score/route.ts
│   │   │   ├── billing/
│   │   │   │   ├── subscription/route.ts
│   │   │   │   ├── checkout/route.ts
│   │   │   │   ├── portal/route.ts
│   │   │   │   ├── credits/route.ts
│   │   │   │   └── invoices/route.ts
│   │   │   ├── uploads/
│   │   │   │   ├── presigned-url/route.ts
│   │   │   │   └── confirm/route.ts
│   │   │   ├── templates/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── users/route.ts
│   │   │   │   ├── plans/route.ts
│   │   │   │   ├── analytics/route.ts
│   │   │   │   ├── tickets/route.ts
│   │   │   │   ├── feature-flags/route.ts
│   │   │   │   ├── credits/grant/route.ts
│   │   │   │   └── audit-log/route.ts
│   │   │   └── webhooks/
│   │   │       ├── clerk/route.ts
│   │   │       └── stripe/route.ts
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── progress.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── marketing-header.tsx
│   │   │   ├── marketing-footer.tsx
│   │   │   ├── dashboard-sidebar.tsx
│   │   │   ├── dashboard-header.tsx
│   │   │   ├── admin-sidebar.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── marketing/
│   │   │   ├── hero.tsx
│   │   │   ├── feature-grid.tsx
│   │   │   ├── pricing-table.tsx
│   │   │   ├── testimonial-card.tsx
│   │   │   ├── faq-accordion.tsx
│   │   │   └── cta-section.tsx
│   │   ├── dashboard/
│   │   │   ├── readiness-score.tsx
│   │   │   ├── recent-sessions.tsx
│   │   │   ├── credits-bar.tsx
│   │   │   ├── quick-actions.tsx
│   │   │   └── stats-cards.tsx
│   │   ├── interview/
│   │   │   ├── session-setup.tsx
│   │   │   ├── transcript-panel.tsx
│   │   │   ├── question-panel.tsx
│   │   │   ├── answer-panel.tsx
│   │   │   ├── session-timer.tsx
│   │   │   └── feedback-report.tsx
│   │   ├── resume/
│   │   │   ├── resume-upload.tsx
│   │   │   ├── resume-editor.tsx
│   │   │   ├── keyword-matcher.tsx
│   │   │   └── ats-score.tsx
│   │   ├── onboarding/
│   │   │   ├── step-role.tsx
│   │   │   ├── step-type.tsx
│   │   │   ├── step-resume.tsx
│   │   │   ├── step-jd.tsx
│   │   │   └── step-level.tsx
│   │   └── shared/
│   │       ├── page-header.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       ├── error-boundary.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── file-upload.tsx
│   │       └── score-badge.tsx
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── auth.ts                # Clerk helpers
│   │   ├── stripe.ts              # Stripe client + helpers
│   │   ├── openai.ts              # OpenAI client
│   │   ├── deepgram.ts            # Deepgram client
│   │   ├── s3.ts                  # S3 client
│   │   ├── utils.ts               # General utilities
│   │   ├── validations.ts         # Zod schemas
│   │   └── constants.ts           # App constants
│   ├── hooks/
│   │   ├── use-user.ts
│   │   ├── use-subscription.ts
│   │   ├── use-credits.ts
│   │   ├── use-audio-recorder.ts
│   │   ├── use-websocket.ts
│   │   └── use-media-query.ts
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── resume.service.ts
│   │   ├── session.service.ts
│   │   ├── billing.service.ts
│   │   ├── jd.service.ts
│   │   └── feedback.service.ts
│   ├── jobs/
│   │   ├── resume-parse.ts
│   │   ├── jd-analyze.ts
│   │   ├── session-feedback.ts
│   │   └── session-cleanup.ts
│   └── types/
│       ├── api.ts
│       ├── session.ts
│       ├── resume.ts
│       └── billing.ts
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── middleware.ts
```

## Desktop App (`/desktop`)

```
desktop/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                # Tauri entry point
│   │   ├── audio.rs               # Native audio capture
│   │   └── commands.rs            # Tauri commands (IPC)
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── icons/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── session/
│   │   │   ├── SessionWorkspace.tsx
│   │   │   ├── TranscriptPanel.tsx
│   │   │   ├── QuestionPanel.tsx
│   │   │   ├── AnswerPanel.tsx
│   │   │   ├── SessionControls.tsx
│   │   │   └── SessionTimer.tsx
│   │   ├── audio/
│   │   │   ├── AudioCapture.tsx
│   │   │   └── AudioVisualizer.tsx
│   │   ├── layout/
│   │   │   ├── TitleBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBar.tsx
│   │   └── ui/                    # Shared UI components
│   ├── hooks/
│   │   ├── use-audio-stream.ts
│   │   ├── use-stt-websocket.ts
│   │   ├── use-ai-coaching.ts
│   │   └── use-session.ts
│   ├── lib/
│   │   ├── api-client.ts          # HTTP client to web API
│   │   ├── audio-processor.ts
│   │   ├── stt-client.ts
│   │   └── constants.ts
│   ├── stores/
│   │   ├── session-store.ts       # Zustand store
│   │   └── auth-store.ts
│   └── types/
│       └── index.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── tailwind.config.ts
```

## UI Pages List

| # | Route | Page | Module |
|---|-------|------|--------|
| 1 | `/` | Landing page | Marketing |
| 2 | `/features` | Features showcase | Marketing |
| 3 | `/pricing` | Plan comparison | Marketing |
| 4 | `/reviews` | Testimonials | Marketing |
| 5 | `/faq` | FAQ | Marketing |
| 6 | `/desktop` | Desktop download | Marketing |
| 7 | `/sign-in` | Sign in | Auth |
| 8 | `/sign-up` | Sign up | Auth |
| 9 | `/onboarding` | Onboarding wizard | Auth |
| 10 | `/dashboard` | Dashboard overview | Dashboard |
| 11 | `/dashboard/resumes` | Resume list | Dashboard |
| 12 | `/dashboard/resumes/[id]` | Resume detail/editor | Dashboard |
| 13 | `/dashboard/jobs` | JD list | Dashboard |
| 14 | `/dashboard/jobs/[id]` | JD detail | Dashboard |
| 15 | `/dashboard/interviews` | Session history | Dashboard |
| 16 | `/dashboard/interviews/new` | New session setup | Dashboard |
| 17 | `/dashboard/interviews/[id]` | Session review | Dashboard |
| 18 | `/dashboard/billing` | Billing & subscription | Dashboard |
| 19 | `/dashboard/settings` | User settings | Dashboard |
| 20 | `/admin` | Admin overview | Admin |
| 21 | `/admin/users` | User management | Admin |
| 22 | `/admin/users/[id]` | User detail | Admin |
| 23 | `/admin/plans` | Plan management | Admin |
| 24 | `/admin/analytics` | Analytics dashboard | Admin |
| 25 | `/admin/tickets` | Support tickets | Admin |
| 26 | `/admin/feature-flags` | Feature flags | Admin |
| 27 | `/admin/audit-log` | Audit log viewer | Admin |

## Core Reusable Components

| Component | Purpose |
|-----------|---------|
| `PageHeader` | Consistent page title + description + actions |
| `EmptyState` | Illustrated empty state with CTA |
| `LoadingSkeleton` | Shimmer loading placeholders |
| `ErrorBoundary` | Graceful error UI with retry |
| `ConfirmDialog` | Destructive action confirmation |
| `FileUpload` | Drag-and-drop file upload with progress |
| `ScoreBadge` | Colored score indicator |
| `DataTable` | Sortable, filterable, paginated table |
| `StatsCard` | Metric card with icon and trend |
| `PricingCard` | Plan card with features list |
| `CreditsBadge` | Credits remaining indicator |
| `SessionCard` | Session summary card |
| `ResumeCard` | Resume summary card |
| `ThemeToggle` | Dark/light mode switcher |
