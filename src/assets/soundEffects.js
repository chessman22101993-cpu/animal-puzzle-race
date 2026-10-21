// Web Audio API synthesizer for zero-latency, offline chess & race sound effects

let audioCtx = null;
let isMuted = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    stopTensionMusic();
  }
  return isMuted;
}

export function getMuted() {
  return isMuted;
}

export function playMoveSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

export function playCaptureSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

export function playCorrectSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Ascending joyous chime: C5 -> E5 -> G5 -> C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.07;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.18);
  });
}

export function playWrongSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Gentle buzz
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(160, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

export function playCountdownTick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.09);
}

export function playGoSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1046.5, ctx.currentTime);

  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.45);
}

export function playPodiumFanfare() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Fanfare: G4 -> C5 -> E5 -> G5 (held)
  const notes = [
    { freq: 392.00, start: 0, dur: 0.15 },
    { freq: 523.25, start: 0.16, dur: 0.15 },
    { freq: 659.25, start: 0.32, dur: 0.2 },
    { freq: 783.99, start: 0.54, dur: 0.6 }
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const s = ctx.currentTime + start;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, s);

    gain.gain.setValueAtTime(0.22, s);
    gain.gain.exponentialRampToValueAtTime(0.001, s + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(s);
    osc.stop(s + dur);
  });
}

// ============================================================================
// DYNAMIC 30-SECOND COUNTDOWN TENSION MUSIC & TICKING
// Synthesizes an escalating heartbeat pulse, high mechanical tick, and synth
// drive that dynamically speeds up across 3 tension tiers (30s -> 20s -> 10s)
// ============================================================================
let tensionTimer = null;
let currentRemaining = 0;
let isTensionPlaying = false;

function playTensionBeat(level) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Level 1 (30s - 20s): Deep steady heartbeat thump + clean clock tick
  // Level 2 (20s - 10s): Faster double-thump + tension tick + rising bass pulse
  // Level 3 (10s - 0s):  Rapid adrenaline thump + urgent high tick + tension saw accent

  // 1. Primary Low Kick / Heartbeat ("lub")
  try {
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    const startFreq = level === 3 ? 125 : level === 2 ? 105 : 90;
    osc1.frequency.setValueAtTime(startFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(36, now + 0.11);

    const vol = level === 3 ? 0.32 : level === 2 ? 0.25 : 0.18;
    gain1.gain.setValueAtTime(vol, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.11);

    // 2. Second Heartbeat Pulse ("dub") - 90ms later
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    const t2 = now + 0.09;
    osc2.frequency.setValueAtTime(startFreq * 1.15, t2);
    osc2.frequency.exponentialRampToValueAtTime(42, t2 + 0.12);

    gain2.gain.setValueAtTime(vol * 0.8, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.12);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.12);

    // 3. Crisp Mechanical Clock Tick
    const tickOsc = ctx.createOscillator();
    const tickGain = ctx.createGain();
    tickOsc.type = 'triangle';
    const tickFreq = level === 3 ? 1800 : level === 2 ? 1400 : 1050;
    tickOsc.frequency.setValueAtTime(tickFreq, now);
    tickOsc.frequency.exponentialRampToValueAtTime(350, now + 0.035);

    tickGain.gain.setValueAtTime(level === 3 ? 0.18 : 0.1, now);
    tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    tickOsc.connect(tickGain);
    tickGain.connect(ctx.destination);
    tickOsc.start(now);
    tickOsc.stop(now + 0.035);

    // 4. Harmonic Tension Accent for levels 2 & 3
    if (level >= 2) {
      const chordOsc = ctx.createOscillator();
      const chordGain = ctx.createGain();
      chordOsc.type = 'sawtooth';
      const note = level === 3 ? 220 : 164.81; // A3 or E3
      chordOsc.frequency.setValueAtTime(note, now);
      chordOsc.frequency.exponentialRampToValueAtTime(note * 1.05, now + 0.15);

      chordGain.gain.setValueAtTime(level === 3 ? 0.08 : 0.045, now);
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      chordOsc.connect(chordGain);
      chordGain.connect(ctx.destination);
      chordOsc.start(now);
      chordOsc.stop(now + 0.15);
    }
  } catch (err) {
    // Ignore audio interruption on sudden unmount
  }
}

function scheduleNextBeat() {
  if (!isTensionPlaying) return;

  if (currentRemaining <= 0 || currentRemaining > 30) {
    stopTensionMusic();
    return;
  }

  // Calculate dynamic delay & intensity based on remaining seconds
  let delayMs = 850; // ~70 BPM (30s - 20s)
  let level = 1;

  if (currentRemaining <= 10) {
    delayMs = 380; // ~158 BPM (10s - 0s) - frantic final sprint
    level = 3;
  } else if (currentRemaining <= 20) {
    delayMs = 580; // ~103 BPM (20s - 10s) - building pace
    level = 2;
  }

  playTensionBeat(level);

  tensionTimer = setTimeout(() => {
    scheduleNextBeat();
  }, delayMs);
}

export function updateTensionMusic(timeLeft, isRacing) {
  if (!isRacing || timeLeft <= 0 || timeLeft > 30) {
    stopTensionMusic();
    return;
  }

  currentRemaining = timeLeft;

  if (!isTensionPlaying) {
    isTensionPlaying = true;
    scheduleNextBeat();
  }
}

export function stopTensionMusic() {
  isTensionPlaying = false;
  if (tensionTimer) {
    clearTimeout(tensionTimer);
    tensionTimer = null;
  }
}
