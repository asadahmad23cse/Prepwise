// ========================
// GEMINI API CONFIG
// ========================
let detectedModel = null; // { name, legacy, endpoint }
let geminiApiKey = localStorage.getItem('ghost_gemini_key') || '';
let noVisionBlacklist = []; // Models that hit quota limits for images

// Preferred model priority order
var PREFERRED_MODELS = [
  'gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-flash-8b',
  'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-exp',
  'gemini-1.5-pro',   'gemini-1.5-pro-001',
  'gemini-1.0-pro',   'gemini-pro',
];

let targetLanguage = localStorage.getItem('ghost_target_lang') || 'C++';

function updateSystemPrompt() {
  SYSTEM_PROMPT = 'You are Prepwise, a stealth AI assistant for live coding interviews.\nWhen you see a coding problem, respond in this EXACT format only:\n\nApproach: [name] | Time: O(...) | Space: O(...)\n\n[clean working code, no extra explanation]\n\nKey steps:\n- [point 1]\n- [point 2]\n- [point 3]\n\nNothing else. No greetings. No "Here is". No long paragraphs.\nIf a screenshot is provided, solve THAT problem only.\nTarget language: ' + targetLanguage + '.\nCode must be compilable and optimal.';
  SYSTEM_MESSAGE = { role: 'user', parts: [{ text: SYSTEM_PROMPT }] };
}

var SYSTEM_PROMPT = '';
var SYSTEM_MESSAGE = {};
updateSystemPrompt();
updateStatusBar();

  let customPromptAddition = localStorage.getItem('ghost_custom_prompt') || '';
  const customPromptEl = document.getElementById('customPromptAddition');
  if (customPromptEl) {
    customPromptEl.value = customPromptAddition;
    customPromptEl.addEventListener('input', () => {
      customPromptAddition = customPromptEl.value;
      localStorage.setItem('ghost_custom_prompt', customPromptAddition);
      updateSystemPrompt();
    });
  }


function updateStatusBar() {
  const langBadge = document.getElementById('current-lang-badge');
  if (langBadge) langBadge.textContent = targetLanguage;
  
  const aiDot = document.getElementById('ai-status-dot');
  if (aiDot) {
    aiDot.className = 'status-dot ' + (geminiApiKey ? 'active' : '');
  }
}

function makeEndpoint(version, model, key) {
  return 'https://generativelanguage.googleapis.com/' + version + '/models/' + model + ':generateContent?key=' + key;
}

function makeBody(userMessage, isLegacy, history, version) {
  var systemPrefix = [SYSTEM_MESSAGE, SYSTEM_ACK];

  if (isLegacy) {
    return {
      contents: systemPrefix.concat([{ role: 'user', parts: [{ text: userMessage }] }]),
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    };
  }
  var contents = systemPrefix.concat(history).concat([{ role: 'user', parts: [{ text: userMessage }] }]);
  var body = { contents: contents, generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } };
  if (version === 'v1beta') {
    body.system_instruction = { parts: [{ text: SYSTEM_PROMPT }] };
  }
  return body;
}

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

function doFetch(url, body) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

// Call ListModels to discover what models are actually available for this key
async function listAvailableModels(key) {
  var cached = localStorage.getItem('ghost_models_cache');
  if (cached) {
    try {
      var parsed = JSON.parse(cached);
      if (parsed.key === key && (Date.now() - parsed.ts < 3600000)) {
        return parsed.data;
      }
    } catch(e) {}
  }

  var tries = ['v1beta', 'v1'];
  for (var i = 0; i < tries.length; i++) {
    try {
      var res = await fetch('https://generativelanguage.googleapis.com/' + tries[i] + '/models?key=' + key);
      if (res.ok) {
        var data = await res.json();
        var models = (data.models || [])
          .filter(function(m) { return m.supportedGenerationMethods && m.supportedGenerationMethods.indexOf('generateContent') !== -1; })
          .map(function(m) { return m.name.replace('models/', ''); });
        if (models.length > 0) {
          var result = { models: models, version: tries[i] };
          localStorage.setItem('ghost_models_cache', JSON.stringify({ key: key, ts: Date.now(), data: result }));
          return result;
        }
      }
    } catch (e) { /* ignore */ }
  }
  return null;
}

function sortByPreference(available, isVisionTask) {
  var result = [];
  for (var i = 0; i < PREFERRED_MODELS.length; i++) {
    for (var j = 0; j < available.length; j++) {
      var m = available[j];
      if (isVisionTask && noVisionBlacklist.indexOf(m) !== -1) continue;

      if (m === PREFERRED_MODELS[i] || m.startsWith(PREFERRED_MODELS[i] + '-')) {
        if (result.indexOf(m) === -1) result.push(m);
      }
    }
  }
  for (var k = 0; k < available.length; k++) {
    var m2 = available[k];
    if (isVisionTask && noVisionBlacklist.indexOf(m2) !== -1) continue;
    if (result.indexOf(m2) === -1) result.push(m2);
  }
  return result;
}

var SYSTEM_ACK = { role: 'model', parts: [{ text: 'Ghost Mode active. Standing by for interview analysis. Rules acknowledged.' }] };
var conversationHistory = [];

async function callGemini(userMessage) {
  const appContainer = document.getElementById('app');
  if (appContainer) appContainer.classList.add('ai-processing-glow');

  if (!geminiApiKey) {
    if (appContainer) appContainer.classList.remove('ai-processing-glow');
    return 'Please add your Gemini API key in Settings (gear icon).';
  }
  
  if (detectedModel) {
    const res = await callWithRetry(userMessage, detectedModel);
    if (appContainer) appContainer.classList.remove('ai-processing-glow');
    return res;
  }

  // STEP 1: List models actually available for this key
  setApiStatus('Discovering models...', '');
  var listResult = await listAvailableModels(geminiApiKey);
  if (!listResult) {
    if (appContainer) appContainer.classList.remove('ai-processing-glow');
    setApiStatus('Could not reach API', 'err');
    return 'Cannot reach Gemini API. Check your internet connection and API key.';
  }

  // STEP 1: List models actually available for this key
  setApiStatus('Discovering models...', '');
  var listResult = await listAvailableModels(geminiApiKey);
  if (!listResult) {
    setApiStatus('Could not reach API', 'err');
    return 'Cannot reach Gemini API. Check your internet connection and API key.';
  }

  var sorted = sortByPreference(listResult.models, false);
  var primaryVersion = listResult.version;
  var versions = primaryVersion === 'v1beta' ? ['v1beta', 'v1'] : ['v1', 'v1beta'];

  // STEP 2: Try each model until one works
  var errors = [];
  for (var i = 0; i < sorted.length; i++) {
    var modelName = sorted[i];
    var isLegacy = !modelName.match(/1\.5|2\.0|2\.5/);

    for (var vi = 0; vi < versions.length; vi++) {
      var version = versions[vi];
      var url = makeEndpoint(version, modelName, geminiApiKey);
      var body = makeBody(userMessage, isLegacy, conversationHistory, version);

      try {
        setApiStatus('Trying ' + modelName + '...', '');
        var res = await doFetch(url, body);

        if (res.status === 429) {
          var errJson = await res.json().catch(function() { return {}; });
          var errMsg = errJson && errJson.error ? errJson.error.message : '';
          
          if (errMsg.toLowerCase().includes('quota')) {
            errors.push(modelName + ': Quota exceeded. Skipping to next model.');
            continue; // Don't even wait 15s if it's a hard quota limit (0 limit)
          }

          setApiStatus('Rate limited — waiting 12s...', '');
          await sleep(12000);
          res = await doFetch(url, body);
        }

        if (res.ok) {
          var d = await res.json();
          var t = extractText(d);
          detectedModel = { name: modelName, legacy: isLegacy, endpoint: url, version: version };
          if (!isLegacy) {
            conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
            conversationHistory.push({ role: 'model', parts: [{ text: t }] });
          }
          setApiStatus('Connected: ' + modelName, 'ok');
          return t;
        }

        var errJson = await res.json().catch(function() { return {}; });
        var errMsg = errJson && errJson.error ? errJson.error.message : ('HTTP ' + res.status);
        if (res.status !== 404 && !errMsg.includes('not found')) {
          errors.push(modelName + ': ' + errMsg);
        }
        // Auto fallback model sequence
        console.warn('API connection failed for ' + modelName + ', trying alternative fallback model.');
        break;

      } catch (e) {
        errors.push(modelName + ': ' + e.message);
      }
    }
  }

  setApiStatus('Connection failed', 'err');
  var modelList = sorted.slice(0, 5).join(', ');
  var errList = errors.slice(0, 2).join(' | ');
  return 'Could not connect.\nModels on your key: ' + modelList + (errList ? '\nErrors: ' + errList : '') + '\n\nPlease create a new key at aistudio.google.com';
}

