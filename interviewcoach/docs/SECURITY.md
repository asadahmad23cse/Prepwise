# Security & Privacy — PrepWise

## Authentication & Authorization
- All auth managed by Clerk (industry-standard, SOC 2 compliant)
- Route-level middleware protection in `middleware.ts`
- Role-based access: Guest, User, Admin
- Admin routes require `role: admin` in session claims
- API routes verify Clerk session on every request

## Data Protection
- All PII encrypted at rest (PostgreSQL encryption, S3 server-side encryption)
- HTTPS enforced everywhere (Vercel handles TLS)
- Signed S3 presigned URLs for file uploads (time-limited, user-scoped)
- Resume and transcript data is user-owned; not shared or sold

## Input Validation
- All API inputs validated with Zod schemas before processing
- File uploads restricted to PDF/DOCX, max 10MB
- SQL injection prevented by Prisma ORM (parameterized queries)
- XSS prevented by React's default escaping + Content Security Policy

## Rate Limiting
- Per-endpoint rate limits (see API_ROUTES.md)
- Implemented via Upstash Redis (serverless, edge-compatible)
- Separate limits for auth, AI, uploads, and general endpoints
- WebSocket connections limited to 2 concurrent per user

## Billing Security
- Stripe handles all payment processing (PCI DSS compliant)
- Webhook signatures verified with HMAC on every event
- Idempotent webhook handlers prevent double-processing
- No credit card numbers ever touch our servers

## Audit Logging
- Immutable `AuditLog` table records all sensitive actions:
  - User creation, deletion, role changes
  - Subscription changes
  - Credit adjustments
  - Admin actions (user suspension, plan changes)
  - File uploads and deletions
- Each log entry includes: userId, action, entity, entityId, metadata, IP, timestamp

## Privacy & GDPR
- Users can export all their data (resumes, transcripts, feedback)
- Users can request full account deletion
- Session data auto-archived after 90 days (configurable)
- Clear privacy policy explaining data usage
- Audio is processed in real-time and NOT stored permanently
- Ethical framing: tool is for practice only, with disclaimers throughout

## Secrets Management
- All secrets in environment variables, never in code
- `.env.local` excluded from version control via `.gitignore`
- Production secrets managed via Vercel environment variables
- Webhook secrets rotated periodically

## OWASP Top 10 Considerations
1. **Injection** — Prisma ORM, Zod validation
2. **Broken Auth** — Clerk handles auth, middleware protects routes
3. **Sensitive Data Exposure** — HTTPS, encrypted storage, no PII in logs
4. **XML External Entities** — N/A (JSON-only API)
5. **Broken Access Control** — Role checks on every protected route
6. **Security Misconfiguration** — Minimal server config (serverless)
7. **XSS** — React escaping, CSP headers
8. **Insecure Deserialization** — Zod schema validation
9. **Known Vulnerabilities** — Dependabot/Renovate for dependency updates
10. **Insufficient Logging** — AuditLog + Sentry
