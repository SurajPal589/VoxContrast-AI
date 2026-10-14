import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KPISummaryStrip } from './components/KPISummaryStrip';
import { WaveformTimeline } from './components/WaveformTimeline';
import { TelemetryChart } from './components/TelemetryChart';
import { TranscriptFlawView } from './components/TranscriptFlawView';
import { FlawDetailInspector } from './components/FlawDetailInspector';
import { DatasetExplorer } from './components/DatasetExplorer';
import { LiveStudio } from './components/LiveStudio';
import { RubricInspector } from './components/RubricInspector';
import { GeminiModal } from './components/GeminiModal';
import { DiagnosticReportModal } from './components/DiagnosticReportModal';

import { CONTRASTIVE_DATASET } from './data/contrastiveDataset';
import {
  ContrastiveSpeechPair,
  TemporalFlaw,
  RubricWeights
} from './types/speech';
import {
  DEFAULT_RUBRIC_WEIGHTS,
  evaluatePair
} from './utils/rubricEngine';
import { audioEngine, AudioPlaybackState } from './utils/audioEngine';
import { downloadReportAsJSON, openPrintableReport } from './utils/reportGenerator';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dataset' | 'studio' | 'rubric'>('dashboard');
  const [dataset, setDataset] = useState<ContrastiveSpeechPair[]>(CONTRASTIVE_DATASET);
  const [selectedPairId, setSelectedPairId] = useState<string>('pair-01');
  const [selectedFlaw, setSelectedFlaw] = useState<TemporalFlaw | null>(null);

  const [weights, setWeights] = useState<RubricWeights>(DEFAULT_RUBRIC_WEIGHTS);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Playback state synchronized with audioEngine
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    isPlaying: false,
    activeTrack: null,
    currentTimeSec: 0,
    durationSec: 48,
    isLooping: false,
    loopInterval: null
  });

  const selectedPair = dataset.find(p => p.id === selectedPairId) || dataset[0];
  const evaluationResult = evaluatePair(selectedPair, weights);

  // Initialize AudioEngine callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      (timeSec) => {
        setPlaybackState(prev => ({ ...prev, currentTimeSec: timeSec }));
      },
      (state) => {
        setPlaybackState(state);
      }
    );

    return () => {
      audioEngine.stop();
    };
  }, []);

  // When pair changes, reset selected flaw and stop audio
  const handleSelectPair = (pairId: string) => {
    audioEngine.stop();
    setSelectedPairId(pairId);
    const newPair = dataset.find(p => p.id === pairId);
    if (newPair && newPair.flaws.length > 0) {
      setSelectedFlaw(newPair.flaws[0]);
    } else {
      setSelectedFlaw(null);
    }
  };

  const handleSeek = (timeSec: number) => {
    audioEngine.seekTo(timeSec);
  };

  const handleSelectFlaw = (flaw: TemporalFlaw) => {
    setSelectedFlaw(flaw);
  };

  const handleAddCustomPair = (newPair: ContrastiveSpeechPair) => {
    setDataset(prev => [newPair, ...prev]);
    setSelectedPairId(newPair.id);
    setSelectedFlaw(newPair.flaws[0] || null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans">
      {/* Studio Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataset={dataset}
        selectedPairId={selectedPairId}
        onSelectPair={handleSelectPair}
        onDownloadJSON={() => downloadReportAsJSON(selectedPair, evaluationResult)}
        onPrintPDF={() => setIsReportModalOpen(true)}
        onOpenGeminiModal={() => setIsGeminiModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* TAB 1: INTERACTIVE EVALUATION DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top KPI Metrics Strip */}
            <KPISummaryStrip
              pair={selectedPair}
              evaluation={evaluationResult}
            />

            {/* Synchronized Dual Waveform Timeline */}
            <WaveformTimeline
              pair={selectedPair}
              playbackState={playbackState}
              selectedFlawId={selectedFlaw?.id || null}
              onSelectFlaw={handleSelectFlaw}
              onSeek={handleSeek}
            />

            {/* Multi-Metric Acoustic Telemetry Time-Series */}
            <TelemetryChart
              pair={selectedPair}
              currentTimeSec={playbackState.currentTimeSec}
              onSeek={handleSeek}
            />

            {/* Side-by-Side Contrastive Transcript & Flaw Badges */}
            <TranscriptFlawView
              pair={selectedPair}
              currentTimeSec={playbackState.currentTimeSec}
              selectedFlawId={selectedFlaw?.id || null}
              onSelectFlaw={handleSelectFlaw}
              onSeek={handleSeek}
            />

            {/* Grounded Flaw Detail Inspector & A/B Comparison Drill */}
            <FlawDetailInspector
              pair={selectedPair}
              selectedFlaw={selectedFlaw}
              onSelectFlaw={handleSelectFlaw}
              onSeek={handleSeek}
            />
          </div>
        )}

        {/* TAB 2: CONTRASTIVE DATASET EXPLORER & BUILDER */}
        {activeTab === 'dataset' && (
          <DatasetExplorer
            dataset={dataset}
            onAddCustomPair={handleAddCustomPair}
            onSelectPair={handleSelectPair}
          />
        )}

        {/* TAB 3: LIVE STUDIO (RECORD / UPLOAD) */}
        {activeTab === 'studio' && (
          <LiveStudio
            currentIdealPair={selectedPair}
            onEvaluationComplete={handleAddCustomPair}
          />
        )}

        {/* TAB 4: REPRODUCIBILITY & RUBRIC INSPECTOR */}
        {activeTab === 'rubric' && (
          <RubricInspector
            pair={selectedPair}
            weights={weights}
            onUpdateWeights={setWeights}
            evaluationResult={evaluationResult}
          />
        )}
      </main>

      {/* Optional Gemini Key Settings Modal */}
      <GeminiModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        apiKey={geminiApiKey}
        onSaveKey={setGeminiApiKey}
      />

      {/* Diagnostic Scorecard Print / PDF Modal */}
      <DiagnosticReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        pair={selectedPair}
        evaluation={evaluationResult}
      />

      {/* Studio Footer */}
      <footer className="border-t border-studio-border bg-studio-surface/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VoxContrast AI • Track C: Contrastive Speech Analytics & Temporal Flaw Grounding</span>
          <span>Multimodal AI Hackathon 2026 • IIT Mandi & AugLi.ai</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
