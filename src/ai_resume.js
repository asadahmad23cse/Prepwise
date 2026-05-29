// ATS Resume Optimization Engine
// Keyword Extraction & Bullet Enhancement

let resumeBulletsContext = "";

function updateResumeContext(text) {
  resumeBulletsContext = text.trim();
}

const ATS_KEYWORDS_DICT = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", "C++", "Java", "Go", "Rust",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "Microservices", "REST API",
  "GraphQL", "SQL", "PostgreSQL", "MongoDB", "Redis", "Kafka", "RabbitMQ", "Elasticsearch",
  "System Design", "Scalability", "Distributed Systems", "Data Structures", "Algorithms",
  "Machine Learning", "AI", "NLP", "PyTorch", "TensorFlow", "Agile", "Scrum", "TDD",
  "Optimization", "Performance", "High Availability", "Security", "OAuth", "JWT"
];

function parseATSKeywords(text) {
  if (!text) return [];
  const textLower = text.toLowerCase();
  return ATS_KEYWORDS_DICT.filter(keyword => textLower.includes(keyword.toLowerCase()));
}

function calculateResumeScore(text, keywords) {
  if (!text || text.trim().length === 0) return 0;
  let score = 40;
  if (text.length > 300) score += 20;
  else if (text.length > 150) score += 10;
  const keywordPoints = keywords.length * 4;
  score += Math.min(keywordPoints, 30);
  const actionVerbs = ["led", "developed", "designed", "optimized", "scaled", "architected", "spearheaded", "engineered", "reduced", "increased"];
  const textLower = text.toLowerCase();
  let verbCount = 0;
  actionVerbs.forEach(v => { if (textLower.includes(v)) verbCount++; });
  score += Math.min(verbCount * 2, 10);
  return Math.min(score, 100);
}

function animateScoreCircle(element, targetScore) {
  let current = 0;
  const interval = setInterval(() => {
    if (current >= targetScore) {
      clearInterval(interval);
      element.textContent = targetScore;
    } else {
      current += Math.ceil((targetScore - current) / 10) || 1;
      element.textContent = current;
    }
    if (current > 80) element.style.borderColor = 'var(--accent-green)';
    else if (current > 60) element.style.borderColor = 'var(--accent-cyan)';
    else element.style.borderColor = '#f59e0b';
  }, 25);
}

async function runAtsAnalysis() {
  const inputEl = document.getElementById('resumeBulletsInput');
  const scoreBox = document.getElementById('atsScoreBox');
  const scoreCircle = document.getElementById('scoreCircle');
  const keywordsList = document.getElementById('atsKeywordsList');
  const feedbackBox = document.getElementById('resumeFeedbackBox');
  if (!inputEl || !scoreBox || !scoreCircle || !keywordsList || !feedbackBox) return;
  const text = inputEl.value.trim();
  if (!text) {
    feedbackBox.innerHTML = '⚠️ Please paste your resume bullets first.';
    feedbackBox.className = 'resume-feedback-box err';
    feedbackBox.classList.remove('hidden');
    return;
  }
  updateResumeContext(text);
  if (typeof updateSystemPrompt === 'function') updateSystemPrompt();
  const keywords = parseATSKeywords(text);
  const score = calculateResumeScore(text, keywords);
  scoreBox.classList.remove('hidden');
  animateScoreCircle(scoreCircle, score);

  const starsContainer = document.getElementById('resumeRatingStars');
  if (starsContainer) {
    const starCount = Math.round(score / 20); // 1-5 stars
    starsContainer.innerHTML = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
  }

  keywordsList.innerHTML = keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('');
  feedbackBox.innerHTML = '✨ Analyzing bullets and calling Gemini for ATS optimization...';
  feedbackBox.className = 'resume-feedback-box info';
  feedbackBox.classList.remove('hidden');
  if (typeof callGemini === 'function') {
    const prompt = `As an elite Professional ATS Resume Writer and FAANG Recruiter, review and rewrite the following resume bullets.
CRITICAL RULES:
1. Make them highly impactful, action-oriented, and quantified.
2. Format as a clean markdown bulleted list.
3. Highlight key technical metrics and eliminate passive language.

Candidate Bullets:\n${text}`;
    try {
      const response = await callGemini(prompt);
      feedbackBox.innerHTML = `<h4>🎯 ATS Optimized Bullets:</h4><div class="optimized-bullets">${typeof marked !== 'undefined' ? marked.parse(response) : response}</div>`;
      feedbackBox.className = 'resume-feedback-box success';
    } catch (e) {
      feedbackBox.innerHTML = '❌ Failed to connect to Gemini: ' + e.message;
      feedbackBox.className = 'resume-feedback-box err';
    }
  }
}

function getResumeContext() {
  if (!resumeBulletsContext) return "";
  return `=== CANDIDATE RESUME & EXPERIENCE CONTEXT ===\n${resumeBulletsContext}\n(Note: Align your answers with the candidate's background when appropriate)\n=============================================`;
}

async function generateStarFormat() {
  const inputEl = document.getElementById('resumeBulletsInput');
  const feedbackBox = document.getElementById('resumeFeedbackBox');
  if (!inputEl || !feedbackBox) return;
  const text = inputEl.value.trim();
  if (!text) {
    feedbackBox.innerHTML = '⚠️ Please paste a scenario or bullet to expand into STAR format.';
    feedbackBox.className = 'resume-feedback-box err';
    feedbackBox.classList.remove('hidden');
    return;
  }
  feedbackBox.innerHTML = '✨ Generating STAR behavioral format...';
  feedbackBox.className = 'resume-feedback-box info';
  feedbackBox.classList.remove('hidden');
  if (typeof callGemini === 'function') {
    try {
      const prompt = `Transform the following into a compelling behavioral interview answer using the STAR method (Situation, Task, Action, Result):\n${text}`;
      const response = await callGemini(prompt);
      feedbackBox.innerHTML = `<h4>⭐ STAR Format Output:</h4><div class="optimized-bullets">${typeof marked !== 'undefined' ? marked.parse(response) : response}</div>`;
      feedbackBox.className = 'resume-feedback-box success';
    } catch(e) {
      feedbackBox.innerHTML = '❌ Failed: ' + e.message;
      feedbackBox.className = 'resume-feedback-box err';
    }
  }
}

// ==========================================
// RESUME DRAG-AND-DROP FILE IMPORT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('resumeDropzone');
  const fileInput = document.getElementById('resumeFileInput');
  const textInput = document.getElementById('resumeBulletsInput');
  
  if (dropzone && fileInput && textInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleResumeFile(files[0]);
      }
    });
    
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleResumeFile(fileInput.files[0]);
      }
    });
    
    function handleResumeFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        textInput.value = text;
        if (typeof showPremiumModal === 'function') {
          showPremiumModal('RESUME PARSED', `Successfully imported <strong>${file.name}</strong> (${text.length} characters). Click "Optimize for ATS" to analyze.`, 'Acknowledge');
        }
      };
      reader.readAsText(file);
    }
  }
});
