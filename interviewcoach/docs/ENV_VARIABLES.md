# Environment Variables Checklist — PrepWise

## Web App (`web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of the deployed web app |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Yes | Clerk webhook signing secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Path to sign-in page |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Path to sign-up page |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Redirect after sign-in |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Redirect after sign-up |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_PRICE_STARTER_MONTHLY` | Yes | Stripe price ID for Starter monthly |
| `STRIPE_PRICE_PRO_MONTHLY` | Yes | Stripe price ID for Pro monthly |
| `STRIPE_PRICE_PRO_ANNUAL` | Yes | Stripe price ID for Pro annual |
| `STRIPE_PRICE_CREDIT_PACK` | Yes | Stripe price ID for credit packs |
| `OPENAI_API_KEY` | Yes | OpenAI API key for LLM features |
| `DEEPGRAM_API_KEY` | Yes | Deepgram API key for STT |
| `S3_ENDPOINT` | Yes | S3-compatible endpoint URL |
| `S3_REGION` | Yes | S3 region |
| `S3_BUCKET` | Yes | S3 bucket name |
| `S3_ACCESS_KEY_ID` | Yes | S3 access key |
| `S3_SECRET_ACCESS_KEY` | Yes | S3 secret key |
| `RESEND_API_KEY` | No | Resend API key for transactional emails |
| `UPSTASH_REDIS_REST_URL` | No | Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Redis auth token |
| `SENTRY_DSN` | No | Sentry DSN for error monitoring |

## Desktop App (`desktop/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | URL of the web app API |
| `VITE_DEEPGRAM_API_KEY` | Yes | Deepgram key for direct STT connection |

## Setup Order

1. **PostgreSQL** — Set up a local or cloud database, copy the connection string
2. **Clerk** — Create project at clerk.com, copy keys, configure webhook
3. **Stripe** — Create account, add products/prices, copy keys, configure webhook
4. **OpenAI** — Get API key from platform.openai.com
5. **Deepgram** — Get API key from console.deepgram.com
6. **S3** — Set up AWS S3 or Cloudflare R2 bucket
7. **Optional** — Resend for emails, Upstash for rate limiting, Sentry for monitoring

## Stripe Product Setup

Create these products in your Stripe Dashboard:

1. **Starter Plan** — $19/month subscription
   - Create monthly price → copy ID to `STRIPE_PRICE_STARTER_MONTHLY`
   - Create annual price ($190/year) → copy ID to `STRIPE_PRICE_STARTER_ANNUAL`

2. **Pro Plan** — $39/month subscription
   - Create monthly price → copy ID to `STRIPE_PRICE_PRO_MONTHLY`
   - Create annual price ($348/year) → copy ID to `STRIPE_PRICE_PRO_ANNUAL`

3. **Credit Pack** — $9.99 one-time payment for 50 credits
   - Create one-time price → copy ID to `STRIPE_PRICE_CREDIT_PACK`

## Webhook Endpoints

Configure these webhooks in your service dashboards:

| Service | Endpoint | Events |
|---------|----------|--------|
| Clerk | `https://your-app.com/api/webhooks/clerk` | `user.created`, `user.updated`, `user.deleted` |
| Stripe | `https://your-app.com/api/webhooks/stripe` | `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid`, `invoice.payment_failed` |
