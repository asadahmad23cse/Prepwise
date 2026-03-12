export const APP_NAME = "PrepWise";
export const APP_DESCRIPTION =
  "AI-powered interview preparation and coaching platform";

export const TARGET_ROLES = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Data Scientist",
  "Data Engineer",
  "ML Engineer",
  "Product Manager",
  "Engineering Manager",
  "DevOps Engineer",
  "QA Engineer",
  "UX Designer",
  "Solutions Architect",
  "Technical Program Manager",
  "Other",
] as const;

export const INTERVIEW_TYPES = [
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "MIXED", label: "Mixed" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "ENTRY", label: "Entry Level (0–2 years)" },
  { value: "MID", label: "Mid Level (3–5 years)" },
  { value: "SENIOR", label: "Senior (5–8 years)" },
  { value: "STAFF", label: "Staff+ (8+ years)" },
  { value: "EXECUTIVE", label: "Executive / Director" },
] as const;

export const PLAN_LIMITS = {
  free: { sessionsPerMonth: 3, resumeBuilds: 1, credits: 10 },
  starter: { sessionsPerMonth: 15, resumeBuilds: 5, credits: 100 },
  pro: { sessionsPerMonth: -1, resumeBuilds: -1, credits: 500 },
} as const;

export const SCORE_LABELS = {
  clarity: "Clarity",
  relevance: "Relevance",
  confidence: "Confidence",
  structure: "Structure",
  conciseness: "Conciseness",
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