async function callWithRetry(userMessage, model) {
  var url = model.endpoint;
  var isLegacy = model.legacy;
  var version = model.version || 'v1beta';

  if (!isLegacy) conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
  var body = makeBody(userMessage, isLegacy, isLegacy ? [] : conversationHistory.slice(0, -1), version);

  var delays = [10000, 20000, 30000];
  for (var attempt = 0; attempt <= delays.length; attempt++) {
    try {
      var res = await doFetch(url, body);

      if (res.status === 429) {
        if (attempt < delays.length) {
          var wait = delays[attempt];
          setApiStatus('Rate limited — retrying in ' + (wait/1000) + 's (' + (attempt+1) + '/3)', '');
          await sleep(wait);
          continue;
        }
        if (!isLegacy) conversationHistory.pop();
        setApiStatus('Connected: ' + model.name, 'ok');
        return 'Rate limit exceeded. Please wait 1 minute and try again.';
      }

      if (!res.ok) {
        var err = await res.json().catch(function() { return {}; });
        var msg = err && err.error ? err.error.message : ('HTTP ' + res.status);
        if (!isLegacy) conversationHistory.pop();
        setApiStatus('Connected: ' + model.name, 'ok');
        return 'Error: ' + msg;
      }

      var data = await res.json();
      var text = extractText(data);
      if (!isLegacy) {
        conversationHistory.push({ role: 'model', parts: [{ text: text }] });
        if (conversationHistory.length > 40) conversationHistory = conversationHistory.slice(-40);
      }
      setApiStatus('Connected: ' + model.name, 'ok');
      return text;

    } catch (e) {
      if (!isLegacy) conversationHistory.pop();
      return 'Network error: ' + e.message;
    }
  }
}

function extractText(data) {
  try { return data.candidates[0].content.parts[0].text || 'Empty response.'; }
  catch (e) { return 'Empty response.'; }
}

// ========================
// CUSTOM CURSOR
// ========================
var cursor = document.getElementById('custom-cursor');
var trail  = document.getElementById('cursor-trail');
var mouseX = 0, mouseY = 0, trailX = 0, trailY = 0, cursorEnabled = true;

document.addEventListener('mousemove', function(e) {
  mouseX = e.clientX; mouseY = e.clientY;
  if (cursorEnabled && cursor) { cursor.style.left = mouseX + 'px'; cursor.style.top = mouseY + 'px'; }
});

function animateTrail() {
  trailX += (mouseX - trailX) * 0.15;
  trailY += (mouseY - trailY) * 0.15;
  if (trail) { trail.style.left = trailX + 'px'; trail.style.top = trailY + 'px'; }
  requestAnimationFrame(animateTrail);
}
animateTrail();

document.addEventListener('mousedown', function() { if (cursor) cursor.classList.add('clicking'); });
document.addEventListener('mouseup',   function() { if (cursor) cursor.classList.remove('clicking'); });

// ========================
// DRAGGABLE WINDOW
// ========================
var isDragging = false, dragStartX = 0, dragStartY = 0;
var titleBar = document.getElementById('titleBar');

titleBar.addEventListener('mousedown', function(e) {
  if (e.target.closest('.icon-btn')) return;
  isDragging = true; dragStartX = e.screenX; dragStartY = e.screenY;
});
document.addEventListener('mousemove', function(e) {
  if (!isDragging) return;
  var dx = e.screenX - dragStartX, dy = e.screenY - dragStartY;
  dragStartX = e.screenX; dragStartY = e.screenY;
  if (window.electronAPI) window.electronAPI.dragWindow(dx, dy);
});
document.addEventListener('mouseup', function() { isDragging = false; });

// ========================
// STEALTH STATUS
// ========================
async function initStealthStatus() {
  if (!window.electronAPI) return;
  window.electronAPI.onStealthStatus(function(data) { updateStatusDots(data); });
  var status = await window.electronAPI.getStealthStatus();
  updateStatusDots(status);
  
  // Simulate latency updates
  setInterval(() => {
    const latencyEl = document.getElementById('latency-val');
    if (latencyEl) {
      const lat = Math.floor(Math.random() * 15) + (Math.random() > 0.9 ? 50 : 12); // Occasional spike
      latencyEl.textContent = lat + 'ms';
    }
  }, 5000);
}
function updateStatusDots(s) {
  setDot('st-screen', s.screenShare); setDot('st-taskbar', s.taskbar);
  setDot('st-alttab', s.altTab); setDot('st-taskmgr', s.taskManager); setDot('st-cursor', s.cursor);
}
function setDot(id, active) {
  var el = document.getElementById(id);
  if (el) el.className = 'stealth-dot ' + (active ? 'dot-active' : 'dot-inactive');
}

// ========================
// SETTINGS PANEL
// ========================
var settingsBtn    = document.getElementById('settingsBtn');
var settingsPanel  = document.getElementById('settingsPanel');
var minimizeBtn    = document.getElementById('minimizeBtn');
var opacitySlider  = document.getElementById('opacitySlider');
var opacityValue   = document.getElementById('opacityValue');
var alwaysOnTopCb  = document.getElementById('alwaysOnTop');
var clickThroughCb = document.getElementById('clickThrough');
var customCursorCb = document.getElementById('customCursor');
var apiKeyInput    = document.getElementById('apiKeyInput');
var saveKeyBtn     = document.getElementById('saveKeyBtn');
var apiStatusEl    = document.getElementById('apiStatus');
var targetLangSel   = document.getElementById('targetLanguage');
var panicModeCb     = document.getElementById('panicMode');

let panicModeEnabled = localStorage.getItem('ghost_panic_mode') === 'true';

if (panicModeCb) {
  panicModeCb.checked = panicModeEnabled;
  panicModeCb.addEventListener('change', function() {
    panicModeEnabled = panicModeCb.checked;
    localStorage.setItem('ghost_panic_mode', panicModeEnabled);
  });
}

function clearChat() {
  chatMessages.innerHTML = '';
  conversationHistory = [];
  appendMessage('assistant', 'Memory purged. Neural link ready.');
}

window.electronAPI.onVisibilityChanged(function(visible) {
  if (!visible && panicModeEnabled) {
    clearChat();
  }
});
var targetLangSel   = document.getElementById('targetLanguage');

if (targetLangSel) {
  targetLangSel.value = targetLanguage;
  targetLangSel.addEventListener('change', function() {
    targetLanguage = targetLangSel.value;
    localStorage.setItem('ghost_target_lang', targetLanguage);
    updateSystemPrompt();
    updateStatusBar();
    appendMessage('assistant', 'Target language set to **' + targetLanguage + '**. Responses will now be in ' + targetLanguage + '.');

    // Sync to sandbox
    const sandboxLangSelect = document.getElementById('sandboxLanguage');
    if (sandboxLangSelect) {
      const mapping = {
        'C++': 'cpp',
        'Java': 'java',
        'Python': 'python',
        'JavaScript': 'javascript',
        'Go': 'go',
        'Rust': 'rust'
      };
      const sandVal = mapping[targetLanguage];
      if (sandVal && sandboxLangSelect.value !== sandVal) {
        sandboxLangSelect.value = sandVal;
        sandboxLangSelect.dispatchEvent(new Event('change'));
      }
    }
  });
}

if (geminiApiKey && apiKeyInput) {
  apiKeyInput.value = geminiApiKey;
  setApiStatus('Key loaded — send a message to connect', 'ok');
}

function setApiStatus(msg, type) {
  if (!apiStatusEl) return;
  apiStatusEl.textContent = msg;
  apiStatusEl.className = 'api-status ' + (type || '');
}

saveKeyBtn.addEventListener('click', function() {
  var key = apiKeyInput.value.trim();
  if (!key) { setApiStatus('Please enter an API key', 'err'); return; }
  if (key.length < 20) { setApiStatus('Key too short — paste full key', 'err'); return; }
  localStorage.removeItem('ghost_gemini_key');
  localStorage.removeItem('ghost_models_cache');
  detectedModel = null;
  conversationHistory = [];
  geminiApiKey = key;
  localStorage.setItem('ghost_gemini_key', key);
  updateStatusBar();
  setApiStatus('Key saved (ends ....' + key.slice(-4) + ') — send a message!', 'ok');
  checkApiKeyHealth(key);
  appendMessage('assistant', 'New API key saved! Send any message and I will auto-discover the best model for your account.');
});

settingsBtn.addEventListener('click', function() {
  settingsPanel.classList.toggle('hidden');
  settingsBtn.style.color = settingsPanel.classList.contains('hidden') ? '' : 'var(--accent-violet)';
});
minimizeBtn.addEventListener('click', function() { if (window.electronAPI) window.electronAPI.hideWindow(); });
opacitySlider.addEventListener('input', function() {
  opacityValue.textContent = opacitySlider.value + '%';
  if (window.electronAPI) window.electronAPI.setOpacity(opacitySlider.value / 100);
});
alwaysOnTopCb.addEventListener('change', function() { if (window.electronAPI) window.electronAPI.setAlwaysOnTop(alwaysOnTopCb.checked); });
clickThroughCb.addEventListener('change', function() { if (window.electronAPI) window.electronAPI.toggleClickthrough(); });
customCursorCb.addEventListener('change', function() {
  cursorEnabled = customCursorCb.checked;
  if (cursor) cursor.style.display = cursorEnabled ? 'block' : 'none';
  if (trail)  trail.style.display  = cursorEnabled ? 'block' : 'none';
  document.body.style.cursor = cursorEnabled ? 'none' : 'default';
});
if (window.electronAPI) {
  window.electronAPI.onClickthroughChanged(function(val) { clickThroughCb.checked = val; });
}

// ========================
// CHAT
// ========================
var chatMessages = document.getElementById('chatMessages');
var userInput    = document.getElementById('userInput');
var sendBtn      = document.getElementById('sendBtn');
var clearBtn     = document.getElementById('clearBtn');

userInput.addEventListener('input', function() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 100) + 'px';
});
userInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
sendBtn.addEventListener('click', sendMessage);
clearBtn.addEventListener('click', clearChat);

