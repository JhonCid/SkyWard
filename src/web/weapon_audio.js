function playWeaponSound(id) {
  if (!audioContext) return;
  const t = audioContext.currentTime;

  function createAcousticNoise(duration, filterStart, filterEnd, gain, filterType = 'bandpass', qVal = 1.0) {
    try {
      const len = Math.floor(audioContext.sampleRate * duration);
      const noiseBuf = audioContext.createBuffer(1, len, audioContext.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioContext.sampleRate * (duration * 0.35)));
      }
      const noise = audioContext.createBufferSource();
      noise.buffer = noiseBuf;
      const filter = audioContext.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterStart, t);
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, filterEnd), t + duration);
      filter.Q.setValueAtTime(qVal, t);
      const nGain = audioContext.createGain();
      nGain.gain.setValueAtTime(gain, t);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      noise.connect(filter).connect(nGain).connect(fxBus);
      noise.start(t);
    } catch {}
  }

  function createConcussiveThump(startFreq, endFreq, duration, gain) {
    try {
      const osc = audioContext.createOscillator();
      const g = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(g).connect(fxBus);
      osc.start(t); osc.stop(t + duration + 0.01);
    } catch {}
  }

  if (id === 'pistol') {
    // Sharp supersonic 9mm report: crisp acoustic muzzle crack + deep concussive pressure wave
    createAcousticNoise(0.08, 3800, 950, 0.95, 'bandpass', 1.6);
    createAcousticNoise(0.04, 2200, 450, 0.70, 'lowpass', 0.8);
    createConcussiveThump(120, 32, 0.07, 0.65);
    // Micro metallic mechanical click (short highpass noise burst, NOT a musical beep!)
    createAcousticNoise(0.012, 4500, 3200, 0.18, 'highpass', 1.0);

  } else if (id === 'rifle') {
    // High-energy combat rifle report: explosive chamber expansion + supersonic crack
    createAcousticNoise(0.16, 4600, 650, 1.0, 'bandpass', 1.4);
    createAcousticNoise(0.08, 1800, 220, 0.85, 'lowpass', 0.9);
    createConcussiveThump(145, 26, 0.12, 0.80);
    // Mechanical bolt action friction (noise transient)
    createAcousticNoise(0.018, 3800, 2600, 0.22, 'bandpass', 1.2);

  } else if (id === 'shotgun') {
    // Massive 12-gauge close-quarters blast: wideband muzzle detonation + deep sub-bass shockwave
    createAcousticNoise(0.28, 3200, 180, 1.0, 'lowpass', 0.8);
    createAcousticNoise(0.10, 4200, 700, 0.85, 'bandpass', 1.2);
    createConcussiveThump(95, 18, 0.22, 0.95);
    // Mechanical pump action clicks (noise transients, zero beeps!)
    setTimeout(() => {
      createAcousticNoise(0.022, 2800, 1600, 0.25, 'bandpass', 1.2);
    }, 240);

  } else if (id === 'unarmed') {
    // Heavy blunt kinetic impact + air displacement whoosh for punch:
    createAcousticNoise(0.08, 1600, 280, 0.40, 'bandpass', 1.1);
    createConcussiveThump(110, 36, 0.09, 0.65);
  } else if (id === 'blade') {
    // Tactical steel swish / high-frequency air displacement
    createAcousticNoise(0.08, 2400, 800, 0.35, 'bandpass', 1.2);

  } else if (id === 'sabre') {
    // Plasma ignition and energetic hum
    createAcousticNoise(0.14, 1800, 400, 0.40, 'bandpass', 1.8);
    createConcussiveThump(90, 45, 0.14, 0.45);

  } else if (id === 'tool') {
    // High-tech sci-fi scanner / laser thermal mining beam: smooth non-ballistic resonance hum
    createAcousticNoise(0.14, 1600, 700, 0.30, 'bandpass', 1.4);
    try {
      const osc = audioContext.createOscillator();
      const g = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.14);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(g).connect(fxBus);
      osc.start(t); osc.stop(t + 0.16);
    } catch {}

  } else {
    createConcussiveThump(90, 40, 0.08, 0.35);
  }
}
window.playWeaponSound = playWeaponSound;

