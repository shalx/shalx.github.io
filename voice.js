"use strict";
/* Fix-Pin optional spoken confirmations. No microphone or cloud API. */
const FixPinVoice = (() => {
    const KEY = "fixpin.voice.enabled";
    const supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    let enabled = false;
    try { enabled = localStorage.getItem(KEY) === "true"; } catch (_) {}

    function speak(message) {
        if (!supported || !enabled) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = "en-US";
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.warn("Fix-Pin voice unavailable:", error);
        }
    }

    function init() {
        const menu = document.getElementById("appMenu");
        const about = document.getElementById("aboutBtn");
        if (!menu || !about || document.getElementById("voiceToggleBtn")) return;
        const button = document.createElement("button");
        button.id = "voiceToggleBtn";
        button.type = "button";
        button.className = "menu-item";
        const icon = document.createElement("i");
        icon.className = "ph ph-speaker-high";
        icon.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.textContent = "Voice";
        const state = document.createElement("span");
        state.className = "theme-toggle-state";
        function update() {
            state.textContent = enabled && supported ? "ON" : "OFF";
            button.setAttribute("aria-pressed", String(enabled && supported));
            button.title = supported ? "Toggle voice confirmations" : "Voice not supported in this browser";
        }
        button.append(icon, label, state);
        button.disabled = !supported;
        button.addEventListener("click", () => {
            enabled = !enabled;
            try { localStorage.setItem(KEY, String(enabled)); } catch (_) {}
            update();
            if (enabled) speak("Voice enabled");
            else if (supported) window.speechSynthesis.cancel();
        });
        menu.insertBefore(button, about);
        update();
    }
    document.addEventListener("DOMContentLoaded", init);
    return { speak };
})();

