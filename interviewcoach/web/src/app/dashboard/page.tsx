import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const statsCards = [
  { label: "Readiness Score", value: "—", description: "Complete a session to calculate" },
  { label: "Sessions This Month", value: "0", description: "of 15 available" },
  { label: "Credits Remaining", value: "10", description: "Free trial credits" },
  { label: "Resumes", value: "0", description: "Upload your first resume" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your interview preparation overview
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/interviews/new">Start Mock Interview</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Practice Interview</CardTitle>
            <CardDescription>
              Start a new AI-powered mock interview session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/interviews/new">Start Session</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Resume</CardTitle>
            <CardDescription>
              Add your resume for AI analysis and optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/resumes">Upload Resume</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Job Description</CardTitle>
            <CardDescription>
              Paste a JD to generate targeted practice questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/jobs">Add JD</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Mock Interviews</CardTitle>
          <CardDescription>
            Your latest practice sessions and scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="font-semibold mb-1">No sessions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start your first mock interview to see results here.
            </p>
            <Button asChild>
              <Link href="/dashboard/interviews/new">
                Start Your First Session
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
