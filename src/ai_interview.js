// Interview Modes
const INTERVIEW_MODES = ["Technical", "Behavioral", "System Design"];
let currentMode = "Technical";
function getModePrompt() {
  if (currentMode === "Behavioral") return "You are an expert HR and behavioral interviewer. Evaluate using STAR method.";
  if (currentMode === "System Design") return "You are a Staff Engineer evaluating a System Design interview. Focus on scalability, bottlenecks, and architecture.";
  return "You are a Senior Technical Interviewer. Focus on algorithmic efficiency, time/space complexity.";
}
function switchMode(mode) { currentMode = mode; console.log("Switched to", mode); }
function generateFollowUpQuestion(topic) {
  return `Can you dive deeper into ${topic}? What challenges did you face?`;
