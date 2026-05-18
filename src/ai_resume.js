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
