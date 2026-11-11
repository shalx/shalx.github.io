/* Fix-Pin appearance switch: independent of app logic. */
(function () {
  'use strict';
  const key = 'fixpin-appearance';
  const sheet = document.getElementById('appThemeStylesheet');
  const btn = document.getElementById('themeToggleBtn');
  const text = document.getElementById('themeToggleText');
  const state = document.getElementById('themeToggleState');
  const icon = document.getElementById('themeToggleIcon');
  if (!sheet || !btn) return;
  function apply(mode) {
    const night = mode !== 'day';
    sheet.href = night ? 'style.css' : 'style-light.css';
    document.documentElement.style.colorScheme = night ? 'dark' : 'light';
    btn.setAttribute('aria-pressed', String(night));
    text.textContent = night ? 'Switch to Day mode' : 'Switch to Night mode';
    state.textContent = night ? 'NIGHT' : 'DAY';
    icon.className = night ? 'ph ph-moon' : 'ph ph-sun';
  }
  let mode = 'night';
  try { if (localStorage.getItem(key) === 'day') mode = 'day'; } catch (_) {}
  apply(mode);
  btn.addEventListener('click', function () {
    mode = mode === 'night' ? 'day' : 'night';
    apply(mode);
    try { localStorage.setItem(key, mode); } catch (_) {}
  });
})();

