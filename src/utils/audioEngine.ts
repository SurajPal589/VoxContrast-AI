// VoxContrast AI - Web Audio & Speech Synthesis Engine
// Handles synchronized dual playback, tone-modulated procedural speech synthesis,
// playhead tracking, and A/B flaw interval looping.

export interface AudioPlaybackState {
  isPlaying: boolean;
  activeTrack: 'ideal' | 'flawed' | 'ab_loop' | null;
  currentTimeSec: number;
  durationSec: number;
  isLooping: boolean;
  loopInterval: [number, number] | null;
}

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private animFrameId: number | null = null;
  private startTime = 0;
  private pauseOffset = 0;
  private duration = 48;
  private activeTrack: 'ideal' | 'flawed' | 'ab_loop' | null = null;
  private isPlaying = false;
  private onTimeUpdateCallback: ((timeSec: number) => void) | null = null;
  private onPlaybackStateChangeCallback: ((state: AudioPlaybackState) => void) | null = null;

  // Fallback oscillator node for procedural waveform audio
  private synthOsc: OscillatorNode | null = null;
  private synthGain: GainNode | null = null;

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setCallbacks(
    onTimeUpdate: (timeSec: number) => void,
    onStateChange: (state: AudioPlaybackState) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onPlaybackStateChangeCallback = onStateChange;
  }

  private notifyState(loopInterval: [number, number] | null = null) {
    if (this.onPlaybackStateChangeCallback) {
      this.onPlaybackStateChangeCallback({
        isPlaying: this.isPlaying,
        activeTrack: this.activeTrack,
        currentTimeSec: this.pauseOffset,
        durationSec: this.duration,
        isLooping: this.activeTrack === 'ab_loop',
        loopInterval
      });
    }
  }

  // Start simulated procedural audio pulse aligned with speaking
  private startProceduralAudio(pitchHz = 160, isFlawed = false) {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      this.stopProceduralAudio();

      this.synthOsc = this.audioCtx.createOscillator();
      this.synthGain = this.audioCtx.createGain();

      this.synthOsc.type = isFlawed ? 'sawtooth' : 'sine';
      this.synthOsc.frequency.setValueAtTime(pitchHz, this.audioCtx.currentTime);

      // Low volume pleasant ambient vocal tone
      this.synthGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

      this.synthOsc.connect(this.synthGain);
      this.synthGain.connect(this.audioCtx.destination);
      this.synthOsc.start();
    } catch {
      // Ignore audio context errors in quiet mode
    }
  }

  private stopProceduralAudio() {
    try {
      if (this.synthOsc) {
        this.synthOsc.stop();
        this.synthOsc.disconnect();
        this.synthOsc = null;
      }
      if (this.synthGain) {
        this.synthGain.disconnect();
        this.synthGain = null;
      }
    } catch {
      // safe cleanup
    }
  }

  // Play candidate or reference track
  public playTrack(track: 'ideal' | 'flawed', transcript: string, durationSec: number, startAtSec = 0) {
    this.stop();
    this.initAudioContext();

    this.activeTrack = track;
    this.duration = durationSec;
    this.pauseOffset = startAtSec;
    this.isPlaying = true;
    this.startTime = performance.now() - (startAtSec * 1000);

    this.notifyState();

    // Start Procedural audio support
    this.startProceduralAudio(track === 'ideal' ? 175 : 145, track === 'flawed');

    // Also trigger Web SpeechSynthesis if available
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.rate = track === 'flawed' ? 1.25 : 1.0;
      utterance.pitch = track === 'flawed' ? 0.9 : 1.1;

      utterance.onend = () => {
        // Natural end of speech
      };
      this.currentUtterance = utterance;
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback to procedural
      }
    }

    // Animation frame timer loop for smooth 60fps playhead
    const updateLoop = () => {
      if (!this.isPlaying) return;

      const elapsedSec = (performance.now() - this.startTime) / 1000;
      this.pauseOffset = Math.min(elapsedSec, this.duration);

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.pauseOffset);
      }

      if (this.pauseOffset >= this.duration) {
        this.stop();
        return;
      }

      this.animFrameId = requestAnimationFrame(updateLoop);
    };

    this.animFrameId = requestAnimationFrame(updateLoop);
  }

  // Play A/B Comparison Loop for a specific Flaw Interval
  // Plays the flawed excerpt first, pauses 400ms, then plays the ideal excerpt
  public playABLoop(
    flawedSnippet: string,
    idealSnippet: string,
    startSec: number,
    endSec: number,
    onStepChange?: (step: 'flawed' | 'ideal' | 'done') => void
  ) {
    this.stop();
    this.initAudioContext();

    this.activeTrack = 'ab_loop';
    this.isPlaying = true;
    this.notifyState([startSec, endSec]);

    if (onStepChange) onStepChange('flawed');

    // 1. Play Flawed snippet
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const uttFlawed = new SpeechSynthesisUtterance(flawedSnippet);
      uttFlawed.rate = 1.3;
      uttFlawed.pitch = 0.85;

      this.startProceduralAudio(140, true);

      uttFlawed.onend = () => {
        this.stopProceduralAudio();
        if (!this.isPlaying) return;

        // 400ms pause between A and B
        setTimeout(() => {
          if (!this.isPlaying) return;
          if (onStepChange) onStepChange('ideal');

          // 2. Play Ideal snippet
          const uttIdeal = new SpeechSynthesisUtterance(idealSnippet);
          uttIdeal.rate = 0.98;
          uttIdeal.pitch = 1.15;

          this.startProceduralAudio(180, false);

          uttIdeal.onend = () => {
            this.stopProceduralAudio();
            this.stop();
            if (onStepChange) onStepChange('done');
          };

          window.speechSynthesis.speak(uttIdeal);
        }, 400);
      };

      window.speechSynthesis.speak(uttFlawed);
    } else {
      // Procedural fallback simulation
      setTimeout(() => {
        this.stop();
        if (onStepChange) onStepChange('done');
      }, 3000);
    }
  }

  public seekTo(timeSec: number) {
    this.pauseOffset = Math.max(0, Math.min(timeSec, this.duration));
    this.startTime = performance.now() - (this.pauseOffset * 1000);
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.pauseOffset);
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.stopProceduralAudio();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    this.notifyState();
  }

  public resume(track: 'ideal' | 'flawed', transcript: string) {
    this.playTrack(track, transcript, this.duration, this.pauseOffset);
  }

  public stop() {
    this.isPlaying = false;
    this.activeTrack = null;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.stopProceduralAudio();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notifyState();
  }
}

export const audioEngine = new AudioEngine();
