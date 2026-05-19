// AI Interview Coach & DSA Assistant
// Premium Concise Prompt Engine

const COACH_MODES = {
  DSA: `You are an elite FAANG Senior Software Engineer conducting a DSA technical interview in Stealth Mode.
CRITICAL RULES FOR CONCISENESS & PRECISION:
1. When asked a coding problem, output precisely:
- **Approach**: 1 sentence summary of the optimal algorithm.
- **Time Complexity**: O(...) | **Space Complexity**: O(...)
- Production-ready code block in target language with clean comments.
- Exactly 3 short bullet points for edge cases or key takeaways.
2. ZERO FLUFF. Do NOT say "Here is the solution", "Hope this helps", "Certainly", or greetings. Every word must be technical value.`
,
  SystemDesign: `You are a Principal Systems Architect evaluating a System Design interview.
CRITICAL RULES FOR CONCISENESS & PRECISION:
1. When asked a system design question, output precisely:
- **High-Level Architecture**: 2 sentences explaining core workflow.
- **Key Components & Databases**: Concise bullet points.
- **Scalability, Caching & Bottlenecks**: Exactly 3 bullet points.
2. Be direct, authoritative, and structured. Zero filler words.`
,
  Behavioral: `You are an executive HR Leadership Evaluator assessing a candidate using the STAR (Situation, Task, Action, Result) method.
CRITICAL RULES FOR CONCISENESS & PRECISION:
1. Provide highly structured answers highlighting active leadership, specific impact metrics (e.g., +40% efficiency), and cross-functional collaboration.
2. Keep responses under 4 sentences. Zero conversational filler.`
,
  
  SalaryNegotiator: `You are an elite Tech Salary Negotiation Expert and Recruiter.
CRITICAL RULES FOR CONCISENESS & PRECISION:
1. Provide actionable scripts for counter-offers.
2. Focus on Total Compensation (Base, Equity, Bonus).
3. Do not be overly polite. Give exact scripts to say.`,
  FullMock: `You are a rigorous FAANG technical interviewer conducting a mock interview.
CRITICAL RULES FOR CONCISENESS & PRECISION:
1. Evaluate the candidate's previous response and ask exactly ONE challenging follow-up question or hint.
2. Keep your question under 2 sentences. Direct and probing.`
};

const DIFFICULTY_LEVELS = {
  Easy: "Focus on fundamental data structures and straightforward algorithms.",
  Medium: "Focus on optimal time/space tradeoffs, standard DP, graphs, and trees.",
  Hard: "Focus on advanced algorithms (e.g., Trie, Union-Find, Segment Tree, complex DP) and severe constraints.",
  FAANG: "Focus on production-level optimization, concurrency edge cases, and extreme scalability constraints."
};

let currentCoachMode = "DSA";
let currentDifficulty = "Medium";

function selectCoachMode(mode) {
  if (COACH_MODES[mode]) {
    currentCoachMode = mode;
    console.log("[Interview Coach] Mode switched to:", mode);
    updateActiveModeBanner();
    if (typeof updateSystemPrompt === 'function') updateSystemPrompt();
  }
}

function setDifficultyLevel(level) {
  if (DIFFICULTY_LEVELS[level]) {
    currentDifficulty = level;
    console.log("[Interview Coach] Difficulty set to:", level);
    updateActiveModeBanner();
    if (typeof updateSystemPrompt === 'function') updateSystemPrompt();
  }
}

function getInterviewContextPrompt() {
  const modePrompt = COACH_MODES[currentCoachMode] || COACH_MODES.DSA;
  const diffPrompt = DIFFICULTY_LEVELS[currentDifficulty] || DIFFICULTY_LEVELS.Medium;
  return `=== CURRENT INTERVIEW ROUND SPECIFICATION ===\nPersona & Mode: ${currentCoachMode}\nDifficulty Standard: ${currentDifficulty} (${diffPrompt})\n${modePrompt}\n===========================================`;
}

function sendQuickPrompt(promptText) {
  const inputEl = document.getElementById('userInput');
  if (inputEl) {
    inputEl.value = promptText;
    if (typeof sendMessage === 'function') sendMessage();
  }
}

function updateActiveModeBanner() {
  const modeTextEl = document.getElementById('activeModeText');
  const diffBadgeEl = document.getElementById('activeDiffBadge');
  if (modeTextEl) {
    const titles = {
      DSA: "⚡ DSA Live Coding (Concise Mode)",
      SystemDesign: "🏗️ System Design Architecture",
      Behavioral: "🤝 Behavioral & Leadership (STAR)",
      FullMock: "🎯 Rigorous Mock Interview",
      SalaryNegotiator: "💰 Salary Negotiation Expert"
    };
    modeTextEl.textContent = titles[currentCoachMode] || titles.DSA;
  }
  if (diffBadgeEl) {
    diffBadgeEl.textContent = currentDifficulty;
    diffBadgeEl.className = 'difficulty-badge diff-' + currentDifficulty.toLowerCase();
  }
}

let targetCompany = "General";
function setTargetCompany(company) {
  targetCompany = company;
  console.log("[Interview Coach] Target Company set to:", company);
  if (typeof updateSystemPrompt === 'function') updateSystemPrompt();
}
