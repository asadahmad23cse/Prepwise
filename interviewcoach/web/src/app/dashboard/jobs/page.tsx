"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function JobDescriptionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawText, setRawText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/job-descriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, company, rawText }),
    });
    if (res.ok) {
      setShowForm(false);
      setTitle("");
      setCompany("");
      setRawText("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Job Descriptions
          </h1>
          <p className="text-muted-foreground">
            Analyze JDs and generate targeted prep questions
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Job Description"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Job Description</CardTitle>
            <CardDescription>
              Paste a job description to analyze and generate practice questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Company (optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Job Description Text
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                  required
                  minLength={50}
                />
              </div>
              <Button type="submit">Analyze & Save</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold mb-1">No job descriptions saved</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a job description to get AI-extracted skills, personalized
                questions, and gap analysis.
              </p>
              <Button onClick={() => setShowForm(true)}>
                Add Your First JD
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
