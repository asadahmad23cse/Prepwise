// AI Resume Module
let resumeContext = "";
function updateResume(text) { resumeContext = text; }
function getResumeContext() { return resumeContext ? `Candidate Resume Context:\n${resumeContext}\n\n` : ""; }
async function enhanceResumeBullets(bullets) {
  if (!bullets) return "Please paste your resume bullets first.";
  const prompt = `As an expert resume reviewer, enhance the following resume bullets to be ATS-friendly, action-oriented, and impactful:\n${bullets}`;
  return "Calling Gemini..."; // Placeholder
}
function parseATSKeywords(resume) {
  const keywords = ["React", "Node", "Python", "Scalability", "AWS", "SQL"];
  return keywords.filter(k => resume.toLowerCase().includes(k.toLowerCase()));
}
function calculateResumeScore(resume) {
  let score = 50;
  if (resume.length > 200) score += 20;
  score += parseATSKeywords(resume).length * 5;
