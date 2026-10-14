import {
  ContrastiveSpeechPair,
  TemporalFlaw,
  TimeSeriesPoint,
  TranscriptSegment,
  FlawCategory
} from '../types/speech';

export interface FlawInjectorConfig {
  fillerRate: number;        // 0 to 100 (%)
  paceRushFactor: number;    // 1.0 (normal) to 1.8 (very rushed)
  monotoneFactor: number;    // 0 (natural dynamic) to 100 (flatline)
  hesitationPauseSec: number;// 0 to 3.5 seconds
}

export const DEFAULT_INJECTOR_CONFIG: FlawInjectorConfig = {
  fillerRate: 35,
  paceRushFactor: 1.35,
  monotoneFactor: 70,
  hesitationPauseSec: 2.0
};

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'kind of', 'sort of'];
const HEDGING_WORDS = ['I guess', 'we think', 'maybe', 'probably', 'pretty much'];

// Synthesize a new ContrastiveSpeechPair from clean reference text
export function generateContrastivePairFromText(
  cleanText: string,
  title: string,
  domain: string,
  config: FlawInjectorConfig = DEFAULT_INJECTOR_CONFIG
): ContrastiveSpeechPair {
  const words = cleanText.trim().split(/\s+/);
  const totalWords = words.length;
  const targetWPM = 142;
  const idealDurationSec = Math.max(20, Math.round((totalWords / targetWPM) * 60));

  const flaws: TemporalFlaw[] = [];
  const segments: TranscriptSegment[] = [];
  const telemetry: TimeSeriesPoint[] = [];

  let flawedWordsList: string[] = [];
  let currentTime = 0;
  const segmentWordCount = Math.max(6, Math.floor(totalWords / 5));

  for (let s = 0; s < totalWords; s += segmentWordCount) {
    const chunkWords = words.slice(s, s + segmentWordCount);
    const idealChunk = chunkWords.join(' ');
    const chunkDuration = (chunkWords.length / targetWPM) * 60;
    const startSec = parseFloat(currentTime.toFixed(1));
    const endSec = parseFloat((currentTime + chunkDuration).toFixed(1));

    const chunkFlawIds: string[] = [];
    let flawedChunk = idealChunk;

    // Inject Filler Cluster if fillerRate > 20%
    if (config.fillerRate > 20 && (s === 0 || Math.random() < config.fillerRate / 100)) {
      const filler1 = FILLER_WORDS[Math.floor(Math.random() * FILLER_WORDS.length)];
      const filler2 = FILLER_WORDS[Math.floor(Math.random() * FILLER_WORDS.length)];
      flawedChunk = `${filler1}, ${flawedChunk}, ${filler2}`;

      const flawId = `gen-flaw-filler-${s}`;
      chunkFlawIds.push(flawId);
      flaws.push({
        id: flawId,
        startSec,
        endSec: parseFloat((startSec + Math.min(4.5, chunkDuration)).toFixed(1)),
        category: 'FILLER_CLUSTER',
        severity: config.fillerRate > 50 ? 'high' : 'medium',
        flawedSnippet: `${filler1}... ${chunkWords.slice(0, 3).join(' ')}... ${filler2}`,
        idealCounterpart: chunkWords.slice(0, 3).join(' '),
        acousticEvidence: `Injected lexical filler cluster: "${filler1}", "${filler2}". Density: ${(config.fillerRate / 10).toFixed(1)} fillers/100 words.`,
        actionableFeedback: 'Vocal Pause Replacement: Replace verbal disfluencies with a silent diaphragmatic breath.'
      });
    }

    // Inject Pacing Rush
    if (config.paceRushFactor > 1.2 && s === segmentWordCount) {
      const rushWPM = Math.round(targetWPM * config.paceRushFactor);
      const flawId = `gen-flaw-pacing-${s}`;
      chunkFlawIds.push(flawId);
      flaws.push({
        id: flawId,
        startSec,
        endSec,
        category: 'PACING_VIOLATION',
        severity: config.paceRushFactor > 1.4 ? 'high' : 'medium',
        flawedSnippet: flawedChunk,
        idealCounterpart: idealChunk,
        acousticEvidence: `Speaking rate compressed to ${rushWPM} WPM (+${Math.round((config.paceRushFactor - 1) * 100)}% over target ${targetWPM} WPM).`,
        actionableFeedback: 'Cadence Regulation: Decelerate speech tempo during key statements to allow audience processing.'
      });
    }

    // Inject Hesitation Gap
    if (config.hesitationPauseSec >= 1.5 && s === segmentWordCount * 2) {
      flawedChunk = `${flawedChunk} ... [hesitation ${config.hesitationPauseSec.toFixed(1)}s] ...`;
      const flawId = `gen-flaw-hesitation-${s}`;
      chunkFlawIds.push(flawId);
      flaws.push({
        id: flawId,
        startSec: endSec - 1.0,
        endSec: endSec + config.hesitationPauseSec,
        category: 'HESITATION_DEAD_AIR',
        severity: 'high',
        flawedSnippet: `[Mid-clause silence: ${config.hesitationPauseSec.toFixed(1)}s]`,
        idealCounterpart: idealChunk.slice(-15),
        acousticEvidence: `Acoustic energy dropped to -48 dB for ${Math.round(config.hesitationPauseSec * 1000)}ms breaking syntactic structure.`,
        actionableFeedback: 'Continuity Flow Drill: Sustain breath support through clause boundaries to prevent dead-air stalls.'
      });
    }

    // Inject Monotone Pitch Flattening
    if (config.monotoneFactor > 40 && s === segmentWordCount * 3) {
      const flawId = `gen-flaw-monotone-${s}`;
      chunkFlawIds.push(flawId);
      flaws.push({
        id: flawId,
        startSec,
        endSec,
        category: 'PROSODIC_MONOTONY',
        severity: config.monotoneFactor > 70 ? 'high' : 'medium',
        flawedSnippet: flawedChunk,
        idealCounterpart: idealChunk,
        acousticEvidence: `F0 Pitch standard deviation suppressed to ${(8 * (1 - config.monotoneFactor / 100) + 2).toFixed(1)} Hz (acoustic flatline).`,
        actionableFeedback: 'Pitch Contour Variety: Introduce pitch variation of at least ±20 Hz across emphasis words.'
      });
    }

    // Inject Rhetorical Hedging at the end
    if (s + segmentWordCount >= totalWords) {
      const hedge = HEDGING_WORDS[Math.floor(Math.random() * HEDGING_WORDS.length)];
      flawedChunk = `${flawedChunk}, ${hedge}.`;
      const flawId = `gen-flaw-rhetoric-${s}`;
      chunkFlawIds.push(flawId);
      flaws.push({
        id: flawId,
        startSec: Math.max(0, endSec - 3.5),
        endSec,
        category: 'RHETORICAL_WEAKNESS',
        severity: 'medium',
        flawedSnippet: `${chunkWords.slice(-3).join(' ')}, ${hedge}`,
        idealCounterpart: chunkWords.slice(-3).join(' '),
        acousticEvidence: `Hedging modifier "${hedge}" diminishes conviction of concluding sentence.`,
        actionableFeedback: 'Firm Closing Cadence: End on a decisive descending tone without qualification.'
      });
    }

    flawedWordsList.push(flawedChunk);

    segments.push({
      id: `gen-seg-${s}`,
      startSec,
      endSec,
      idealText: idealChunk,
      flawedText: flawedChunk,
      wpm: config.paceRushFactor > 1.2 && s === segmentWordCount ? Math.round(targetWPM * config.paceRushFactor) : targetWPM,
      pitchVariance: config.monotoneFactor > 50 ? 3.5 : 14.2,
      flawIds: chunkFlawIds
    });

    currentTime = endSec;
  }

  // Generate 1-second telemetry points
  const durationSec = Math.ceil(currentTime);
  for (let t = 0; t <= durationSec; t++) {
    const isFlawedRushing = t >= 6 && t <= 14;
    const isHesitation = t >= 16 && t <= 16 + config.hesitationPauseSec;
    const isMonotone = t >= 22 && t <= 32;

    const idealWPM = t === 5 || t === 18 ? 0 : targetWPM + Math.sin(t * 0.5) * 5;
    const flawedWPM = isHesitation ? 0 : isFlawedRushing ? Math.round(targetWPM * config.paceRushFactor) : targetWPM - 10;

    const idealPitchHz = 175 + Math.sin(t * 0.8) * 22;
    const flawedPitchHz = isHesitation ? 105 : isMonotone ? 142 + (Math.sin(t * 2) * 2) : 150 + Math.sin(t * 0.4) * 8;

    const idealEnergyDb = idealWPM === 0 ? -45 : -16;
    const flawedEnergyDb = isHesitation ? -49 : isFlawedRushing ? -17 : -22;

    telemetry.push({
      timeSec: t,
      idealWPM: Math.round(idealWPM),
      flawedWPM: Math.round(flawedWPM),
      idealPitchHz: Math.round(idealPitchHz),
      flawedPitchHz: Math.round(flawedPitchHz),
      idealEnergyDb,
      flawedEnergyDb,
      pauseState: idealWPM === 0 || isHesitation
    });
  }

  const generatedId = `custom-pair-${Date.now().toString(36)}`;

  return {
    id: generatedId,
    title: title || 'Custom Contrastive Speech Scenario',
    domain: domain || 'Executive Presentation',
    durationSec,
    targetWPM,
    speakerProfile: 'Synthetic Contrastive Generation (User Prompted)',
    contrastiveDesignNotes: `Algorithmic perturbation applied: Filler Rate = ${config.fillerRate}%, Rush Factor = ${config.paceRushFactor}x, Monotone Flattening = ${config.monotoneFactor}%, Hesitation Gap = ${config.hesitationPauseSec}s.`,
    idealTranscript: cleanText,
    flawedTranscript: flawedWordsList.join(' '),
    telemetry,
    segments,
    flaws
  };
}