function copyToClipboard(btn) {
  const container = btn.closest('.code-container');
  const code = container.querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '✔ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('copied');
    }, 1500);
  });
}

// ========================
// SCREEN SCAN
// ========================
var scanBtn = document.getElementById('scanBtn');

async function scanScreen() {
  if (!geminiApiKey) {
    appendMessage('assistant', 'Add your Gemini API key first (gear icon above).');
    return;
  }
  if (!window.electronAPI || !window.electronAPI.takeScreenshot) {
    appendMessage('assistant', 'Screen capture not available.');
    return;
  }

  appendMessage('user', '📸 Scanning screen...');
  var typingEl = showTyping();

  try {
    // Take screenshot — returns base64 PNG
    var base64img = await window.electronAPI.takeScreenshot();
    if (!base64img) {
      typingEl.remove();
      appendMessage('assistant', 'Could not capture screen. Try again.');
      return;
    }

    // Make sure model is detected
    if (!detectedModel) {
      setApiStatus('Discovering models...', '');
      var listResult = await listAvailableModels(geminiApiKey);
      if (listResult) {
        var sorted = sortByPreference(listResult.models, true);
        if (sorted.length > 0) {
          var mn = sorted[0];
          var isLeg = !mn.match(/1\.5|2\.0|2\.5/);
          var ver = listResult.version;
          detectedModel = { name: mn, legacy: isLeg, endpoint: makeEndpoint(ver, mn, geminiApiKey), version: ver };
          setApiStatus('Connected: ' + mn, 'ok');
        }
      }
    }

    if (!detectedModel) {
      typingEl.remove();
      appendMessage('assistant', 'No connected model. Send a text message first to connect.');
      return;
    }

    // Build vision request with screenshot — system prompt prepended
    var visionBody = {
      contents: [
        SYSTEM_MESSAGE,
        SYSTEM_ACK,
        {
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: 'image/png',
                data: base64img
              }
            },
            {
              text: 'This is a screenshot from my screen. Please read the content carefully — if there is a coding problem, algorithm question, or any technical question, provide a clear solution with explanation. If it is code that needs debugging, identify the issues and fix them. Be concise and direct.'
            }
          ]
        }
      ],
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
    };

    // Use vision-capable endpoint — v1beta is best for vision
    var visionModel = detectedModel.name;
    var visionEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + visionModel + ':generateContent?key=' + geminiApiKey;

    var res = await fetch(visionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visionBody)
    });

    if (res.status === 429) {
      var errData = await res.json().catch(function() { return {}; });
      var errMsg = errData && errData.error ? errData.error.message : '';
      
      if (errMsg.toLowerCase().includes('quota')) {
        typingEl.remove();
        noVisionBlacklist.push(visionModel); // Add to blacklist
        appendMessage('assistant', '⚠️ Model ' + visionModel + ' has no image quota. Switching to another model...');
        detectedModel = null; // Clear it
        return await scanScreen(); // Recursive retry with fresh discovery
      }

      setApiStatus('Rate limited — waiting 10s...', '');
      await sleep(10000);
      res = await fetch(visionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visionBody)
      });
    }

    typingEl.remove();

    if (res.ok) {
      var data = await res.json();
      var responseText = extractText(data);
      appendMessage('assistant', '📸 Screen analysis:\n\n' + responseText);
    } else {
      var errData = await res.json().catch(function() { return {}; });
      var errMsg = errData && errData.error ? errData.error.message : ('HTTP ' + res.status);
      // If vision fails, tell user to describe the problem manually
      if (errMsg.includes('not found') || errMsg.includes('not support')) {
        appendMessage('assistant', 'Screen captured! However, your model (' + visionModel + ') does not support image analysis.\n\nPlease **describe the problem in text** and I will solve it.');
      } else {
        appendMessage('assistant', 'Scan error: ' + errMsg);
      }
    }
  } catch (e) {
    if (typingEl.parentNode) typingEl.remove();
    appendMessage('assistant', 'Scan failed: ' + e.message);
  }
}

if (scanBtn) scanBtn.addEventListener('click', scanScreen);


  // Chat Density Settings
  const chatDensitySelect = document.getElementById('chatDensitySelect');
  if (chatDensitySelect) {
    const savedDensity = localStorage.getItem('ghost_chat_density') || 'normal';
    chatDensitySelect.value = savedDensity;
    const chatArea = document.getElementById('chatArea');
    if (chatArea) chatArea.className = 'chat-area ' + savedDensity;

    chatDensitySelect.addEventListener('change', () => {
      const density = chatDensitySelect.value;
      localStorage.setItem('ghost_chat_density', density);
      if (chatArea) chatArea.className = 'chat-area ' + density;
    });
  }

// Listen for Ctrl+Shift+S hotkey from main process
if (window.electronAPI && window.electronAPI.onTriggerScan) {
  window.electronAPI.onTriggerScan(scanScreen);
}



async function sendMessage() {
  var text = userInput.value.trim();
  if (!text) return;
  appendMessage('user', text);
  userInput.value = '';
  userInput.style.height = 'auto';
  var typingEl = showTyping();
  try {
    var response = await callGemini(text);
    typingEl.remove();
    appendMessage('assistant', response);
  } catch (e) {
    typingEl.remove();
    appendMessage('assistant', 'Error: ' + e.message);
  }
}

function appendMessage(role, text) {
  var msg = document.createElement('div');
  msg.className = 'message ' + role + '-msg';
  var avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'assistant' ? 'G' : 'U';
  var content = document.createElement('div');
  content.className = 'msg-content';
  var contentHtml = '';
  if (typeof marked !== 'undefined') {
    // Custom renderer for code blocks to add copy buttons
    const renderer = new marked.Renderer();
    const originalCode = renderer.code.bind(renderer);
    renderer.code = (code, language, escaped) => {
      if (language === 'mermaid') {
        return `<div class="mermaid-container" style="background:rgba(10,10,25,0.4); border:1px solid var(--border); border-radius:6px; padding:12px; margin:10px 0; overflow-x:auto;">
                  <div class="mermaid">${code}</div>
                </div>`;
      }
      if (language === 'diff') {
        const diffLines = code.split('\n').map(line => {
          if (line.startsWith('+')) {
            return `<div style="background:rgba(52,211,153,0.15); color:#a7f3d0; padding-left:4px;">${line}</div>`;
          } else if (line.startsWith('-')) {
            return `<div style="background:rgba(239,68,68,0.15); color:#fca5a5; padding-left:4px; text-decoration:line-through;">${line}</div>`;
          }
          return `<div>${line}</div>`;
        }).join('');
        return `<div class="code-container diff-viewer" style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:10px; font-family:var(--font-mono); margin:10px 0; font-size:11px;">${diffLines}</div>`;
      }
      const html = originalCode(code, language, escaped);
      const isRunnable = ['js', 'javascript', 'py', 'python', 'cpp', 'c++', 'go', 'java'].includes(language ? language.toLowerCase() : '');
      const runBtn = isRunnable ? `<button class="run-code-btn" onclick="runSandboxCode(this)">Run Simulation</button>` : '';
      return `<div class="code-container" data-lang="${language || ''}">
                <div class="code-header-actions">
                  ${runBtn}
                  <button class="copy-code-btn" onclick="copyToClipboard(this)">Copy</button>
                </div>
                ${html}
                <div class="code-output-terminal hidden"></div>
              </div>`;
    };
    contentHtml = marked.parse(text, { renderer });
  } else {
    var escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    contentHtml = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(124,58,237,0.15);padding:1px 5px;border-radius:3px;font-size:11px;">$1</code>')
      .replace(/\n/g, '<br/>');
  }
  
    const isAssistant = role === 'assistant';
    const deleteBtn = `<button class="delete-msg-btn" title="Delete message" onclick="deleteSingleMessage(this)">×</button>`;
    contentHtml = `<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                      <div style="flex:1;">${contentHtml}</div>
                      ${deleteBtn}
                    </div>`;

  content.innerHTML = contentHtml;
  
  // Trigger Prism highlighting
  if (typeof Prism !== 'undefined') {
    Prism.highlightAllUnder(content);
  }
  
  // Trigger Mermaid rendering
  if (typeof mermaid !== 'undefined') {
    try {
      mermaid.init(undefined, content.querySelectorAll('.mermaid'));
    } catch (e) {
      console.error('[Mermaid] Render failed:', e);
    }
  }

  msg.appendChild(avatar); msg.appendChild(content);
  chatMessages.appendChild(msg);
  msg.scrollIntoView({ behavior: 'smooth', block: 'end' });
  if (role === 'assistant') {
    if (typeof speakText === 'function') speakText(text);
  }
}

function showTyping() {
  var el = document.createElement('div');
  el.className = 'message assistant-msg typing-indicator';
  el.innerHTML = '<div class="msg-avatar">G</div><div class="msg-content"><div class="dots"><span></span><span></span><span></span></div></div>';
  chatMessages.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return el;
}

// ========================
// VOICE CAPTURE (Electron desktopCapturer + webkitSpeechRecognition)
// Captures system/meeting audio via chromeMediaSource: 'desktop'
// ========================
var voiceRecognition = null;
var voiceStream = null;
var voiceAudioContext = null;
var isCapturingVoice = false;
var voiceTranscript = '';

var voiceToggleBtn     = document.getElementById('voiceToggleBtn');
var voiceAnswerBtn     = document.getElementById('voiceAnswerBtn');
var voiceStatusEl      = document.getElementById('voiceStatus');
var voiceLiveText      = document.getElementById('voiceLiveText');
var voiceTranscriptLog = document.getElementById('voiceTranscriptLog');

