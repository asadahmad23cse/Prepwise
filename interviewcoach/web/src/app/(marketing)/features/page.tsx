import Link from "next/link";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "AI Mock Interviews",
    description:
      "Start a practice session, speak into your microphone, and get real-time coaching. Our AI detects questions, suggests structured answers using STAR and other frameworks, and gives you follow-up questions to practice.",
    points: [
      "Real-time speech-to-text transcription",
      "Automatic question detection and classification",
      "STAR-format answer coaching for behavioral questions",
      "Technical approach and tradeoff hints",
      "System design prompt guidance",
      "Follow-up question suggestions",
    ],
  },
  {
    title: "Performance Feedback",
    description:
      "After every session, get a detailed coaching report with actionable scores and suggestions.",
    points: [
      "Clarity, relevance, and confidence scores",
      "Structure and conciseness ratings",
      "Filler-word frequency analysis",
      "Words-per-minute pacing tracking",
      "Specific improvement suggestions",
      "Progress tracking over time",
    ],
  },
  {
    title: "Smart Resume Builder",
    description:
      "Upload your resume, compare it against any job description, and get AI-powered optimization suggestions.",
    points: [
      "PDF and DOCX parsing",
      "ATS keyword optimization",
      "Bullet point rewriting suggestions",
      "JD gap analysis",
      "Cover letter generation",
      "Export optimized PDFs",
    ],
  },
  {
    title: "Job Description Analyzer",
    description:
      "Paste a job description and instantly get extracted skills, requirements, and a personalized question set.",
    points: [
      "Automatic skill extraction",
      "Role and level detection",
      "Personalized question generation",
      "Keyword matching with your resume",
      "Interview prep plan creation",
    ],
  },
  {
    title: "Desktop Practice App",
    description:
      "A dedicated desktop application for focused practice with native microphone access and real-time panels.",
    points: [
      "Native audio capture",
      "Live transcript panel",
      "Detected question sidebar",
      "Suggested answer framework panel",
      "Session timer and controls",
      "Available for Windows, macOS, and Linux",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Features built for interview success
          </h1>
          <p className="text-muted-foreground text-lg">
            Every tool you need to prepare, practice, and perform at your best.
          </p>
        </div>

        <div className="space-y-20">
          {sections.map((section, i) => (
            <div key={section.title} className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </span>
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
              <p className="text-muted-foreground">{section.description}</p>
              <ul className="grid sm:grid-cols-2 gap-3">
                {section.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm">
                    <svg
                      className="h-4 w-4 mt-0.5 text-primary shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">Start Practicing Free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
