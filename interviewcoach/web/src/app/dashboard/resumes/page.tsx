import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResumesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground">
            Upload and optimize your resumes with AI
          </p>
        </div>
        <Button>Upload Resume</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
          <CardDescription>
            Manage your uploaded resumes and AI-optimized versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="font-semibold mb-1">No resumes uploaded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a PDF or DOCX resume to get AI-powered optimization, ATS
              scoring, and keyword matching.
            </p>
            <Button>Upload Your First Resume</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
