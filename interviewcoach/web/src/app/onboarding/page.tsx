"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TARGET_ROLES,
  INTERVIEW_TYPES,
  EXPERIENCE_LEVELS,
} from "@/lib/constants";

const steps = ["role", "type", "level"] as const;
type Step = (typeof steps)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<Step>("role");
  const [targetRole, setTargetRole] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [loading, setLoading] = useState(false);

  const stepIndex = steps.indexOf(currentStep);

  function next() {
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1]!);
    }
  }

  function back() {
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1]!);
    }
  }

  async function handleFinish() {
    setLoading(true);
    try {
      await fetch("/api/users/me/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, interviewType, experienceLevel }),
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Let&apos;s personalize your interview prep
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Target Role */}
        {currentStep === "role" && (
          <Card>
            <CardHeader>
              <CardTitle>What role are you targeting?</CardTitle>
              <CardDescription>
                We&apos;ll tailor questions and coaching to this role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {TARGET_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setTargetRole(role)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      targetRole === role
                        ? "border-primary bg-primary/5 font-medium"
                        : "hover:border-muted-foreground/50"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={next} disabled={!targetRole}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Interview Type */}
        {currentStep === "type" && (
          <Card>
            <CardHeader>
              <CardTitle>What type of interview?</CardTitle>
              <CardDescription>
                Choose the format you want to practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {INTERVIEW_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setInterviewType(type.value)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      interviewType === type.value
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{type.label}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={back}>
                  Back
                </Button>
                <Button onClick={next} disabled={!interviewType}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Experience Level */}
        {currentStep === "level" && (
          <Card>
            <CardHeader>
              <CardTitle>Your experience level?</CardTitle>
              <CardDescription>
                This adjusts the difficulty and depth of coaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setExperienceLevel(level.value)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                      experienceLevel === level.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "hover:border-muted-foreground/50"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={back}>
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={!experienceLevel || loading}
                >
                  {loading ? "Setting up..." : "Start Preparing"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip option */}
        <button
          onClick={() => router.push("/dashboard")}
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
