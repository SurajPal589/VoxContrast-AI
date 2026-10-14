import React, { useState } from 'react';
import {
  FileText,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ContrastiveSpeechPair, FlawCategory, TemporalFlaw } from '../types/speech';

interface TranscriptFlawViewProps {
  pair: ContrastiveSpeechPair;
  currentTimeSec: number;
  selectedFlawId: string | null;
  onSelectFlaw: (flaw: TemporalFlaw) => void;
  onSeek: (timeSec: number) => void;
}

export const TranscriptFlawView: React.FC<TranscriptFlawViewProps> = ({
  pair,
  currentTimeSec,
  selectedFlawId,
  onSelectFlaw,
  onSeek
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  const categories: { label: string; value: string; color: string }[] = [
    { label: 'All Flaws', value: 'ALL', color: 'border-slate-700 text-slate-300' },
    { label: 'Fillers', value: 'FILLER_CLUSTER', color: 'border-amber-500/40 text-amber-300' },
    { label: 'Pacing', value: 'PACING_VIOLATION', color: 'border-rose-500/40 text-rose-300' },
    { label: 'Monotony', value: 'PROSODIC_MONOTONY', color: 'border-purple-500/40 text-purple-300' },
    { label: 'Dead Air', value: 'HESITATION_DEAD_AIR', color: 'border-red-500/40 text-red-300' },
    { label: 'Rhetoric', value: 'RHETORICAL_WEAKNESS', color: 'border-pink-500/40 text-pink-300' }
  ];

  const filteredFlaws = activeCategoryFilter === 'ALL'
    ? pair.flaws
    : pair.flaws.filter(f => f.category === activeCategoryFilter);

  const getFlawBadgeClass = (category: FlawCategory) => {
    switch (category) {
      case 'FILLER_CLUSTER': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'PACING_VIOLATION': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'PROSODIC_MONOTONY': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'HESITATION_DEAD_AIR': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'RHETORICAL_WEAKNESS': return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="bg-studio-surface border border-studio-border rounded-xl p-4 shadow-sm space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-studio-border/60 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Side-by-Side Contrastive Transcript & Flaw Grounding
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3 h-3 text-slate-500 shrink-0" />
          {categories.map(c => (
            <button
              key={c.value}
              onClick={() => setActiveCategoryFilter(c.value)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition border ${
                activeCategoryFilter === c.value
                  ? 'bg-slate-800 font-bold border-cyan-400 text-cyan-300 shadow-sm'
                  : `bg-slate-900/60 ${c.color} hover:bg-slate-800`
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Transcript Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Ideal Reference Baseline */}
        <div className="bg-slate-950/70 border border-emerald-900/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 border-b border-emerald-950 pb-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Ideal Reference Baseline
            </span>
            <span className="text-[10px] font-mono text-emerald-500/80">Benchmark Standard</span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-2 max-h-72 overflow-y-auto pr-1">
            {pair.segments.map((seg) => {
              const isCurrent = currentTimeSec >= seg.startSec && currentTimeSec <= seg.endSec;
              return (
                <div
                  key={`ideal-seg-${seg.id}`}
                  onClick={() => onSeek(seg.startSec)}
                  className={`p-2 rounded-lg cursor-pointer transition ${
                    isCurrent
                      ? 'bg-emerald-950/60 border border-emerald-600/50 text-white shadow-sm'
                      : 'hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-500/70 mb-1">
                    <span>{seg.startSec.toFixed(1)}s - {seg.endSec.toFixed(1)}s</span>
                    <span>145 WPM</span>
                  </div>
                  <p>{seg.idealText}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Candidate Speech with Flaw Badges */}
        <div className="bg-slate-950/70 border border-rose-900/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-400 border-b border-rose-950 pb-2">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Candidate Delivery (Temporally Grounded)
            </span>
            <span className="text-[10px] font-mono text-amber-400/80">{filteredFlaws.length} Flaws Shown</span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-2 max-h-72 overflow-y-auto pr-1">
            {pair.segments.map((seg) => {
              const isCurrent = currentTimeSec >= seg.startSec && currentTimeSec <= seg.endSec;
              const segFlaws = pair.flaws.filter(f => seg.flawIds.includes(f.id));

              return (
                <div
                  key={`flawed-seg-${seg.id}`}
                  onClick={() => onSeek(seg.startSec)}
                  className={`p-2 rounded-lg cursor-pointer transition ${
                    isCurrent
                      ? 'bg-rose-950/50 border border-rose-600/50 text-white shadow-sm'
                      : 'hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="text-rose-400/80">{seg.startSec.toFixed(1)}s - {seg.endSec.toFixed(1)}s</span>
                    <span className="text-amber-400">{seg.wpm} WPM</span>
                  </div>

                  <p className="mb-2">{seg.flawedText}</p>

                  {/* Grounded Flaw Badges for this segment */}
                  {segFlaws.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/60">
                      {segFlaws.map((flaw) => {
                        const isSelected = selectedFlawId === flaw.id;
                        return (
                          <button
                            key={flaw.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectFlaw(flaw);
                              onSeek(flaw.startSec);
                            }}
                            className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                              getFlawBadgeClass(flaw.category)
                            } ${
                              isSelected ? 'ring-2 ring-cyan-400 font-bold scale-105' : 'hover:opacity-90'
                            }`}
                          >
                            <span>[{flaw.startSec}s - {flaw.endSec}s]</span>
                            <span>{flaw.category.replace(/_/g, ' ')}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
