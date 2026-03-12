import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "AI Mock Interviews",
    description:
      "Practice with realistic AI-powered mock interviews. Get real-time coaching on structure, clarity, and confidence.",
    icon: "🎙️",
  },
  {
    title: "Smart Resume Builder",
    description:
      "Upload your resume, compare it against job descriptions, and get ATS-optimized rewrites instantly.",
    icon: "📄",
  },
  {
    title: "JD Analyzer",
    description:
      "Paste any job description and get extracted skills, personalized question sets, and targeted prep plans.",
    icon: "🔍",
  },
  {
    title: "STAR Framework Coaching",
    description:
      "Get structured behavioral answer suggestions using the STAR method, tailored to your experience.",
    icon: "⭐",
  },
  {
    title: "Performance Feedback",
    description:
      "Detailed scoring on clarity, relevance, confidence, pacing, and filler-word usage after every session.",
    icon: "📊",
  },
  {
    title: "Desktop Practice App",
    description:
      "A dedicated desktop app with microphone capture, live transcription, and real-time AI coaching panels.",
    icon: "💻",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Google",
    quote:
      "PrepWise helped me structure my behavioral answers. I went from rambling to giving concise STAR responses in two weeks.",
  },
  {
    name: "Marcus Johnson",
    role: "Product Manager at Stripe",
    quote:
      "The JD analyzer was a game-changer. It identified exactly which skills I needed to highlight for each application.",
  },
  {
    name: "Priya Sharma",
    role: "Data Scientist at Meta",
    quote:
      "The real-time feedback on my pacing and filler words made me a much more confident interviewer.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
              <span className="text-muted-foreground">
                AI-Powered Interview Coaching
              </span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Ace Your Next Interview with{" "}
              <span className="text-primary">AI Coaching</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Practice mock interviews with real-time AI feedback. Get STAR
              answer coaching, resume optimization, and personalized question
              prep — all tailored to your target role.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/features">See How It Works</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              7-day free trial. No credit card required.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.12),transparent)]" />
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-muted/30" id="features">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need to prepare
            </h2>
            <p className="text-muted-foreground text-lg">
              A complete interview preparation toolkit powered by AI, designed to
              build your confidence and sharpen your answers.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="relative overflow-hidden">
                <CardHeader>
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Trusted by job seekers worldwide
            </h2>
            <p className="text-muted-foreground text-lg">
              See how PrepWise has helped candidates land roles at top companies.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to crush your next interview?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join thousands of candidates who prepared smarter with PrepWise.
              Start your free trial today.
            </p>
            <Button
              size="lg"
              variant="secondary"
              asChild
            >
              <Link href="/sign-up">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
