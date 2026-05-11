# Prepwise: Premium Stealth Interview Assistant

Prepwise is a sophisticated, undetectable AI assistant designed to provide real-time guidance during technical interviews. It operates in "Ghost Mode," utilizing advanced Windows API techniques to remain invisible to screen recording and monitoring software.

## ✨ Key Features

- **🛡️ Advanced Stealth**: 
  - Invisible to Screen Share (WDA_EXCLUDEFROMCAPTURE).
  - Hidden from Taskbar and Alt+Tab via Native Win32 API.
  - Process masquerading in Task Manager (`System Settings Host`).
- **📸 Intelligent Screen Scanning**: High-resolution OCR and visual analysis of coding problems via Google Gemini 1.5/2.0.
- **🎙️ System Audio Capture**: Intercepts meeting audio (Zoom, Teams, Google Meet) and transcribes interviewers' questions in real-time.
- **💻 Premium UI/UX**: 
  - Glassmorphism design with "Deep Space" HSL-tailored theme.
  - Custom software-rendered cursor (invisible to recorders).
  - "Panic Key" (Ctrl+Shift+H) for instant concealment.
- **⚙️ Expert Coding Solutions**:
  - Compilable, optimal code solutions with time/space complexity.
  - Syntax highlighting (Prism.js).
  - Supports C++, Java, Python, JavaScript, Go, and Rust.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Launch Prepwise**:
   ```bash
   npm start
   ```
3. **Configure API**:
   - Open the settings (gear icon).
   - Paste your **Gemini API Key** (get one at [aistudio.google.com](https://aistudio.google.com)).
   - Select your target programming language.

## ⌨️ Global Hotkeys

- `Ctrl+Shift+H`: **Toggle Visibility** (Panic Hide)
- `Ctrl+Shift+A`: **Scan Screen** (OCR Analysis)
- `Ctrl+Shift+.`: **Click-Through Mode** (Interact with windows behind Prepwise)
- `Ctrl+Shift+Q`: **Panic Quit** (Instantly kill and clear memory)
- `Ctrl+Shift+Arrows`: **Nudge Window Position**

## 💡 Pro Tips

- **Panic Mode**: Enabling Panic Mode in settings will automatically clear your chat history every time the window is hidden.
- **Click-Through**: Use Click-Through mode when you need to type in your IDE while keeping the assistant visible on top.
- **Cursor Guard**: The custom cursor ensures your real mouse movements aren't tracked by screen recording software.

## ⚠️ Legal Disclaimer

This tool is for educational and research purposes only. Use of this tool in a professional or academic environment may violate terms of service or ethics policies. Use at your own risk.
