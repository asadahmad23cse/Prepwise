// AI Resume Module
let resumeContext = "";
function updateResume(text) { resumeContext = text; }
function getResumeContext() { return resumeContext ? `Candidate Resume Context:\n${resumeContext}\n\n` : ""; }
async function enhanceResumeBullets(bullets) {
  if (!bullets) return "Please paste your resume bullets first.";
