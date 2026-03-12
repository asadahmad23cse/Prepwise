# API Routes — PrepWise

All routes are Next.js App Router API routes (`app/api/...`).
Authentication via Clerk middleware. Admin routes require `role: admin`.

---

## Auth (managed by Clerk)

| Method | Route | Description |
|--------|-------|-------------|
| — | `/sign-in`, `/sign-up` | Clerk hosted UI or custom components |
| POST | `/api/webhooks/clerk` | Clerk webhook for user sync |

---

## Users

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/users/me` | Get current user profile | User |
| PATCH | `/api/users/me` | Update profile, preferences | User |
| POST | `/api/users/me/onboarding` | Complete onboarding wizard | User |
| DELETE | `/api/users/me` | Request account deletion | User |

---

## Resumes

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/resumes` | List user's resumes | User |
| POST | `/api/resumes` | Upload and parse new resume | User |
| GET | `/api/resumes/:id` | Get resume with parsed data | User |
| PATCH | `/api/resumes/:id` | Update resume metadata | User |
| DELETE | `/api/resumes/:id` | Delete resume | User |
| POST | `/api/resumes/:id/optimize` | AI optimize against a JD | User |
| POST | `/api/resumes/:id/export` | Export to PDF | User |

---

## Job Descriptions

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/job-descriptions` | List user's saved JDs | User |
| POST | `/api/job-descriptions` | Create and analyze JD | User |
| GET | `/api/job-descriptions/:id` | Get JD with analysis | User |
| DELETE | `/api/job-descriptions/:id` | Delete JD | User |
| POST | `/api/job-descriptions/:id/questions` | Generate questions from JD | User |

---

## Interview Sessions

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/sessions` | List user's sessions | User |
| POST | `/api/sessions` | Create new session | User |
| GET | `/api/sessions/:id` | Get session with transcript | User |
| PATCH | `/api/sessions/:id` | Update session (end, metadata) | User |
| DELETE | `/api/sessions/:id` | Delete session | User |
| GET | `/api/sessions/:id/feedback` | Get coaching feedback | User |
| GET | `/api/sessions/:id/transcript` | Get full transcript | User |

---

## Real-Time (WebSocket / Server-Sent Events)

| Protocol | Endpoint | Description | Auth |
|----------|----------|-------------|------|
| WSS | `/api/sessions/:id/stream` | Real-time STT + AI coaching stream | User |

### WebSocket Message Types

**Client → Server:**
- `audio_chunk` — raw audio bytes for STT
- `end_session` — signal session complete

**Server → Client:**
- `transcript_delta` — incremental STT text
- `question_detected` — AI identified a question
- `suggested_answer` — AI coaching response
- `follow_up` — suggested follow-up question
- `feedback_partial` — real-time confidence/pacing hints

---

## AI Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/ai/detect-question` | Classify question from text | User |
| POST | `/api/ai/generate-answer` | Generate STAR/technical answer framework | User |
| POST | `/api/ai/analyze-jd` | Extract skills/requirements from JD | User |
| POST | `/api/ai/parse-resume` | Parse resume into structured data | User |
| POST | `/api/ai/optimize-bullets` | Rewrite resume bullets | User |
| POST | `/api/ai/cover-letter` | Generate cover letter | User |
| POST | `/api/ai/session-feedback` | Generate post-session coaching report | User |
| POST | `/api/ai/readiness-score` | Calculate interview readiness | User |

---

## Practice Templates

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/templates` | List available templates | User |
| GET | `/api/templates/:id` | Get template questions | User |
| POST | `/api/templates` | Create custom template | User |

---

## Billing

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/billing/subscription` | Get current subscription | User |
| POST | `/api/billing/checkout` | Create Stripe checkout session | User |
| POST | `/api/billing/portal` | Create Stripe billing portal session | User |
| GET | `/api/billing/credits` | Get credit balance | User |
| POST | `/api/billing/credits/purchase` | Buy credit pack | User |
| GET | `/api/billing/invoices` | List invoices | User |
| POST | `/api/webhooks/stripe` | Stripe webhook handler | Public (verified) |

---

## Admin

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/admin/users` | List all users (paginated) | Admin |
| GET | `/api/admin/users/:id` | Get user detail | Admin |
| PATCH | `/api/admin/users/:id` | Update user (suspend, role) | Admin |
| GET | `/api/admin/plans` | List plans | Admin |
| POST | `/api/admin/plans` | Create plan | Admin |
| PATCH | `/api/admin/plans/:id` | Update plan | Admin |
| POST | `/api/admin/credits/grant` | Grant credits to user | Admin |
| GET | `/api/admin/analytics` | Get platform analytics | Admin |
| GET | `/api/admin/tickets` | List support tickets | Admin |
| PATCH | `/api/admin/tickets/:id` | Update ticket status | Admin |
| GET | `/api/admin/feature-flags` | List feature flags | Admin |
| PATCH | `/api/admin/feature-flags/:id` | Toggle feature flag | Admin |
| GET | `/api/admin/audit-log` | Query audit log | Admin |

---

## File Uploads

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/uploads/presigned-url` | Get S3 presigned upload URL | User |
| POST | `/api/uploads/confirm` | Confirm upload and trigger processing | User |

---

## Background Jobs

| Job | Trigger | Description |
|-----|---------|-------------|
| `resume.parse` | Resume uploaded | Parse PDF/DOCX, extract structured data |
| `jd.analyze` | JD created | Extract skills, requirements, role info |
| `session.feedback` | Session ended | Generate comprehensive coaching feedback |
| `session.cleanup` | Cron (daily) | Archive old sessions, free storage |
| `billing.sync` | Stripe webhook | Sync subscription state |
| `billing.usage-check` | Session created | Check and decrement credits |
| `email.welcome` | User created | Send welcome email |
| `email.session-summary` | Session feedback ready | Send session summary email |
| `audit.log` | Various | Write audit log entry |

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| Auth endpoints | 10 req/min per IP |
| AI endpoints | 20 req/min per user |
| File uploads | 5 req/min per user |
| General API | 100 req/min per user |
| WebSocket connections | 2 concurrent per user |
| Admin endpoints | 60 req/min per admin |

---

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You need at least 1 credit to start a session.",
    "details": {}
  }
}
```
