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
          console.log('[Gemini] Models available:', models);
          return { models: models, version: tries[i] };
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

var SYSTEM_ACK = { role: 'model', parts: [{ text: 'Understood. I will follow all rules precisely. Ready to assist.' }] };
var conversationHistory = [];

async function callGemini(userMessage) {
  if (!geminiApiKey) return 'Please add your Gemini API key in Settings (gear icon).';
  if (detectedModel) return await callWithRetry(userMessage, detectedModel);

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

          setApiStatus('Rate limited — waiting 15s...', '');
          await sleep(15000);
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
        break; // If 404/not-found, skip both versions for this model

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
  appendMessage('assistant', 'System cleared. Standing by.');
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
    appendMessage('assistant', 'Target language set to **' + targetLanguage + '**. Responses will now be in ' + targetLanguage + '.');
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
  detectedModel = null;
  conversationHistory = [];
  geminiApiKey = key;
  localStorage.setItem('ghost_gemini_key', key);
  setApiStatus('Key saved (ends ....' + key.slice(-4) + ') — send a message!', 'ok');
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
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
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
      const html = originalCode(code, language, escaped);
      return `<div class="code-container">
                <button class="copy-code-btn" onclick="copyToClipboard(this)">Copy</button>
                ${html}
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
  content.innerHTML = contentHtml;
  
  // Trigger Prism highlighting
  if (typeof Prism !== 'undefined') {
    Prism.highlightAllUnder(content);
  }
  msg.appendChild(avatar); msg.appendChild(content);
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  var el = document.createElement('div');
  el.className = 'message assistant-msg typing-indicator';
  el.innerHTML = '<div class="msg-avatar">G</div><div class="msg-content"><div class="dots"><span></span><span></span><span></span></div></div>';
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
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
    voiceLiveText.textContent = 'Connecting to system audio...';

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

    var videoTracks = voiceStream.getVideoTracks();
    videoTracks.forEach(function(t) { t.stop(); });

    var audioTracks = voiceStream.getAudioTracks();
    if (audioTracks.length === 0) {
      setVoiceStatus('Error');
      voiceLiveText.textContent = 'No system audio detected. Check that audio is playing.';
      voiceStream = null;
      return;
    }

    voiceAudioContext = new AudioContext();
    var audioOnlyStream = new MediaStream(audioTracks);
    var source = voiceAudioContext.createMediaStreamSource(audioOnlyStream);
    var dest = voiceAudioContext.createMediaStreamDestination();
    source.connect(dest);

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
      voiceLiveText.textContent = interimText || (voiceTranscript ? 'Listening...' : 'Listening to system audio...');
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
