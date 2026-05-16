// Interview Modes
const INTERVIEW_MODES = ["Technical", "Behavioral", "System Design"];
let currentMode = "Technical";
function getModePrompt() {
  if (currentMode === "Behavioral") return "You are an expert HR and behavioral interviewer. Evaluate using STAR method.";
