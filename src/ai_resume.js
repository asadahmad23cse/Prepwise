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