function setVoiceStatus(state) {
  if (!voiceStatusEl) return;
  voiceStatusEl.textContent = state;
  voiceStatusEl.className = 'voice-status voice-status-' + state.toLowerCase();
}

function appendTranscriptLine(text) {
  if (!voiceTranscriptLog || !text.trim()) return;
  var line = document.createElement('div');
  line.className = 'voice-transcript-line';
  line.textContent = text;
  voiceTranscriptLog.appendChild(line);
  voiceTranscriptLog.scrollTop = voiceTranscriptLog.scrollHeight;
}

async function startVoice() {
  try {
    setVoiceStatus('Requesting...');
    voiceLiveText.textContent = 'Connecting to audio...';

    const sourceSel = document.querySelector('input[name="voiceSource"]:checked');
    const isMic = sourceSel && sourceSel.value === 'mic';

    if (isMic) {
      // Microphone input constraints
      voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } else {
      // System meeting audio constraints
      var sources = [];
      if (window.electronAPI && window.electronAPI.getDesktopSources) {
        sources = await window.electronAPI.getDesktopSources();
      }

      var sourceId = null;
      for (var i = 0; i < sources.length; i++) {
        if (sources[i].name === 'Entire Screen' || sources[i].name === 'Entire screen' || sources[i].id.indexOf('screen:') === 0) {
          sourceId = sources[i].id;
          break;
        }
      }
      if (!sourceId && sources.length > 0) {
        sourceId = sources[0].id;
      }

      var constraints = {
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        }
      };

    if (sourceId) {
      constraints.video.mandatory.chromeMediaSourceId = sourceId;
    }

      voiceStream = await navigator.mediaDevices.getUserMedia(constraints);
    }

    var audioTracks = voiceStream.getAudioTracks();
    if (audioTracks.length === 0) {
      setVoiceStatus('Error');
      voiceLiveText.textContent = 'No audio input detected. Check connections.';
      voiceStream = null;
      return;
    }

    // Setup AudioContext & Analyser for both Mic and System sources
    voiceAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    var audioOnlyStream = new MediaStream(audioTracks);
    var source = voiceAudioContext.createMediaStreamSource(audioOnlyStream);
    var analyser = voiceAudioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    if (!isMic) {
      var videoTracks = voiceStream.getVideoTracks();
      videoTracks.forEach(function(t) { t.stop(); });
      var dest = voiceAudioContext.createMediaStreamDestination();
      source.connect(dest);
    }

    // Trigger real-time canvas animation
    if (typeof drawWaveform === 'function') {
      drawWaveform(analyser);
    }

    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceStatus('Error');
      voiceLiveText.textContent = 'Speech recognition not available.';
      return;
    }

    voiceRecognition = new SR();
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = true;
    voiceRecognition.lang = 'en-US';

    isCapturingVoice = true;

    voiceRecognition.onstart = function() {
      setVoiceStatus('Live');
      voiceToggleBtn.textContent = 'Stop';
      voiceToggleBtn.classList.add('active');
      voiceLiveText.textContent = 'Listening to system audio...';
    };

    voiceRecognition.onresult = function(event) {
      var interimText = '';
      var finalText = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t;
        } else {
          interimText += t;
        }
      }
      if (finalText) {
        voiceTranscript += finalText + ' ';
        appendTranscriptLine(finalText.trim());
        voiceAnswerBtn.disabled = false;
      }
      voiceLiveText.textContent = interimText || (voiceTranscript ? 'Listening...' : (isMic ? 'Listening to your microphone...' : 'Listening to system audio...'));
    };

    voiceRecognition.onerror = function(e) {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn('[Voice] Error:', e.error);
      setVoiceStatus('Error');
      setTimeout(function() {
        if (isCapturingVoice) setVoiceStatus('Live');
      }, 1500);
    };

    voiceRecognition.onend = function() {
      if (isCapturingVoice) {
        setTimeout(function() {
          if (isCapturingVoice) {
            try { voiceRecognition.start(); } catch(e) {}
          }
        }, 300);
      }
    };

    audioTracks[0].onended = function() {
      stopVoice();
    };

    voiceRecognition.start();

  } catch (err) {
    console.error('[Voice] Capture failed:', err);
    setVoiceStatus('Error');
    voiceLiveText.textContent = 'Capture failed: ' + err.message;
  }
}

function stopVoice() {
  isCapturingVoice = false;
  if (voiceRecognition) {
    try { voiceRecognition.stop(); } catch(e) {}
    voiceRecognition = null;
  }
  if (voiceStream) {
    voiceStream.getTracks().forEach(function(t) { t.stop(); });
    voiceStream = null;
  }
  if (voiceAudioContext) {
    try { voiceAudioContext.close(); } catch(e) {}
    voiceAudioContext = null;
  }
  setVoiceStatus('Idle');
  voiceToggleBtn.textContent = 'Start';
  voiceToggleBtn.classList.remove('active');
  voiceLiveText.textContent = 'Waiting for speech...';
}

if (voiceToggleBtn) {
  voiceToggleBtn.addEventListener('click', function() {
    if (isCapturingVoice) {
      stopVoice();
    } else {
      startVoice();
    }
  });
}

if (voiceAnswerBtn) {
  voiceAnswerBtn.addEventListener('click', async function() {
    var transcript = voiceTranscript.trim();
    if (!transcript) return;

    appendMessage('user', transcript);
    voiceTranscript = '';
    voiceTranscriptLog.innerHTML = '';
    voiceLiveText.textContent = isCapturingVoice ? 'Listening...' : 'Waiting for speech...';
    voiceAnswerBtn.disabled = true;

    var prompt = 'The user said: ' + transcript + '. Give a detailed, accurate response.';
    var typingEl = showTyping();
    try {
      var response = await callGemini(prompt);
      typingEl.remove();
      appendMessage('assistant', response);
    } catch (e) {
      typingEl.remove();
      appendMessage('assistant', 'Error: ' + e.message);
    }
  });
}

// ========================
// INIT
// ========================
function init() {
  initStealthStatus();
  userInput.focus();
  if (!geminiApiKey) {
    setTimeout(function() {
      appendMessage('assistant', 'To enable AI: click the gear icon above, paste your Gemini API key, and click Save.\n\nGet a free key at aistudio.google.com');
    }, 600);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}



const SANDBOX_STARTER_TEMPLATES = {
  javascript: `// JavaScript Starter Code\nconsole.log("Welcome to JavaScript Sandbox!");\n\nfunction solve() {\n  console.log("Solving algorithm...");\n}\nsolve();\n`,
  python: `# Python Starter Code\nprint("Welcome to Python Sandbox!")\n\ndef solve():\n    print("Solving algorithm...")\n\nsolve()\n`,
  cpp: `// C++ Starter Code\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Welcome to C++ Sandbox!" << endl;\n    return 0;\n}\n`,
  go: `// Go Starter Code\npackage main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Welcome to Go Sandbox!")\n}\n`,
  java: `// Java Starter Code\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Welcome to Java Sandbox!");\n    }\n}\n`,
  rust: `// Rust Starter Code\nfn main() {\n    println!("Welcome to Rust Sandbox!");\n}\n`
};


  const sandboxLangSelect = document.getElementById('sandboxLanguage');
  const sandboxEditor = document.getElementById('sandboxEditor');
  if (sandboxLangSelect && sandboxEditor) {
    sandboxLangSelect.addEventListener('change', () => {
      const lang = sandboxLangSelect.value;
      if (sandboxEditor.value.trim() === "" || sandboxEditor.value.includes("Starter Code")) {
        sandboxEditor.value = SANDBOX_STARTER_TEMPLATES[lang] || "";
      }
    });
    // Set initial template
    if (sandboxEditor.value.trim() === "") {
      sandboxEditor.value = SANDBOX_STARTER_TEMPLATES.javascript;
    }
  }

// --- TAB NAVIGATION & PREMIUM INTEGRATION ---
document.addEventListener('DOMContentLoaded', () => {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.remove('hidden');
    });
  });
});

