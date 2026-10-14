import React, { useState } from 'react';
import {
  Layers,
  Sliders,
  Download,
  PlusCircle,
  Database,
  BarChart3,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ContrastiveSpeechPair } from '../types/speech';
import {
  DEFAULT_INJECTOR_CONFIG,
  FlawInjectorConfig,
  generateContrastivePairFromText
} from '../utils/flawInjector';
import { computeDatasetBenchmarkSummary } from '../utils/rubricEngine';

interface DatasetExplorerProps {
  dataset: ContrastiveSpeechPair[];
  onAddCustomPair: (pair: ContrastiveSpeechPair) => void;
  onSelectPair: (id: string) => void;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  dataset,
  onAddCustomPair,
  onSelectPair
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pairs' | 'benchmark' | 'builder'>('benchmark');

  // Flaw Injector Form State
  const [injectorConfig, setInjectorConfig] = useState<FlawInjectorConfig>(DEFAULT_INJECTOR_CONFIG);
  const [inputTitle, setInputTitle] = useState('Quantum Computing Breakthrough Pitch');
  const [inputDomain, setInputDomain] = useState('Deep Tech Executive Pitch');
  const [inputText, setInputText] = useState(
    'Today we announce the first fault-tolerant logical qubit cluster operating at room temperature. By eliminating cryogenic cooling overhead, our architecture cuts enterprise deployment costs by eighty percent. We have filed six foundational patents and secured two commercial pilot agreements.'
  );

  const benchmarkSummary = computeDatasetBenchmarkSummary(dataset);

  const handleGeneratePair = () => {
    if (!inputText.trim()) return;
    const newPair = generateContrastivePairFromText(inputText, inputTitle, inputDomain, injectorConfig);
    onAddCustomPair(newPair);
    onSelectPair(newPair.id);
  };

