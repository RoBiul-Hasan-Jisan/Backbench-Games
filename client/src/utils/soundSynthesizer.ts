export type SoundCategory = 'ui' | 'game' | 'ambient';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private masterVolumeNode: GainNode | null = null;
  private volumes: Record<SoundCategory, number> = {
    ui: 0.8,
    game: 0.8,
    ambient: 0.5,
  };
  private categoryNodes: Record<SoundCategory, GainNode | null> = {
    ui: null,
    game: null,
    ambient: null,
  };
  private isMuted: boolean = false;
  private crowdCheerNode: AudioScheduledSourceNode | null = null;
  private crowdCheerGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  /**
   * Initializes the AudioContext after user interaction
   */
  public init() {
    if (this.ctx) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      
      // Setup gain nodes for mixing
      this.masterVolumeNode = this.ctx.createGain();
      this.masterVolumeNode.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterVolumeNode.connect(this.ctx.destination);

      // Category nodes
      (Object.keys(this.volumes) as SoundCategory[]).forEach((cat) => {
        if (!this.ctx || !this.masterVolumeNode) return;
        const node = this.ctx.createGain();
        node.gain.setValueAtTime(this.volumes[cat], this.ctx.currentTime);
        node.connect(this.masterVolumeNode);
        this.categoryNodes[cat] = node;
      });

      console.log('[SoundSynthesizer] AudioContext initialized successfully.');
    } catch (err) {
      console.warn('[SoundSynthesizer] Failed to initialize AudioContext:', err);
    }
  }

  /**
   * Resumes the context if suspended
   */
  private resumeContext(): boolean {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  /**
   * Toggles master mute
   */
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterVolumeNode && this.ctx) {
      this.masterVolumeNode.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  /**
   * Changes volume for a specific category
   */
  public setVolume(category: SoundCategory, value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    this.volumes[category] = clamped;
    const node = this.categoryNodes[category];
    if (node && this.ctx) {
      node.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public getVolume(category: SoundCategory): number {
    return this.volumes[category];
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * UI Click: Short high frequency pop
   */
  public playClick() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.ui) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.categoryNodes.ui);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  /**
   * Countdown Tick: Snappy woodblock pop
   */
  public playTick() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.game) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.categoryNodes.game);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  /**
   * Coin Toss: Synthesizer sweep upward
   */
  public playToss() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.game) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.categoryNodes.game);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  /**
   * Toss Land Chime: Sparkling chime
   */
  public playTossLand() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.game) return;

    const now = this.ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      if (!this.ctx || !this.categoryNodes.game) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.categoryNodes.game);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.05);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + index * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.3);

      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.35);
    });
  }

  /**
   * Hand Reveal: Light synth pop chord
   */
  public playReveal() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.game) return;

    const now = this.ctx.currentTime;
    const chords = [329.63, 392.00, 523.25, 659.25]; // E4, G4, C5, E5 (C Major)

    chords.forEach((freq) => {
      if (!this.ctx || !this.categoryNodes.game) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.categoryNodes.game);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  /**
   * Batter OUT: Harsh filtered low frequency buzzer
   */
  public playOut() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.game) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.categoryNodes.game);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  /**
   * Victory: Triumphant arpeggios
   */
  public playVictory() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.game) return;

    const now = this.ctx.currentTime;
    // C Major Arpeggio: C4, E4, G4, C5, E5, G5, C6
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const duration = 0.12;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.categoryNodes.game) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.categoryNodes.game);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * duration);

      // Play note
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * duration + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * duration + duration + 0.15);

      osc.start(now + idx * duration);
      osc.stop(now + idx * duration + duration + 0.2);
    });
  }

  /**
   * Defeat: Melancholy descending minor slides
   */
  public playDefeat() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.game) return;

    const now = this.ctx.currentTime;
    // Descending C minor: G4, Eb4, C4, Ab3, G3
    const notes = [392.00, 311.13, 261.63, 207.65, 196.00];
    const duration = 0.25;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.categoryNodes.game) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.categoryNodes.game);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * duration);
      osc.frequency.linearRampToValueAtTime(freq * 0.85, now + idx * duration + duration);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * duration + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * duration + duration + 0.05);

      osc.start(now + idx * duration);
      osc.stop(now + idx * duration + duration + 0.1);
    });
  }

  /**
   * Crowd cheering noise spike (e.g. boundary scored)
   */
  public playCheer() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.ambient) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate bandpass-filtered noise for crowd hiss/cheers
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(1.5, now);
    
    // Sweep filter to simulate cheer swell
    filter.frequency.exponentialRampToValueAtTime(2500, now + 0.4);
    filter.frequency.exponentialRampToValueAtTime(800, now + 1.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.3); // swell
    gain.gain.linearRampToValueAtTime(0.08, now + 0.8); // sustain
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0); // decay

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.categoryNodes.ambient);

    noise.start(now);
    noise.stop(now + 2.0);
  }

  /**
   * Background ambient low hum: crowd murmuring (ambient category)
   */
  public startAmbientCrowd() {
    if (!this.resumeContext() || !this.ctx || !this.categoryNodes.ambient) return;
    if (this.crowdCheerNode) return; // Already running

    const now = this.ctx.currentTime;
    // Generate white noise buffer
    const bufferSize = this.ctx.sampleRate * 4.0; // 4 second loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now); // low murmur

    this.crowdCheerGain = this.ctx.createGain();
    this.crowdCheerGain.gain.setValueAtTime(0.03, now); // very soft hum

    noise.connect(filter);
    filter.connect(this.crowdCheerGain);
    this.crowdCheerGain.connect(this.categoryNodes.ambient);

    noise.start(now);
    this.crowdCheerNode = noise;
  }

  public stopAmbientCrowd() {
    if (this.crowdCheerNode) {
      try {
        this.crowdCheerNode.stop();
      } catch (e) {}
      this.crowdCheerNode = null;
      this.crowdCheerGain = null;
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();
export default soundSynthesizer;