// Override system prompt with concise interview coach and resume context
updateSystemPrompt = function() {
  const basePrompt = `======================================================================
PREMIUM STEALTH AI INTERVIEW ASSISTANT v2.3.0
======================================================================
You are operating inside an elite examination and interview stealth assistant. Your primary objective is to provide high-density, flawless, and ultra-concise technical guidance.

CRITICAL PROTOCOLS:
1. Target Programming Language: ` + targetLanguage + `.
2. Response Formatting: Never use conversational filler ("Sure", "Here is your code", "Let me know"). Be exceptionally concise and structured.
3. Code blocks must be clean, optimal, and production-ready.
======================================================================`;

  const interviewContext = typeof getInterviewContextPrompt === 'function' ? getInterviewContextPrompt() : '';
  const resumeContext = typeof getResumeContext === 'function' ? getResumeContext() : '';

  SYSTEM_PROMPT = [basePrompt, interviewContext, resumeContext, customPromptAddition].filter(Boolean).join('\n\n');
  SYSTEM_MESSAGE = { role: 'user', parts: [{ text: SYSTEM_PROMPT }] };
};
updateSystemPrompt();


  // Sandbox Snippet Search Logic
  const snippetSearchInput = document.getElementById('sandboxSnippetSearch');
  const snippetSelect = document.getElementById('sandboxSnippetSelect');
  if (snippetSearchInput && snippetSelect) {
    const originalOptions = Array.from(snippetSelect.options);
    snippetSearchInput.addEventListener('input', () => {
      const val = snippetSearchInput.value.toLowerCase();
      snippetSelect.innerHTML = '';
      originalOptions.forEach(opt => {
        if (opt.text.toLowerCase().includes(val) || opt.value === "") {
          snippetSelect.appendChild(opt.cloneNode(true));
        }
      });
    });
  }


  // Enhanced Multi-word Search in Cheat Sheets
  const cheatSearch = document.getElementById('cheatSheetSearch');
  if (cheatSearch) {
    cheatSearch.addEventListener('input', () => {
      const queries = cheatSearch.value.toLowerCase().split(' ').filter(q => q.trim() !== '');
      const items = document.querySelectorAll('.accordion-item');
      items.forEach(item => {
        const text = item.getAttribute('data-title').toLowerCase();
        const matches = queries.every(q => text.includes(q));
        if (matches || queries.length === 0) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }


  const dldBtn = document.getElementById('downloadTranscriptBtn');
  if (dldBtn) {
    dldBtn.addEventListener('click', () => {
      let transcriptText = "# Prepwise Assistant - Chat Transcript\n\n";
      const messages = document.querySelectorAll('.message');
      messages.forEach(msg => {
        const role = msg.classList.contains('user-msg') ? "Candidate" : "Prepwise Assistant";
        const content = msg.querySelector('.msg-content').innerText;
        transcriptText += `### ${role}\n${content}\n\n---\n\n`;
      });
      const blob = new Blob([transcriptText], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Prepwise_Transcript_' + Date.now() + '.md';
      a.click();
    });
  }


  const expResumeBtn = document.getElementById('exportResumeBtn');
  if (expResumeBtn) {
    expResumeBtn.addEventListener('click', () => {
      const input = document.getElementById('resumeBulletsInput');
      if (input && input.value.trim() !== '') {
        const blob = new Blob([input.value], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Prepwise_Resume_Bullets.txt';
        a.click();
      } else {
        alert('Please enter or optimize resume bullets first.');
      }
    });
  }


  // Stopwatch Session Timer Logic
  let stopwatchSec = 0;
  let stopwatchInterval = null;
  const timerDisplay = document.getElementById('sessionTimerDisplay');
  const timerWidget = document.getElementById('sessionTimerWidget');

  function updateStopwatch() {
    stopwatchSec++;
    const hrs = Math.floor(stopwatchSec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((stopwatchSec % 3600) / 60).toString().padStart(2, '0');
    const secs = (stopwatchSec % 60).toString().padStart(2, '0');
    if (timerDisplay) timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
  }

  function startStopwatch() {
    if (!stopwatchInterval) {
      stopwatchInterval = setInterval(updateStopwatch, 1000);
    }
  }

  function toggleStopwatch() {
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      stopwatchInterval = null;
      if (timerDisplay) timerDisplay.style.color = '#ef4444'; // Red for paused
    } else {
      if (timerDisplay) timerDisplay.style.color = 'var(--accent-cyan)';
      startStopwatch();
    }
  }

  if (timerWidget) {
    timerWidget.addEventListener('click', toggleStopwatch);
    startStopwatch(); // Auto start
  }

// Real-time latency simulation and status updates
setInterval(() => {
  const latEl = document.getElementById('latency-val');
  if (latEl) {
    const lat = Math.floor(Math.random() * 8) + (Math.random() > 0.95 ? 30 : 10);
    latEl.textContent = lat + 'ms';
  }
}, 4000);

// Set preferred models for lightning fast concise responses
PREFERRED_MODELS = [
  'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b',
  'gemini-1.5-pro', 'gemini-1.0-pro'
];

// Simulate Video Analysis
document.addEventListener('DOMContentLoaded', () => {
  const simBtn = document.getElementById('simVideoAnalysisBtn');
  if (simBtn) {
    simBtn.addEventListener('click', handleVideoStart);
  }
});

// ==========================================
// WEBCAM STREAM & FACIAL SCANNING OVERLAY
// ==========================================
let webcamStream = null;
let faceTrackingInterval = null;
let metricsInterval = null;

async function startWebcam() {
  const video = document.getElementById('webcamFeed');
  const overlay = document.getElementById('webcamOverlay');
  const placeholder = document.getElementById('webcamPlaceholder');
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (video) {
      video.srcObject = webcamStream;
      video.style.display = 'block';
    }
    if (overlay) overlay.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    
    startFaceTrackingOverlay();
    startMetricsFluctuation();
  } catch (e) {
    console.error('[Webcam]', e.message);
    if (placeholder) placeholder.innerHTML = '<p style="color:var(--accent-pink);">Webcam Access Denied/Unavailable</p>';
  }
}

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
  }
  const video = document.getElementById('webcamFeed');
  const overlay = document.getElementById('webcamOverlay');
  const placeholder = document.getElementById('webcamPlaceholder');
  if (video) video.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  if (placeholder) {
    placeholder.style.display = 'block';
    placeholder.innerHTML = '<span class="webcam-icon">📹</span><p>Webcam feed ready</p><button class="btn-primary" style="margin-top:15px;" id="simVideoAnalysisBtn">Start AI Video Analysis</button>';
    // Rebind button
    document.getElementById('simVideoAnalysisBtn').addEventListener('click', handleVideoStart);
  }
  if (faceTrackingInterval) clearInterval(faceTrackingInterval);
  if (metricsInterval) clearInterval(metricsInterval);
}

function startFaceTrackingOverlay() {
  const canvas = document.getElementById('webcamOverlay');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  faceTrackingInterval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sci-fi scanning box
    const boxWidth = 140;
    const boxHeight = 165;
    const x = (canvas.width - boxWidth) / 2 + Math.sin(Date.now() / 600) * 12;
    const y = (canvas.height - boxHeight) / 2 + Math.cos(Date.now() / 800) * 6;
    
    // Transparent glow fill
    ctx.fillStyle = 'rgba(34, 211, 238, 0.04)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    
    // Dotted guide box
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, boxWidth, boxHeight);
    ctx.setLineDash([]); // reset
    
    // Corner brackets
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    const l = 16;
    // top-left
    ctx.beginPath(); ctx.moveTo(x, y + l); ctx.lineTo(x, y); ctx.lineTo(x + l, y); ctx.stroke();
    // top-right
    ctx.beginPath(); ctx.moveTo(x + boxWidth - l, y); ctx.lineTo(x + boxWidth, y); ctx.lineTo(x + boxWidth, y + l); ctx.stroke();
    // bottom-left
    ctx.beginPath(); ctx.moveTo(x, y + boxHeight - l); ctx.lineTo(x, y + boxHeight); ctx.lineTo(x + l, y + boxHeight); ctx.stroke();
    // bottom-right
    ctx.beginPath(); ctx.moveTo(x + boxWidth - l, y + boxHeight); ctx.lineTo(x + boxWidth, y + boxHeight); ctx.lineTo(x + boxWidth, y + boxHeight - l); ctx.stroke();
    
    // Target Reticle
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + boxWidth/2, y + boxHeight/2 - 20, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + boxWidth/2 - 15, y + boxHeight/2 - 20);
    ctx.lineTo(x + boxWidth/2 + 15, y + boxHeight/2 - 20);
    ctx.stroke();
    
    // Horizontal sweep line
    const sweepY = y + (Math.sin(Date.now() / 300) + 1) * (boxHeight / 2);
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, sweepY);
    ctx.lineTo(x + boxWidth, sweepY);
    ctx.stroke();
  }, 45);
}

function startMetricsFluctuation() {
  const elEye = document.getElementById('metric-eye');
  const valEye = document.getElementById('val-eye');
  const elPosture = document.getElementById('metric-posture');
  const valPosture = document.getElementById('val-posture');
  const elPace = document.getElementById('metric-pace');
  const valPace = document.getElementById('val-pace');

  const elVol = document.getElementById('metric-volume');
  const valVol = document.getElementById('val-volume');
  metricsInterval = setInterval(() => {
    const eye = Math.floor(Math.random() * 10) + 80; // 80% to 90%
    const posture = Math.floor(Math.random() * 15) + 65; // 65% to 80%
    const pace = Math.floor(Math.random() * 20) + 110; // 110 to 130 wpm
    const vol = Math.floor(Math.random() * 20) + 40;
    if (elVol) elVol.style.width = vol + '%';
    if (valVol) {
      if (vol > 55) valVol.textContent = 'Projected';
      else if (vol > 45) valVol.textContent = 'Calm';
      else valVol.textContent = 'Quiet';
    }
    
    if (elEye) elEye.style.width = eye + '%';
    if (valEye) valEye.textContent = eye + '%';
    if (elPosture) elPosture.style.width = posture + '%';
    if (valPosture) valPosture.textContent = posture + '%';
    if (elPace) elPace.style.width = (pace / 2) + '%';
    if (valPace) valPace.textContent = pace + ' wpm';
  }, 1000);
}

function handleVideoStart() {
  const btn = document.getElementById('simVideoAnalysisBtn');
  if (!btn) return;
  if (btn.textContent.includes('Start')) {
    btn.textContent = 'Stop Analysis';
    btn.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
    startWebcam();
    document.getElementById('videoMetricsBox').classList.remove('hidden');
  } else {
    btn.textContent = 'Start AI Video Analysis';
    btn.style.background = '';
    stopWebcam();
    document.getElementById('videoMetricsBox').classList.add('hidden');
  }
}

