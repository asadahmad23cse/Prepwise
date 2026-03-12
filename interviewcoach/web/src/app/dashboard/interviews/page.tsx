import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InterviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Interviews</h1>
          <p className="text-muted-foreground">
            Practice sessions and coaching history
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/interviews/new">New Session</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            All your mock interview sessions with feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-semibold mb-1">No sessions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your practice sessions will appear here with full transcripts and coaching feedback.
            </p>
            <Button asChild>
              <Link href="/dashboard/interviews/new">Start Practicing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