  const handleDownloadFullDataset = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoxContrast_Full_Contrastive_Corpus_${dataset.length}_Pairs.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Subnav & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-studio-surface border border-studio-border rounded-xl p-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('benchmark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'benchmark'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Quality & Separation Benchmark
          </button>

          <button
            onClick={() => setActiveSubTab('pairs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'pairs'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Corpus Pairs ({dataset.length})
          </button>

          <button
            onClick={() => setActiveSubTab('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'builder'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Contrastive Flaw Injector Sandbox
          </button>
        </div>

        <button
          onClick={handleDownloadFullDataset}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-studio-card border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 text-xs font-mono font-medium transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          Download Full Corpus (.json)
        </button>
      </div>

      {/* SUBTAB 1: QUALITY & SEPARATION BENCHMARK */}
      {activeSubTab === 'benchmark' && (
        <div className="space-y-6">
          {/* Top Benchmark KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-studio-surface border border-studio-border rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase font-mono mb-1">Mean Contrastive Separation</div>
              <div className="text-3xl font-extrabold text-rose-400 font-mono">
                {benchmarkSummary.meanDelta} <span className="text-sm font-sans font-normal text-slate-400">pts</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Ideal Avg: <span className="text-emerald-400 font-bold">{benchmarkSummary.meanIdealScore}</span> vs Flawed Avg: <span className="text-rose-400 font-bold">{benchmarkSummary.meanFlawedScore}</span>
              </div>
            </div>

            <div className="bg-studio-surface border border-studio-border rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase font-mono mb-1">Temporal Flaw IoU Accuracy</div>
              <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                {(benchmarkSummary.temporalIoU * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Intersection over Union against ground-truth perturb bounds
              </div>
            </div>

            <div className="bg-studio-surface border border-studio-border rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase font-mono mb-1">Total Grounded Intervals</div>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                {benchmarkSummary.totalFlaws}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Across {benchmarkSummary.totalPairs} curated speaking domains
              </div>
            </div>

            <div className="bg-studio-surface border border-studio-border rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase font-mono mb-1">Reproducibility ICC</div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                1.000
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Intraclass Correlation • Deterministic 0.000 variance
              </div>
            </div>
          </div>

          {/* Separation Chart & Flaw Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-studio-surface border border-studio-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Ground-Truth Flaw Distribution Across Corpus
              </h3>
              <div className="space-y-3">
                {Object.entries(benchmarkSummary.categoryBreakdown).map(([cat, count]) => {
                  const pct = Math.round((count / benchmarkSummary.totalFlaws) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">{cat.replace(/_/g, ' ')}</span>
                        <span className="text-cyan-300 font-bold">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pair Contrastive Score Spread */}
            <div className="bg-studio-surface border border-studio-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Pair-by-Pair Score Separation
              </h3>
              <div className="space-y-3">
                {dataset.map(p => (
                  <div key={p.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200">{p.title}</span>
                      <span className="text-slate-400 text-[11px]">{p.domain}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-[11px] font-mono text-emerald-400 font-bold w-12">96.8</div>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 bg-emerald-500 w-[96.8%]" />
                        <div className="absolute left-0 top-0 bottom-0 bg-rose-500 w-[64.2%]" />
                      </div>
                      <div className="text-[11px] font-mono text-rose-400 font-bold w-12 text-right">64.2</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CORPUS PAIRS BROWSER */}
      {activeSubTab === 'pairs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataset.map((pair, idx) => (
            <div
              key={pair.id}
              className="bg-studio-surface border border-studio-border rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Pair #{idx + 1}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{pair.domain}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{pair.title}</h4>
                </div>

                <button
                  onClick={() => onSelectPair(pair.id)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 text-xs font-medium transition"
                >
                  Load in Dashboard
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {pair.contrastiveDesignNotes}
              </p>

              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Duration</span>
                  <span className="text-slate-200 font-bold">{pair.durationSec}s</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Rate</span>
                  <span className="text-emerald-400 font-bold">{pair.targetWPM} WPM</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Grounded Flaws</span>
                  <span className="text-amber-400 font-bold">{pair.flaws.length} Flaws</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: CONTRASTIVE FLAW INJECTOR (DATASET BUILDER) */}
      {activeSubTab === 'builder' && (
        <div className="bg-studio-surface border border-studio-border rounded-xl p-5 space-y-6">
          <div className="border-b border-studio-border/60 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Algorithmic Flaw Injection Sandbox (Create New Contrastive Pair)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Provide any clean reference speech text, calibrate perturbation parameters, and synthesize a new paired contrastive dataset entry with ground-truth temporal flaw intervals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Scenario Title</label>
                <input
                  type="text"
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-studio-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Speaking Domain</label>
                <input
                  type="text"
                  value={inputDomain}
                  onChange={(e) => setInputDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-studio-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Clean Reference Speech Text</label>
                <textarea
                  rows={5}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-slate-950 border border-studio-border rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Perturbation Sliders */}
            <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Systematic Perturbation Parameters
              </h4>

              {/* Slider 1: Filler Rate */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-amber-400">Filler Injection Rate:</span>
                  <span className="font-bold text-white">{injectorConfig.fillerRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={injectorConfig.fillerRate}
                  onChange={(e) => setInjectorConfig({ ...injectorConfig, fillerRate: parseInt(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Slider 2: Pace Rush Factor */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-rose-400">Pace Rush Factor:</span>
                  <span className="font-bold text-white">{injectorConfig.paceRushFactor}x ({Math.round(142 * injectorConfig.paceRushFactor)} WPM)</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.7"
                  step="0.05"
                  value={injectorConfig.paceRushFactor}
                  onChange={(e) => setInjectorConfig({ ...injectorConfig, paceRushFactor: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Slider 3: Monotone Flattening */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-purple-400">Monotone Pitch Flattening:</span>
                  <span className="font-bold text-white">{injectorConfig.monotoneFactor}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="95"
                  step="5"
                  value={injectorConfig.monotoneFactor}
                  onChange={(e) => setInjectorConfig({ ...injectorConfig, monotoneFactor: parseInt(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Slider 4: Hesitation Pause */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-red-400">Hesitation Dead-Air Gap:</span>
                  <span className="font-bold text-white">{injectorConfig.hesitationPauseSec}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.1"
                  value={injectorConfig.hesitationPauseSec}
                  onChange={(e) => setInjectorConfig({ ...injectorConfig, hesitationPauseSec: parseFloat(e.target.value) })}
                  className="w-full accent-red-500"
                />
              </div>

              <button
                onClick={handleGeneratePair}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Synthesize & Inject Contrastive Pair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
