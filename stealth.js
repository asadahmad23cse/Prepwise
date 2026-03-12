/**
 * stealth.js — Native Win32 API bridge via koffi
 * koffi uses prebuilt binaries — no compilation needed!
 * Applies WS_EX_TOOLWINDOW to hide window from Alt+Tab and taskbar
 */

let koffi, user32;
let GetWindowLongA, SetWindowLongA, SetWindowPos, SetWindowDisplayAffinity;

const GWL_EXSTYLE          = -20;
const WS_EX_TOOLWINDOW     = 0x00000080;
const WS_EX_APPWINDOW      = 0x00040000;
const WS_EX_NOACTIVATE     = 0x08000000;
const SWP_NOMOVE           = 0x0002;
const SWP_NOSIZE           = 0x0001;
const SWP_NOZORDER         = 0x0004;
const SWP_FRAMECHANGED     = 0x0020;
const WDA_EXCLUDEFROMCAPTURE = 0x00000011;

function loadNativeModules() {
  try {
    koffi = require('koffi');

    user32 = koffi.load('user32.dll');

    GetWindowLongA = user32.func('int __stdcall GetWindowLongA(void* hWnd, int nIndex)');
    SetWindowLongA = user32.func('int __stdcall SetWindowLongA(void* hWnd, int nIndex, int dwNewLong)');
    SetWindowPos   = user32.func('bool __stdcall SetWindowPos(void* hWnd, void* hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags)');
    SetWindowDisplayAffinity = user32.func('bool __stdcall SetWindowDisplayAffinity(void* hWnd, uint dwAffinity)');

    console.log('[Stealth] koffi loaded successfully — native Win32 APIs available');
    return true;
  } catch (e) {
    console.warn('[Stealth] koffi not available, using Electron fallbacks only:', e.message);
    return false;
  }
}

function hwndFromBuffer(buf) {
  // Electron returns HWND as a Buffer — convert to BigInt pointer for koffi
  try {
    if (process.arch === 'x64') {
      return buf.readBigUInt64LE(0);
    }
    return buf.readUInt32LE(0);
  } catch {
    return null;
  }
}

function applyWindowStealth(hwndBuf) {
  if (!user32 || !hwndBuf) return false;

  try {
    const hwnd = hwndFromBuffer(hwndBuf);
    if (!hwnd) return false;

    // Get current extended style
    let exStyle = GetWindowLongA(hwnd, GWL_EXSTYLE);

    // Add TOOLWINDOW (hides from Alt+Tab), remove APPWINDOW
    exStyle = (exStyle | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE) & ~WS_EX_APPWINDOW;

    SetWindowLongA(hwnd, GWL_EXSTYLE, exStyle);

    // Force frame refresh
    SetWindowPos(hwnd, null, 0, 0, 0, 0,
      SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);

    console.log('[Stealth] Alt+Tab hiding applied via Win32 (koffi)');
    return true;
  } catch (e) {
    console.error('[Stealth] Failed to apply window style:', e.message);
    return false;
  }
}

function applyScreenCaptureProtection(hwndBuf) {
  if (!user32 || !hwndBuf) return false;
  try {
    const hwnd = hwndFromBuffer(hwndBuf);
    if (!hwnd) return false;
    const result = SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
    console.log('[Stealth] Screen capture protection (WDA_EXCLUDEFROMCAPTURE) applied:', result);
    return result;
  } catch (e) {
    console.error('[Stealth] Failed to apply screen capture protection:', e.message);
    return false;
  }
}

module.exports = {
  loadNativeModules,
  applyWindowStealth,
  applyScreenCaptureProtection,
};
