import React, { useState } from 'react';
import {
  AlertCircle,
  Repeat,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle,
  Volume2
} from 'lucide-react';
import { TemporalFlaw, ContrastiveSpeechPair } from '../types/speech';
import { audioEngine } from '../utils/audioEngine';

interface FlawDetailInspectorProps {
  pair: ContrastiveSpeechPair;
  selectedFlaw: TemporalFlaw | null;
  onSelectFlaw: (flaw: TemporalFlaw) => void;
  onSeek: (timeSec: number) => void;
}

export const FlawDetailInspector: React.FC<FlawDetailInspectorProps> = ({
  pair,
  selectedFlaw,
  onSelectFlaw,
  onSeek
}) => {
  const [abStep, setAbStep] = useState<'idle' | 'flawed' | 'ideal'>('idle');

  // If none selected, default to the first flaw
  const currentFlaw = selectedFlaw || pair.flaws[0];

  if (!currentFlaw) {
    return null;
  }

  const handlePlayABLoop = () => {
    setAbStep('flawed');
    audioEngine.playABLoop(
      currentFlaw.flawedSnippet,
      currentFlaw.idealCounterpart,
      currentFlaw.startSec,
      currentFlaw.endSec,
      (step) => {
        if (step === 'flawed') setAbStep('flawed');
        else if (step === 'ideal') setAbStep('ideal');
        else setAbStep('idle');
      }
    );
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">HIGH SEVERITY</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">MEDIUM SEVERITY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700 text-slate-300 border border-slate-600">LOW SEVERITY</span>;
    }
  };

  return (
    <div className="bg-studio-surface border border-studio-border rounded-xl p-4 shadow-sm space-y-4">
      {/* Top Header & Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-studio-border/60 pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Temporal Flaw Grounding & Actionable Vocal Coaching
          </h3>
        </div>

        {/* Quick Flaw Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {pair.flaws.map((flaw, idx) => {
            const isSelected = currentFlaw.id === flaw.id;
            return (
              <button
                key={flaw.id}
                onClick={() => {
                  onSelectFlaw(flaw);
                  onSeek(flaw.startSec);
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono transition border ${
                  isSelected
                    ? 'bg-rose-500 text-white font-bold border-rose-400 shadow-sm'
                    : 'bg-slate-900 border-studio-border text-slate-400 hover:text-slate-200'
                }`}
              >
                #{idx + 1} [{flaw.startSec}s]
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Flaw Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
        {/* Title, Category & Timestamp */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
              [{currentFlaw.startSec.toFixed(1)}s - {currentFlaw.endSec.toFixed(1)}s]
            </span>
            <span className="text-sm font-bold text-rose-300">
              {currentFlaw.category.replace(/_/g, ' ')}
            </span>
            {getSeverityBadge(currentFlaw.severity)}
          </div>

          {/* A/B Comparison Audio Loop Button */}
          <button
            onClick={handlePlayABLoop}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-md ${
              abStep !== 'idle'
                ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 animate-pulse'
                : 'bg-studio-card border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {abStep === 'flawed' ? (
              <span className="flex items-center gap-1 font-mono text-white">
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                Step 1/2: Playing Flawed Snippet...
              </span>
            ) : abStep === 'ideal' ? (
              <span className="flex items-center gap-1 font-mono text-white">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                Step 2/2: Playing Ideal Target...
              </span>
            ) : (
              'Compare Audio (A/B Loop)'
            )}
          </button>
        </div>

        {/* Side-by-Side Diff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Flawed Delivery Snippet */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400 font-bold mb-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              FLAWED DELIVERY SNIPPET
            </div>
            <p className="text-xs text-rose-200 font-medium leading-relaxed italic">
              "{currentFlaw.flawedSnippet}"
            </p>
          </div>

          {/* Ideal Reference Counterpart */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold mb-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              IDEAL REFERENCE COUNTERPART
            </div>
            <p className="text-xs text-emerald-200 font-medium leading-relaxed font-sans">
              "{currentFlaw.idealCounterpart}"
            </p>
          </div>
        </div>

        {/* Quantitative Acoustic Evidence */}
        <div className="bg-slate-900 border border-studio-border rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            QUANTITATIVE ACOUSTIC EVIDENCE
          </div>
          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            {currentFlaw.acousticEvidence}
          </p>
        </div>

        {/* Actionable Vocal Coaching Drill */}
        <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            ACTIONABLE CLINICAL VOCAL DRILL
          </div>
          <p className="text-xs text-emerald-100 font-sans leading-relaxed font-medium">
            {currentFlaw.actionableFeedback}
          </p>
        </div>
      </div>
    </div>
  );
};