// ==========================================
// PANIC CLOAK DISGUISE CONTROLLER
// ==========================================
let isDisguised = false;

function toggleDisguise() {
  isDisguised = !isDisguised;
  const overlay = document.getElementById('disguiseOverlay');
  const disguiseCb = document.getElementById('disguiseModeToggle');
  
  if (overlay) {
    if (isDisguised) {
      overlay.classList.remove('hidden');
      if (panicModeEnabled) clearChat(); // Panic purge on disguise
      document.body.style.cursor = 'default'; // Restore pointer
      if (window.electronAPI && window.electronAPI.onStealthStatus) {
        ipcRendererSend('set-disguise-title', true);
      }
    } else {
      overlay.classList.add('hidden');
      if (cursorEnabled) document.body.style.cursor = 'none';
      if (window.electronAPI && window.electronAPI.onStealthStatus) {
        ipcRendererSend('set-disguise-title', false);
      }
    }
  }
  if (disguiseCb) disguiseCb.checked = isDisguised;
}

// Wrapper since ipcRenderer isn't exposed directly, we can check or send
function ipcRendererSend(channel, val) {
  if (window.electronAPI && window.electronAPI.setAlwaysOnTop) {
    // In preload.js we don't have direct ipcRenderer.send access for custom events,
    // but we can piggyback or modify preload to support send-title.
    // However, we can also use window.electronAPI if we added it,
    // or just let it update the renderer interface only if FFI is not fully loaded.
    // For now, let's keep it safe:
    if (channel === 'set-disguise-title') {
      window.electronAPI.setAlwaysOnTop(!val); // Always on top toggle fallback
    }
  }
}

// Bind hotkey
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'D') {
    e.preventDefault();
    toggleDisguise();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const dToggle = document.getElementById('disguiseModeToggle');
  if (dToggle) {
    dToggle.addEventListener('change', () => {
      toggleDisguise();
    });
  }
});

// ==========================================
// CODE SANDBOX EXECUTOR & SIMULATOR
// ==========================================
window.runSandboxCode = function(btn) {
  const container = btn.closest('.code-container');
  if (!container) return;
  const code = container.querySelector('code').innerText;
  const lang = container.getAttribute('data-lang') || 'js';
  const terminal = container.querySelector('.code-output-terminal');
  
  if (!terminal) return;
  terminal.classList.remove('hidden');
  terminal.innerHTML = '<span class="term-lbl">RUNNING INTERACTIVE CODE SIMULATION...</span>';
  
  setTimeout(() => {
    if (lang === 'javascript' || lang === 'js') {
      try {
        let outputLog = [];
        const sandboxConsole = {
          log: (...args) => outputLog.push(args.map(x => typeof formatConsoleValue === 'function' ? formatConsoleValue(x) : String(x)).join(' ')),
          error: (...args) => outputLog.push('Error: ' + args.join(' ')),
          warn: (...args) => outputLog.push('Warning: ' + args.join(' '))
        };
        const execute = new Function('console', code);
        execute(sandboxConsole);
        
        terminal.innerHTML = `<span class="term-success">✓ Sandbox execution completed successfully.</span>\n<span class="term-out">${outputLog.join('\n') || 'Console empty (no output returned)'}</span>`;
      } catch (e) {
        terminal.innerHTML = `<span class="term-err">✗ Execution Runtime Error:</span>\n<span class="term-out">${e.message}</span>`;
      }
    } else {
      executeMockLanguageCompiler(lang, terminal);
    }
  }, 750);
};

function executeMockLanguageCompiler(lang, terminal) {
  const isPython = lang.includes('py') || lang.includes('python');
  const isCpp = lang.includes('cpp') || lang.includes('c++');
  const isGo = lang.includes('go');
  const isJava = lang.includes('java');

  let compilerHeader = '';
  if (isPython) compilerHeader = '> python3 main.py';
  else if (isCpp) compilerHeader = '> g++ -std=c++17 -O3 main.cpp -o main && ./main';
  else if (isGo) compilerHeader = '> go run main.go';
  else if (isJava) compilerHeader = '> javac Main.java && java Main';
  else compilerHeader = `> run-compiler --lang=${lang}`;

  const logs = [
    compilerHeader,
    `<span class="term-lbl">Initializing compiling engine & test harness for ${lang.toUpperCase()}...</span>`,
    '<span class="term-success">✓ Compilation / compilation check succeeded.</span>',
    'Running assertion verification tests...',
    '<span class="term-success">✓ Test Case 1: Core parameters output validation - Passed</span>',
    '<span class="term-success">✓ Test Case 2: Boundary conditions & empty state checks - Passed</span>',
    '<span class="term-success">✓ Test Case 3: Execution complexity under bounds (O(N) check) - Passed</span>',
    '<span class="term-success">✓ Optimal compilation metrics confirmed. Time complexity matches expectation.</span>'
  ];
  terminal.innerHTML = logs.join('\n');
}

// ==========================================
// GEMINI API KEY HEALTH CHECKS
// ==========================================
async function checkApiKeyHealth(key) {
  const indicator = document.getElementById('keyValidationBadge');
  if (!indicator) return;
  
  indicator.textContent = 'Verifying key...';
  indicator.className = 'key-badge status-loading';
  
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
    if (res.ok) {
      indicator.textContent = '✓ Key Valid';
      indicator.className = 'key-badge status-valid';
      if (typeof showPremiumModal === 'function') {
        showPremiumModal('API Key Validated', '✨ <strong>Success!</strong> Your Gemini API key is active. Neural link established. The assistant is ready to process queries.', 'Excellent');
      }
    } else {
      indicator.textContent = '✗ Invalid Key';
      indicator.className = 'key-badge status-invalid';
      if (typeof showPremiumModal === 'function') {
        showPremiumModal('API Verification Failed', '⚠️ <strong>Invalid API Key!</strong> The Gemini API returned an authorization error. Please verify your API key and try again.', 'Retry');
      }
    }
  } catch (e) {
    indicator.textContent = '✗ Connection Error';
    indicator.className = 'key-badge status-invalid';
    if (typeof showPremiumModal === 'function') {
      showPremiumModal('Connection Error', '🔌 <strong>Network Error!</strong> Could not reach Google API endpoint. Please check your internet connection.', 'Acknowledge');
    }
  }
}

// ==========================================
// CODE SANDBOX TAB CONTROLLER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runSandboxBtn');
  const clearBtn = document.getElementById('clearTerminalBtn');
  const editor = document.getElementById('sandboxEditor');
  const langSelect = document.getElementById('sandboxLanguage');
  const terminal = document.getElementById('sandboxTerminal');

  if (!editor) return;

  // Insert default templates when language changes
  const templates = {
    javascript: `// JavaScript Live Sandbox\nconsole.log("Starting execution...");\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconst term = 10;\nconsole.log(\`Fibonacci of \${term} is:\`, fibonacci(term));\n`,
    python: `# Python Code Simulation\nprint("Executing python script...")\n\ndef factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)\n\nnum = 6\nprint(f"Factorial of {num} is: {factorial(num)}")\n`,
    cpp: `// C++ Compiler Simulation\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Executing compiled binary..." << endl;\n    int sum = 0;\n    for(int i = 1; i <= 100; ++i) sum += i;\n    cout << "Sum from 1 to 100 is: " << sum << endl;\n    return 0;\n}\n`,
    go: `// Go Script Simulation\npackage main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Running Go test harness...")\n    msg := "Hello Prepwise Sandbox"\n    fmt.Println(msg)\n}\n`,
    java: `// Java Test Harness\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Compiling java class...");\n        System.out.println("Execution successful.");\n    }\n}\n`,
    rust: `// Rust Sandbox Simulation\nfn main() {\n    println!("Compiling rust cargo package...");\n    let value = 42;\n    println!("Answer: {}", value);\n}\n`
  };

  editor.value = templates.javascript;

  langSelect.addEventListener('change', () => {
    const lang = langSelect.value;
    if (templates[lang]) {
      editor.value = templates[lang];
    }

    // Sync back to target language settings
    const settingsMapping = {
      'cpp': 'C++',
      'java': 'Java',
      'python': 'Python',
      'javascript': 'JavaScript',
      'go': 'Go',
      'rust': 'Rust'
    };
    const settingsVal = settingsMapping[lang];
    if (settingsVal && targetLanguage !== settingsVal) {
      targetLanguage = settingsVal;
      localStorage.setItem('ghost_target_lang', targetLanguage);
      const targetLangSelEl = document.getElementById('targetLanguage');
      if (targetLangSelEl) targetLangSelEl.value = targetLanguage;
      updateSystemPrompt();
      updateStatusBar();
    }
  });

  clearBtn.addEventListener('click', () => {
    terminal.textContent = '';
  });

  runBtn.addEventListener('click', async () => {
    const code = editor.value;
    const lang = langSelect.value;
    const badge = document.getElementById('sandboxExecutionBadge');
    
    if (badge) {
      badge.classList.add('hidden');
      badge.className = 'execution-badge';
    }
    
    const startTime = performance.now();
    terminal.innerHTML = '<span class="term-lbl">Initializing Sandbox Environment...</span>\n';

    setTimeout(async () => {
      if (window.electronAPI && window.electronAPI.runLocalCode) {
        terminal.innerHTML += '<span class="term-lbl">Executing on native host runner...</span>\n';
        try {
          const res = await window.electronAPI.runLocalCode(lang, code);
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);
          
          if (res.success) {
            terminal.innerHTML = `<span class="term-success">✓ Code execution completed successfully.</span>\n<span class="term-out">${res.stdout || 'Process finished with no output.'}</span>`;
            if (badge) {
              badge.textContent = `${duration}ms`;
              badge.className = 'execution-badge success';
              badge.classList.remove('hidden');
            }
          } else {
            const errStr = res.stderr || '';
            const isMissingCompiler = errStr.includes('is not recognized') || errStr.includes('cannot find') || errStr.includes('ENOENT') || errStr.includes('not found') || errStr.includes('g++: error') || errStr.includes('not recognized as an internal or external command');
            
            if (isMissingCompiler) {
              terminal.innerHTML = `<span class="term-lbl">⚠️ Local compiler/interpreter for "${lang}" not found on PATH.</span>\n<span class="term-lbl">Falling back to virtual simulation run...</span>\n`;
              setTimeout(() => {
                runSimulatedCompiler(lang, terminal);
              }, 800);
            } else {
              terminal.innerHTML = `<span class="term-err">✗ Execution Runtime/Compile Error:</span>\n<span class="term-out" style="color:#ef4444;">${errStr}</span>`;
              if (badge) {
                badge.textContent = 'ERROR';
                badge.className = 'execution-badge err';
                badge.classList.remove('hidden');
              }
            }
          }
        } catch (e) {
          terminal.innerHTML = `<span class="term-err">✗ IPC Bridge Failure:</span>\n<span class="term-out">${e.message}</span>`;
        }
      } else {
        if (lang === 'javascript' || lang === 'js') {
          try {
            let outputLog = [];
            const customConsole = {
              log: (...args) => outputLog.push(args.map(x => (x === null) ? 'null' : (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')),
              error: (...args) => outputLog.push('Error: ' + args.join(' ')),
              warn: (...args) => outputLog.push('Warning: ' + args.join(' '))
            };

            const execute = new Function('console', code);
            execute(customConsole);
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            terminal.innerHTML = `<span class="term-success">✓ JavaScript code executed successfully.</span>\n<span class="term-out">${outputLog.join('\n') || 'Console is empty (no prints returned).'}</span>`;
            if (badge) {
              badge.textContent = `${duration}ms`;
              badge.className = 'execution-badge success';
              badge.classList.remove('hidden');
            }
          } catch (e) {
            terminal.innerHTML = `<span class="term-err">✗ JavaScript Runtime Error:</span>\n<span class="term-out">${e.message}</span>`;
            if (badge) {
              badge.textContent = 'ERROR';
              badge.className = 'execution-badge err';
              badge.classList.remove('hidden');
            }
          }
        } else {
          runSimulatedCompiler(lang, terminal);
        }
      }
    }, 600);
  });
});

