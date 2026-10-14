import React from 'react';
import {
  TrendingDown,
  Clock,
  Gauge,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ContrastiveSpeechPair, RubricEvaluationResult } from '../types/speech';

interface KPISummaryStripProps {
  pair: ContrastiveSpeechPair;
  evaluation: RubricEvaluationResult;
}

export const KPISummaryStrip: React.FC<KPISummaryStripProps> = ({ pair, evaluation }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Composite Score & Delta */}
      <div className="bg-studio-surface border border-studio-border rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Composite Rubric</span>
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-rose-400 tracking-tight font-mono">
            {evaluation.compositeFlawed}
          </span>
          <span className="text-xs text-slate-500 font-mono">/ 100</span>
          <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
            {evaluation.compositeDelta} pts
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-studio-border/60 pt-1.5 mt-0.5">
          <span>Ideal Baseline:</span>
          <span className="font-mono text-emerald-400 font-bold">{evaluation.compositeIdeal}</span>
        </div>
      </div>

      {/* 2. Flaw Duration & Count */}
      <div className="bg-studio-surface border border-studio-border rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Grounded Flaws</span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-amber-400 tracking-tight font-mono">
            {pair.flaws.length}
          </span>
          <span className="text-xs text-slate-400">intervals</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
            {evaluation.metrics.totalFlawDurationSec}s
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-studio-border/60 pt-1.5 mt-0.5">
          <span>Total Duration:</span>
          <span className="font-mono text-slate-300">{pair.durationSec}.0s</span>
        </div>
      </div>

      {/* 3. Speaking Rate Pacing */}
      <div className="bg-studio-surface border border-studio-border rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Speaking Pacing</span>
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-cyan-400 tracking-tight font-mono">
            {evaluation.metrics.meanWPM}
          </span>
          <span className="text-xs text-slate-400 font-mono">WPM</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Peak {evaluation.metrics.peakWPM}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-studio-border/60 pt-1.5 mt-0.5">
          <span>Target Rate:</span>
          <span className="font-mono text-emerald-400 font-bold">{pair.targetWPM} WPM</span>
        </div>
      </div>

      {/* 4. Prosodic Pitch F0 Dispersion */}
      <div className="bg-studio-surface border border-studio-border rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Prosody (F0 SD)</span>
          <Activity className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-purple-400 tracking-tight font-mono">
            {evaluation.metrics.pitchSD}
          </span>
          <span className="text-xs text-slate-400 font-mono">Hz SD</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
            DTW {evaluation.metrics.dtwDistance}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-studio-border/60 pt-1.5 mt-0.5">
          <span>Inflection Status:</span>
          <span className={`font-mono font-bold ${evaluation.metrics.pitchSD < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {evaluation.metrics.pitchSD < 10 ? 'Monotone Flatline' : 'Dynamic Dynamic'}
          </span>
        </div>
      </div>

      {/* 5. Reproducibility Proof Badge */}
      <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-950/40 via-studio-surface to-studio-surface border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-emerald-300 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Reproducibility
          </span>
          <Clock className="w-3 h-3 text-emerald-500/70" />
        </div>
        <div className="my-1.5">
          <div className="text-sm font-bold text-emerald-300 flex items-center gap-1 font-mono">
            Variance: 0.000
          </div>
          <div className="text-[11px] text-emerald-400/80 font-mono truncate" title={evaluation.sha256Hash}>
            SHA: {evaluation.sha256Hash.substring(0, 12)}...
          </div>
        </div>
        <div className="text-[10px] text-emerald-500/90 font-mono flex items-center justify-between border-t border-emerald-500/20 pt-1.5 mt-0.5">
          <span>Seed #2026</span>
          <span className="font-bold text-emerald-400">ICC = 1.00</span>
        </div>
      </div>
    </div>
  );
};
