# Next Actions — PrepWise

## Immediate (Today)

### 1. Install Dependencies
```bash
cd web && npm install
cd ../desktop && npm install
```

### 2. Set Up Database
```bash
# Start PostgreSQL (Docker)
docker run --name prepwise-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=prepwise -p 5432:5432 -d postgres:16

# Copy env file and fill in values
cp web/.env.example web/.env.local

# Generate Prisma client and push schema
cd web
npx prisma generate
npx prisma db push
```

### 3. Set Up External Services
- [ ] Create Clerk project → copy keys to `.env.local`
- [ ] Create Stripe account → add products/prices → copy keys
- [ ] Get OpenAI API key
- [ ] Get Deepgram API key
- [ ] Set up S3 bucket (or use Cloudflare R2)

### 4. Configure Webhooks
- [ ] Clerk webhook → `http://localhost:3000/api/webhooks/clerk`
- [ ] Stripe webhook → `http://localhost:3000/api/webhooks/stripe`
- [ ] Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` for local dev

### 5. Run the Web App
```bash
cd web && npm run dev
```

### 6. Seed Initial Data
Create a seed script for:
- Default plans (Free, Starter, Pro)
- Sample practice templates
- Feature flags

---

## This Week

- [ ] Install and configure shadcn/ui components (`npx shadcn-ui@latest init`)
- [ ] Complete FAQ page with accordion component
- [ ] Complete Reviews page
- [ ] Complete Desktop download page
- [ ] Build onboarding wizard (5-step flow)
- [ ] Implement resume upload with S3 presigned URLs
- [ ] Wire up Clerk webhook for user sync
- [ ] Test Stripe checkout flow end-to-end

---

## Next Week

- [ ] Build JD analysis AI pipeline
- [ ] Build resume parsing AI pipeline
- [ ] Implement mock interview session flow (web version)
- [ ] Integrate Deepgram WebSocket for real-time STT
- [ ] Build question detection pipeline
- [ ] Build answer generation pipeline
- [ ] Session summary and feedback generation

---

## Week 3–4

- [ ] Set up Tauri desktop app build pipeline
- [ ] Implement native audio capture in desktop app
- [ ] Wire desktop app to web API
- [ ] Build admin panel pages
- [ ] Add rate limiting with Upstash
- [ ] Add audit logging
- [ ] Set up Sentry monitoring
- [ ] Dark mode polish

---

## Architecture Decisions to Make

1. **Job queue**: Inngest (serverless, easy) vs BullMQ (self-hosted, more control)?
2. **Real-time**: WebSocket server (separate service) vs Server-Sent Events (simpler)?
3. **Desktop distribution**: Tauri auto-updater vs manual GitHub releases?
4. **Email service**: Resend vs SendGrid vs AWS SES?
5. **CDN**: Vercel Edge vs Cloudflare?

---

## Key Technical Risks

| Risk | Mitigation | Priority |
|------|-----------|----------|
| Deepgram latency in desktop app | Test with WebSocket connection pooling, consider local Whisper fallback | High |
| OpenAI rate limits during sessions | Implement request queuing, use GPT-4o-mini for real-time, GPT-4o for post-session | High |
| Tauri cross-platform audio | Test on Windows/Mac/Linux early, have Web Audio API fallback | Medium |
| Large transcript storage | Compress transcripts, implement retention policy | Low |

---

## Definition of Done (MVP)

- [ ] Landing page live and conversion-optimized
- [ ] User can sign up, onboard, and reach dashboard
- [ ] User can upload resume and get AI analysis
- [ ] User can paste JD and get extracted questions
- [ ] User can run a mock interview with real-time STT
- [ ] AI detects questions and provides coaching answers
- [ ] Post-session feedback report with scores
- [ ] Stripe billing works for all plan types
- [ ] Desktop app works on Windows (primary) and macOS
- [ ] Admin can manage users and view analytics
- [ ] < 3s AI response latency in practice sessions
- [ ] GDPR-compliant data handling
