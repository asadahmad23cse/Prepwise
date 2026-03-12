import { z } from "zod";

export const onboardingSchema = z.object({
  targetRole: z.string().min(1, "Please select a target role"),
  interviewType: z.enum(["BEHAVIORAL", "TECHNICAL", "SYSTEM_DESIGN", "MIXED"]),
  experienceLevel: z.enum(["ENTRY", "MID", "SENIOR", "STAFF", "EXECUTIVE"]),
});

export const createSessionSchema = z.object({
  interviewType: z.enum(["BEHAVIORAL", "TECHNICAL", "SYSTEM_DESIGN", "MIXED"]),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  jobDescriptionId: z.string().optional(),
  templateId: z.string().optional(),
});

export const createJobDescriptionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().optional(),
  rawText: z.string().min(50, "Job description must be at least 50 characters"),
});

export const resumeUploadSchema = z.object({
  title: z.string().min(1).max(100),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number().positive().max(10 * 1024 * 1024),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  body: z.string().min(20).max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  creditBalance: z.number().int().min(0).optional(),
});

export const planSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  priceMonthly: z.number().int().min(0),
  priceAnnual: z.number().int().min(0),
  sessionsPerMonth: z.number().int().min(0),
  resumeBuilds: z.number().int().min(0),
  creditsIncluded: z.number().int().min(0),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CreateJobDescriptionInput = z.infer<typeof createJobDescriptionSchema>;
export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
