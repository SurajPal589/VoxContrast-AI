export type FlawCategory =
  | 'FILLER_CLUSTER'
  | 'PACING_VIOLATION'
  | 'PROSODIC_MONOTONY'
  | 'HESITATION_DEAD_AIR'
  | 'RHETORICAL_WEAKNESS';

export type FlawSeverity = 'low' | 'medium' | 'high';

export interface TemporalFlaw {
  id: string;
  startSec: number;
  endSec: number;
  category: FlawCategory;
  severity: FlawSeverity;
  flawedSnippet: string;
  idealCounterpart: string;
  acousticEvidence: string;
  actionableFeedback: string;
}

export interface TimeSeriesPoint {
  timeSec: number;
  idealWPM: number;
  flawedWPM: number;
  idealPitchHz: number;
  flawedPitchHz: number;
  idealEnergyDb: number;
  flawedEnergyDb: number;
  pauseState: boolean; // true during pauses
}

export interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  idealText: string;
  flawedText: string;
  wpm: number;
  pitchVariance: number;
  flawIds: string[];
}

export interface ContrastiveSpeechPair {
  id: string;
  title: string;
  domain: string;
  durationSec: number;
  targetWPM: number;
  speakerProfile: string;
  contrastiveDesignNotes: string;
  idealTranscript: string;
  flawedTranscript: string;
  telemetry: TimeSeriesPoint[];
  segments: TranscriptSegment[];
  flaws: TemporalFlaw[];
}

export interface RubricWeights {
  pacing: number;       // default 0.20
  fluency: number;      // default 0.25
  prosody: number;      // default 0.20
  clarity: number;      // default 0.15
  alignment: number;    // default 0.20
}

export interface RubricDimensionScore {
  name: string;
  weight: number;
  idealScore: number;
  flawedScore: number;
  delta: number;
  formula: string;
  diagnosticNote: string;
}

export interface RubricEvaluationResult {
  compositeIdeal: number;
  compositeFlawed: number;
  compositeDelta: number;
  dimensions: {
    pacing: RubricDimensionScore;
    fluency: RubricDimensionScore;
    prosody: RubricDimensionScore;
    clarity: RubricDimensionScore;
    alignment: RubricDimensionScore;
  };
  metrics: {
    meanWPM: number;
    peakWPM: number;
    pitchSD: number;
    totalFlawDurationSec: number;
    flawDurationRatio: number;
    fillerCount: number;
    pauseCount: number;
    dtwDistance: number;
  };
  sha256Hash: string;
  evaluatedAt: string;
  seed: number;
}

export interface ReproducibilityBenchmarkEntry {
  iteration: number;
  timestamp: string;
  compositeScore: number;
  pacingScore: number;
  fluencyScore: number;
  prosodyScore: number;
  clarityScore: number;
  alignmentScore: number;
  hash: string;
  match: boolean;
}

export interface DatasetBenchmarkSummary {
  totalPairs: number;
  totalFlaws: number;
  meanIdealScore: number;
  meanFlawedScore: number;
  meanDelta: number;
  temporalIoU: number; // Intersection over Union for flaw grounding accuracy
  categoryBreakdown: Record<FlawCategory, number>;
}
