import { useState } from "react";
import { useSessionStore } from "../../stores/session-store";

const INTERVIEW_TYPES = [
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "MIXED", label: "Mixed" },
];

const TARGET_ROLES = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Data Scientist",
  "Product Manager",
  "Engineering Manager",
  "DevOps Engineer",
  "UX Designer",
];

export function SessionSetup() {
  const { setSessionConfig, startSession, setStatus } = useSessionStore();
  const [interviewType, setInterviewType] = useState("MIXED");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!targetRole) return;
    setLoading(true);
    setSessionConfig({ interviewType, targetRole, targetCompany });

    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiBase}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewType, targetRole, targetCompany }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        startSession(data.data.id);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
      startSession(`local-${Date.now()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Start Practice Session</h1>
          <p className="text-slate-400 text-sm">
            Configure your mock interview and start practicing
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Interview Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INTERVIEW_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInterviewType(type.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    interviewType === type.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a role...</option>
              {TARGET_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Company (optional)
            </label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="e.g., Google, Amazon..."
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!targetRole || loading}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
        >
          {loading ? "Starting..." : "Start Practice Session"}
        </button>

        <p className="text-xs text-slate-500 text-center">
          This is a practice/coaching tool only. Not for use during live
          interviews.
        </p>
      </div>
    </div>
  );
}
