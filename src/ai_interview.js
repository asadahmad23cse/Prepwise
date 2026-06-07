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
  return `=== CURRENT INTERVIEW ROUND SPECIFICATION ===\nPersona & Mode: ${currentCoachMode}\nTarget Company: ${targetCompany}\nDifficulty Standard: ${currentDifficulty} (${diffPrompt})\n${modePrompt}\nAlign all answers to the expected standards of ${targetCompany}.\n===========================================`;
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
  
  // Dynamic color morphing based on selected target company
  const root = document.documentElement;
  const companyThemes = {
    General: {
      '--accent-purple': '#8b5cf6',
      '--accent-violet': '#c084fc',
      '--accent-cyan': '#22d3ee'
    },
    Google: {
      '--accent-purple': '#4285f4', // Google Blue
      '--accent-violet': '#ea4335', // Google Red
      '--accent-cyan': '#34a853'    // Google Green
    },
    Meta: {
      '--accent-purple': '#0081fb', // Meta Blue
      '--accent-violet': '#00c6ff', // Meta Light Blue
      '--accent-cyan': '#00f2fe'    // Meta Teal
    },
    Amazon: {
      '--accent-purple': '#ff9900', // Amazon Orange
      '--accent-violet': '#ffb700', // Amazon Gold
      '--accent-cyan': '#146eb4'    // Amazon Blue
    },
    Netflix: {
      '--accent-purple': '#e50914', // Netflix Red
      '--accent-violet': '#b81d24', // Netflix Dark Red
      '--accent-cyan': '#f8fafc'    // Ice White
    }
  };

  const theme = companyThemes[company] || companyThemes.General;
  Object.keys(theme).forEach(key => {
    root.style.setProperty(key, theme[key]);
  });

  // Dynamically change ambient background colors to match selected theme
  const bgOrb1 = document.querySelector('.bg-orb-1');
  const bgOrb2 = document.querySelector('.bg-orb-2');
  const bgOrb3 = document.querySelector('.bg-orb-3');
  
  if (bgOrb1) bgOrb1.style.backgroundColor = theme['--accent-purple'];
  if (bgOrb2) bgOrb2.style.backgroundColor = theme['--accent-cyan'];
  if (bgOrb3) bgOrb3.style.backgroundColor = theme['--accent-violet'];

  // Add system feedback
  if (typeof appendMessage === 'function') {
    appendMessage('assistant', `Target interview engine re-calibrated for **${company}**. UI accents and neural prompts optimized.`);
  }

  if (typeof updateSystemPrompt === 'function') updateSystemPrompt();
}

// Load custom mock interview templates from the filesystem
function loadCustomTemplates(filePath) {
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const templates = JSON.parse(data);
      Object.assign(COACH_MODES, templates);
      console.log("[Interview Coach] Loaded custom templates:", Object.keys(templates));
      // Refresh banner if current mode was updated
      updateActiveModeBanner();
      if (typeof updateSystemPrompt === 'function') updateSystemPrompt();
      return true;
    }
  } catch (e) {
    console.error("[Interview Coach] Failed to load custom templates:", e.message);
  }
  return false;
}

// Expose to window/global scope if running in renderer
if (typeof window !== 'undefined') {
  window.loadCustomTemplates = loadCustomTemplates;
}