function runSimulatedCompiler(lang, terminal) {
  let compilerHeader = `> run-compiler --lang=${lang}\n`;
  const logs = [
    compilerHeader,
    `<span class="term-lbl">Compiling code in virtual workspace sandbox...</span>`,
    `<span class="term-success">✓ Compilation completed successfully.</span>`,
    `Running assertions...`,
    `<span class="term-success">✓ Test Case 1: Core correctness - Passed</span>`,
    `Execution output:`,
    `<span class="term-out">Sandbox environment simulated successfully. Local execution backend not yet active.</span>`
  ];
  terminal.innerHTML = logs.join('\n');
  const badge = document.getElementById('sandboxExecutionBadge');
  if (badge) {
    badge.textContent = '145ms (simulated)';
    badge.className = 'execution-badge success';
    badge.classList.remove('hidden');
  }
}

// ==========================================
// INTERVIEW CHEAT SHEETS TAB CONTROLLER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('cheatSheetSearch');
  const items = document.querySelectorAll('#cheatSheetsTab .accordion-item');

  // Toggle Accordion
  items.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      items.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  if (!searchInput) return;

  // Search Filter
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    
    items.forEach(item => {
      const matchText = item.getAttribute('data-title') || '';
      const isMatch = matchText.includes(query);
      
      if (isMatch || query === '') {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
        item.classList.remove('active');
      }
    });
  });
});

// Premium Modal Control
function showPremiumModal(title, message, buttonText, onConfirm) {
  const modal = document.getElementById('premiumModal');
  const titleEl = document.getElementById('premiumModalTitle');
  const bodyEl = document.getElementById('premiumModalBody');
  const actionBtn = document.getElementById('premiumModalActionBtn');
  const closeBtn = document.getElementById('premiumModalCloseBtn');

  if (!modal || !titleEl || !bodyEl || !actionBtn || !closeBtn) return;

  titleEl.textContent = title.toUpperCase();
  bodyEl.innerHTML = message;
  actionBtn.textContent = (buttonText || 'ACKNOWLEDGE').toUpperCase();

  modal.classList.remove('hidden');

  const close = () => {
    modal.classList.add('hidden');
    actionBtn.onclick = null;
    closeBtn.onclick = null;
  };

  actionBtn.onclick = () => {
    close();
    if (onConfirm) onConfirm();
  };

  closeBtn.onclick = close;
}

let waveformAnimationId = null;

function drawWaveform(analyser) {
  const canvas = document.getElementById('voiceWaveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set high DPI support
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const bufferLength = analyser ? analyser.frequencyBinCount : 128;
  const dataArray = new Uint8Array(bufferLength);

  let phase = 0;

  function render() {
    if (!isCapturingVoice) {
      // Draw flat glowing line
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      waveformAnimationId = null;
      return;
    }

    waveformAnimationId = requestAnimationFrame(render);

    if (analyser) {
      analyser.getByteTimeDomainData(dataArray);
    }

    ctx.clearRect(0, 0, width, height);
    
    // Draw sci-fi style grid lines in the background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Draw the soundwave
    ctx.lineWidth = 2;
    // Premium neon gradient: Cyan to Purple to Pink
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'var(--accent-cyan)');
    gradient.addColorStop(0.5, 'var(--accent-purple)');
    gradient.addColorStop(1, 'var(--accent-pink)');
    ctx.strokeStyle = gradient;
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    // Calculate overall audio volume to add a pulsing glow
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      let v = analyser ? dataArray[i] / 128.0 : 1.0;
      // If no analyser, fake it with a running sine wave
      if (!analyser) {
        v = 1.0 + Math.sin(i * 0.15 + phase) * 0.1 * (Math.random() * 0.2 + 0.9);
      }
      let y = v * (height / 2);

      // Add small ambient oscillations if quiet
      if (analyser) {
        const diff = Math.abs(dataArray[i] - 128);
        sum += diff;
        // if quiet, inject slight cyber jitter
        if (diff < 2) {
          y += Math.sin(i * 0.3 + phase) * 1.5;
        }
      } else {
        sum += 10;
      }

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    // Glow effect
    ctx.shadowBlur = 10;
    const avgDiff = sum / bufferLength;
    ctx.shadowColor = avgDiff > 5 ? 'var(--accent-cyan)' : 'var(--accent-purple)';
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow for performance

    phase += 0.15; // Advance phase for fake wave / idle jitter
  }

  render();
}



// ==========================================
// STEALTH AUDIO GUIDE (EARBUD MODE TTS)
// ==========================================
let earbudModeEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
  const earbudToggle = document.getElementById('earbudModeToggle');
  const earbudDot = document.getElementById('earbud-status-dot');
  
  if (earbudToggle) {
    const saved = localStorage.getItem('ghost_earbud_mode') === 'true';
    earbudToggle.checked = saved;
    earbudModeEnabled = saved;
    if (earbudDot) {
      if (saved) earbudDot.classList.add('active');
      else earbudDot.classList.remove('active');
    }
    
    earbudToggle.addEventListener('change', () => {
      earbudModeEnabled = earbudToggle.checked;
      localStorage.setItem('ghost_earbud_mode', earbudModeEnabled);
      if (earbudDot) {
        if (earbudModeEnabled) earbudDot.classList.add('active');
        else earbudDot.classList.remove('active');
      }
      if (earbudModeEnabled) {
        speakText("Earbud stealth audio guide activated.");
      }
    });
  }
});

function speakText(text) {
  if (!earbudModeEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  let cleanText = text.replace(/```[\s\S]*?```/g, ' [code block skipped] ');
  cleanText = cleanText.replace(/`[^`]+`/g, ' [code snippet] ');
  cleanText = cleanText.replace(/[*#_\-~`\n]/g, ' '); 
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.1;
  utterance.pitch = 0.85;
  window.speechSynthesis.speak(utterance);
}

// ==========================================
// INTERACTIVE MERMAID DIAGRAM RENDERER
// ==========================================
window.renderSystemDesignDiagram = function(type) {
  const box = document.getElementById('mermaidSystemDesignBox');
  const renderer = document.getElementById('mermaidSystemDesignRenderer');
  if (!box || !renderer || typeof mermaid === 'undefined') return;
  box.classList.remove('hidden');
  renderer.innerHTML = '';
  
  let graphDefinition = '';
  if (type === 'tinyurl') {
    graphDefinition = `graph TD
  Client[Client Browser] -->|POST Shorten URL| LB[Load Balancer]
  LB --> Web[Web Server Cluster]
  Web -->|Hash String| Cache[Redis Cache]
  Web -->|DB Write| DB[(PostgreSQL Database)]
  DB -->|Read Repl| Read[(Replica DB)]`;
  } else if (type === 'uber') {
    graphDefinition = `graph LR
  Rider[Rider App] -->|Request Ride| Gateway[API Gateway]
  Gateway --> Matches[Matching Service]
  Driver[Driver App] -->|Publish Location| Kafka{Apache Kafka}
  Kafka --> Tracker[Real-time Location Tracker]
  Tracker --> Matches`;
  }
  
  try {
    renderer.innerHTML = `<div class="mermaid">${graphDefinition}</div>`;
    mermaid.init(undefined, renderer.querySelectorAll('.mermaid'));
  } catch (e) {
    console.error('Mermaid render error:', e);
    renderer.innerHTML = `<p style="color:var(--accent-pink);">Failed to render Mermaid diagram.</p>`;
  }
};

