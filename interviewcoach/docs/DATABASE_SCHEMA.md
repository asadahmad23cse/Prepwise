# Database Schema — PrepWise

## Entity Relationship Summary

```
User 1──* Subscription
User 1──* CreditLedger
User 1──* Resume
User 1──* JobDescription
User 1──* InterviewSession
InterviewSession 1──* TranscriptChunk
InterviewSession 1──* DetectedQuestion
DetectedQuestion 1──* SuggestedAnswer
InterviewSession 1──1 CoachingFeedback
User 1──* SupportTicket
Plan 1──* Subscription
Plan 1──* Invoice
User 1──* Invoice
```

## Full Prisma Schema

See `prisma/schema.prisma` for the implementation.

## Entity Details

### User
Core identity. Linked to Clerk for auth. Stores profile, preferences, onboarding state.

### Subscription
Tracks active plan, Stripe subscription ID, billing period, status.

### CreditLedger
Append-only ledger for credit transactions. Supports grants, deductions, refunds, expirations.

### Resume
Uploaded resume files with parsed structured data (experience, skills, education, projects).

### JobDescription
Stored JD text with AI-extracted skills, requirements, and role metadata.

### InterviewSession
A single mock interview practice session. Contains metadata, duration, mode, scores.

### TranscriptChunk
Ordered speech-to-text segments within a session. Timestamped.

### DetectedQuestion
AI-identified questions from the transcript stream. Classified by type.

### SuggestedAnswer
AI-generated answer frameworks for detected questions. STAR format, key points, hints.

### CoachingFeedback
Post-session AI analysis: scores, filler words, pacing, improvement suggestions.

### PracticeTemplate
Reusable question sets by role/domain/type. Can be system-generated or user-created.

### Plan
Billing plan definition: name, price, limits, features.

### Invoice
Billing history linked to Stripe invoices.

### SupportTicket
User-submitted support requests with status workflow.

### AuditLog
Immutable log of security-relevant actions.
