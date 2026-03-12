"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { INTERVIEW_TYPES, TARGET_ROLES } from "@/lib/constants";

export default function NewInterviewPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("MIXED");
  const [selectedRole, setSelectedRole] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewType: selectedType,
          targetRole: selectedRole,
          targetCompany: company || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error?.message ?? `Server error (${res.status})`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/interviews/${data.data.id}`);
      }
    } catch {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Start Mock Interview
        </h1>
        <p className="text-muted-foreground">
          Configure your practice session
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Type</CardTitle>
          <CardDescription>
            Choose the type of interview to practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {INTERVIEW_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedType === type.value
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <p className="font-medium text-sm">{type.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Role</CardTitle>
          <CardDescription>
            Select the role you&apos;re preparing for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a role...</option>
            {TARGET_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Company (Optional)</CardTitle>
          <CardDescription>
            AI will tailor questions to company-specific patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Google, Amazon, Stripe..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleStart}
          disabled={loading || !selectedRole}
          className="flex-1"
        >
          {loading ? "Starting..." : "Start Practice Session"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        This is a practice/coaching session only. PrepWise is designed for
        interview preparation, not for use during live interviews.
      </p>
    </div>
  );
}
