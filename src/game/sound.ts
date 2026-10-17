/**
 * Web Audio API Procedural Sound Engine for Word Breach
 * Organic wooden marimba/kalimba plucks, gentle chords, and tactile audio juice.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazily initialized on first user interaction
    const saved = localStorage.getItem('wb_sound_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('wb_sound_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Marimba/kalimba pluck on tile select.
   * Pitch climbs pentatonically with each letter selected.
   */
  public playTileSelect(pathLength: number): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    // Pentatonic scale (C4 to C6)
    const frequencies = [
      261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
      523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
      1046.50, 1174.66, 1318.51               // C6, D6, E6
    ];

    const freqIndex = Math.min(Math.max(0, pathLength - 1), frequencies.length - 1);
    const freq = frequencies[freqIndex];

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Warm rounded triangle/sine hybrid for wooden marimba feel
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Filter to warm up tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Cozy chord arpeggio when a valid word is completed.
   */
  public playWordValid(length: number, combo: number): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const baseFrequencies = [
      [523.25, 659.25, 783.99, 1046.50], // C Major
      [587.33, 739.99, 880.00, 1174.66], // D Major
      [659.25, 830.61, 987.77, 1318.51], // E Major
    ];

    const chordSet = baseFrequencies[Math.min(combo - 1, baseFrequencies.length - 1)] || baseFrequencies[0];
    const now = ctx.currentTime;

    chordSet.forEach((freq, idx) => {
      const startTime = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });

    // If high combo, add a high shimmer note
    if (combo >= 3) {
      const shimmerTime = now + 0.22;
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(1567.98, shimmerTime); // G6

      shimmerGain.gain.setValueAtTime(0.12, shimmerTime);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, shimmerTime + 0.45);

      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);

      shimmer.start(shimmerTime);
      shimmer.stop(shimmerTime + 0.45);
    }
  }

  /**
   * Soft wooden clack when word is invalid or rejected.
   */
  public playInvalid(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Double hollow thud
    [0, 0.08].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now + offset);
      osc.frequency.exponentialRampToValueAtTime(60, now + offset + 0.06);

      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  }

  /**
   * Cascade droplet / wooden tap sound as tiles drop down.
   */
  public playCascade(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 523.25, 659.25];

    notes.forEach((freq, idx) => {
      const delay = idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.08, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    });
  }

  /**
   * Soft card/tile shuffle rustle.
   */
  public playShuffle(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + i * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 400, startTime);

      gain.gain.setValueAtTime(0.06, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.09);
    }
  }

  /**
   * High combo celebratory sound (Combo x5).
   */
  public playComboMax(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

    fanfareNotes.forEach((freq, i) => {
      const startTime = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.42);
    });
  }

  /**
   * Warm ascending chime for phase transition / Level Up.
   */
  public playPhaseTransition(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Ascending major chord (C4, G4, C5, E5, G5, C6)
    const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, i) => {
      const startTime = now + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.52);
    });
  }
}

export const SOUND = new SoundEngine();

