/**
 * Audio synthesis for shopkeeper payment notifications
 * Similar to Paytm / PhonePe Soundbox
 */

// Dual tone chime using Web Audio API
export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Second tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio context errors if browser blocks autoplay
  }
}

// Speak message using Web Speech API (Hindi or English)
export function announcePayment(amount: number, language: 'hi' | 'en' = 'hi') {
  playChime();

  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const roundedAmount = Math.round(amount);
    let message = '';

    if (language === 'hi') {
      message = `दुकान साथी पर ${roundedAmount} रुपये प्राप्त हुए`;
    } else {
      message = `Payment of ${roundedAmount} rupees received on Dukaan Saathi`;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick Hindi or Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    if (language === 'hi') {
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const enInVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en'));
      if (enInVoice) utterance.voice = enInVoice;
      utterance.lang = 'en-IN';
    }

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 280);
  } catch {
    // Non-blocking fallback
  }
}
