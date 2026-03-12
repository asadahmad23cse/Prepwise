import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const plans = [
  {
    name: "Free Trial",
    price: "$0",
    period: "7 days",
    description: "Try everything with no commitment",
    features: [
      "3 mock interview sessions",
      "1 resume build",
      "10 AI credits",
      "Basic feedback reports",
      "Question bank access",
    ],
    cta: "Start Free Trial",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "For active job seekers",
    features: [
      "15 mock sessions per month",
      "5 resume builds",
      "100 AI credits",
      "Detailed feedback with scores",
      "JD analysis and matching",
      "Cover letter generation",
      "Session transcript history",
    ],
    cta: "Get Started",
    href: "/sign-up?plan=starter",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/month",
    description: "Unlimited prep for serious candidates",
    features: [
      "Unlimited mock sessions",
      "Unlimited resume builds",
      "500 AI credits per month",
      "Advanced coaching feedback",
      "Priority AI model access",
      "Pacing and confidence analysis",
      "Custom practice templates",
      "Email session summaries",
    ],
    cta: "Go Pro",
    href: "/sign-up?plan=pro",
    highlighted: true,
  },
  {
    name: "Annual",
    price: "$29",
    period: "/month, billed annually",
    description: "Best value — save 25%",
    features: [
      "Everything in Pro",
      "25% discount",
      "Priority support",
      "Early access to new features",
      "Team sharing (coming soon)",
    ],
    cta: "Save 25%",
    href: "/sign-up?plan=annual",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-lg">
            Start free, upgrade when you&apos;re ready. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlighted
                  ? "border-primary shadow-lg relative"
                  : "relative"
              }
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">
                    {plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
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
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