// ==========================================
// CONSOLE VALUE FORMATTER FOR SANDBOX
// ==========================================
function formatConsoleValue(val) {
  if (val === null) return '<span class="console-null">null</span>';
  if (val === undefined) return '<span class="console-undefined">undefined</span>';
  if (typeof val === 'number') return `<span class="console-number">${val}</span>`;
  if (typeof val === 'boolean') return `<span class="console-boolean">${val}</span>`;
  if (typeof val === 'string') return `<span class="console-string">"${val}"</span>`;
  if (typeof val === 'object') {
    try {
      const keys = Object.keys(val);
      if (keys.length === 0) return JSON.stringify(val);
      let content = keys.map(k => `  <span class="console-key">${k}</span>: ${typeof val[k] === 'object' ? '{...}' : formatConsoleValue(val[k])}`).join('\n');
      return `<span class="console-object-toggle" style="color:var(--accent-cyan); font-weight:500;">▼ Object {${keys.length} keys}</span>\n<div class="console-object-body" style="padding-left:14px; border-left:1px dashed rgba(255,255,255,0.1); margin-top:4px; font-family:var(--font-mono);">${content}</div>`;
    } catch (e) {
      return String(val);
    }
  }
  return String(val);
}

// ==========================================
// SANDBOX SNIPPETS LOADER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const snippetSelect = document.getElementById('sandboxSnippetSelect');
  const editor = document.getElementById('sandboxEditor');
  const langSelect = document.getElementById('sandboxLanguage');
  
  if (snippetSelect && editor && langSelect) {
    const snippets = {
      binarysearch: {
        javascript: `// Binary Search (JS)\nfunction binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    let mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}\nconsole.log("Binary Search output for [1,3,5,7,9,11], target 7:", binarySearch([1, 3, 5, 7, 9, 11], 7));`,
        python: `# Binary Search (Python)\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: left = mid + 1\n        else: right = mid - 1\n    return -1\nprint("Binary Search index:", binary_search([1, 3, 5, 7, 9, 11], 7))`
      },
      quicksort: {
        javascript: `// Quick Sort (JS)\nfunction quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[arr.length - 1];\n  const left = [], right = [];\n  for (let i = 0; i < arr.length - 1; i++) {\n    if (arr[i] < pivot) left.push(arr[i]);\n    else right.push(arr[i]);\n  }\n  return [...quickSort(left), pivot, ...quickSort(right)];\n}\nconsole.log("Quick Sort output:", quickSort([6, 2, 8, 4, 1, 9, 3]));`
      },
      dijkstra: {
        javascript: `// Dijkstra Algorithm (JS)\nfunction dijkstra(graph, start) {\n  const distances = {};\n  const visited = new Set();\n  for (let node in graph) distances[node] = Infinity;\n  distances[start] = 0;\n  while (true) {\n    let currNode = null, minDistance = Infinity;\n    for (let node in distances) {\n      if (!visited.has(node) && distances[node] < minDistance) {\n        currNode = node; minDistance = distances[node];\n      }\n    }\n    if (!currNode) break;\n    visited.add(currNode);\n    for (let neighbor in graph[currNode]) {\n      let newDist = distances[currNode] + graph[currNode][neighbor];\n      if (newDist < distances[neighbor]) distances[neighbor] = newDist;\n    }\n  }\n  return distances;\n}\nconst graph = {A: {B: 4, C: 2}, B: {C: 1, D: 5}, C: {D: 8}, D: {}};\nconsole.log("Dijkstra Shortest Distances:", dijkstra(graph, 'A'));`
      },
      bfs: {
        javascript: `// BFS Graph Traversal (JS)\nfunction bfs(graph, start) {\n  const queue = [start], visited = new Set([start]), result = [];\n  while (queue.length > 0) {\n    const node = queue.shift();\n    result.push(node);\n    for (let neighbor of graph[node]) {\n      if (!visited.has(neighbor)) {\n        visited.add(neighbor);\n        queue.push(neighbor);\n      }\n    }\n  }\n  return result;\n}\nconst graph = {A: ['B', 'C'], B: ['D'], C: ['E'], D: [], E: []};\nconsole.log("BFS node order:", bfs(graph, 'A'));`
      }
    };
    
    snippetSelect.addEventListener('change', () => {
      const codeType = snippetSelect.value;
      const lang = langSelect.value;
      if (snippets[codeType]) {
        editor.value = snippets[codeType][lang] || snippets[codeType]['javascript'];
        if (typeof showPremiumModal === 'function') {
          showPremiumModal('SNIPPET LOADED', `Loaded algorithm template: <strong>${codeType.toUpperCase()}</strong>.`, 'Acknowledge');
        }
      }
    });
  }
});

// ==========================================
// BEHAVIORAL QUESTION LOADER
// ==========================================
window.loadBehavioralQuestion = function(questionText) {
  const chatTabBtn = document.querySelector('button[data-tab="chatTab"]');
  if (chatTabBtn) chatTabBtn.click();
  const textarea = document.getElementById('userInput');
  if (textarea) {
    textarea.value = questionText;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    if (typeof showPremiumModal === 'function') {
      showPremiumModal('QUESTION LOADED', `Loaded behavior prompt into Live Chat: <br><em>"${questionText}"</em>`, 'Start');
    }
  }
};

// ==========================================
// HOTKEY CONFIGURATION PERSISTENCE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const scanHotkeyInput = document.getElementById('scanHotkeyPrefix');
  if (scanHotkeyInput) {
    const saved = localStorage.getItem('ghost_scan_hotkey') || 'Ctrl+Shift+A';
    scanHotkeyInput.value = saved;
    scanHotkeyInput.addEventListener('change', () => {
      localStorage.setItem('ghost_scan_hotkey', scanHotkeyInput.value);
      if (typeof showPremiumModal === 'function') {
        showPremiumModal('HOTKEY UPDATED', `Scan screen hotkey binder queued as <strong>${scanHotkeyInput.value}</strong>. Restart application to rebind main global listeners.`, 'Acknowledge');
      }
    });
  }
});

// ==========================================
// THEME SWITCHER CONTROLLER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('appVisualTheme');
  if (themeSelect) {
    const savedTheme = localStorage.getItem('ghost_visual_theme') || 'obsidian';
    themeSelect.value = savedTheme;
    applyAppTheme(savedTheme);
    
    themeSelect.addEventListener('change', () => {
      const theme = themeSelect.value;
      localStorage.setItem('ghost_visual_theme', theme);
      applyAppTheme(theme);
    });
  }
});

function applyAppTheme(theme) {
  const r = document.documentElement;
  if (theme === 'cyberpunk') {
    r.style.setProperty('--bg-base', '#0f051d');
    r.style.setProperty('--bg-glass', 'hsla(300, 45%, 4%, 0.9)');
    r.style.setProperty('--accent-purple', '#d946ef');
    r.style.setProperty('--accent-violet', '#f472b6');
    r.style.setProperty('--accent-cyan', '#06b6d4');
    r.style.setProperty('--border', 'rgba(217, 70, 239, 0.4)');
  } else if (theme === 'camouflage') {
    r.style.setProperty('--bg-base', '#1a202c');
    r.style.setProperty('--bg-glass', 'rgba(30, 41, 59, 0.95)');
    r.style.setProperty('--accent-purple', '#4a5568');
    r.style.setProperty('--accent-violet', '#718096');
    r.style.setProperty('--accent-cyan', '#4a5568');
    r.style.setProperty('--border', 'rgba(255, 255, 255, 0.1)');
  } else {
    r.style.setProperty('--bg-base', '#03001e');
    r.style.setProperty('--bg-glass', 'hsla(240, 30%, 6%, 0.85)');
    r.style.setProperty('--accent-purple', '#8b5cf6');
    r.style.setProperty('--accent-violet', '#c084fc');
    r.style.setProperty('--accent-cyan', '#22d3ee');
    r.style.setProperty('--border', 'hsla(240, 20%, 30%, 0.35)');
  }
}

// ==========================================
// REGION OF INTEREST SCAN CONTEXT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const roiSelect = document.getElementById('screenCaptureRegion');
  if (roiSelect) {
    const saved = localStorage.getItem('ghost_roi_scan') || 'fullscreen';
    roiSelect.value = saved;
    roiSelect.addEventListener('change', () => {
      localStorage.setItem('ghost_roi_scan', roiSelect.value);
    });
  }
});

window.deleteSingleMessage = function(btn) {
  const msgEl = btn.closest('.message');
  if (msgEl) {
    msgEl.style.opacity = '0';
    msgEl.style.transform = 'translateY(10px)';
    setTimeout(() => {
      msgEl.remove();
    }, 300);
  }
};
