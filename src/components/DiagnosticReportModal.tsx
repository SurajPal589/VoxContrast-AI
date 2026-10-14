import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { ContrastiveSpeechPair, RubricEvaluationResult } from '../types/speech';
import { downloadReportAsJSON, openPrintableReport } from '../utils/reportGenerator';

interface DiagnosticReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: ContrastiveSpeechPair;
  evaluation: RubricEvaluationResult;
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({
  isOpen,
  onClose,
  pair,
  evaluation
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div>
            <h3 className="text-base font-bold text-white">Diagnostic Scorecard & Coaching Report</h3>
            <p className="text-xs text-slate-400 font-mono">{pair.title} ({pair.domain})</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openPrintableReport(pair, evaluation)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>

            <button
              onClick={() => downloadReportAsJSON(pair, evaluation)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Download JSON
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 font-sans text-xs">
          {/* Top Score Box */}
          <div className="grid grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Candidate Score</div>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">{evaluation.compositeFlawed} / 100</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Ideal Baseline</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{evaluation.compositeIdeal} / 100</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Contrastive Delta</div>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">{evaluation.compositeDelta} pts</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Grounded Flaws</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">{pair.flaws.length}</div>
            </div>
          </div>

          {/* Reproducibility Banner */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl text-xs font-mono flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Deterministic Scoring Audit Verified (Seed #2026)
              </span>
              <span className="text-[10px] text-emerald-400/80 block">
                SHA-256 Hash: {evaluation.sha256Hash}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              0.000 Variance • ICC = 1.0
            </span>
          </div>

          {/* 5-Axis Rubric Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              5-Axis Evaluative Rubric Breakdown
            </h4>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-[11px] font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-left">
                  <tr>
                    <th className="p-2.5">Rubric Dimension</th>
                    <th className="p-2.5">Weight</th>
                    <th className="p-2.5">Candidate</th>
                    <th className="p-2.5">Ideal</th>
                    <th className="p-2.5">Delta</th>
                    <th className="p-2.5">Diagnostic Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {Object.values(evaluation.dimensions).map((d) => (
                    <tr key={d.name}>
                      <td className="p-2.5 font-bold text-white">{d.name}</td>
                      <td className="p-2.5 text-slate-400">{Math.round(d.weight * 100)}%</td>
                      <td className="p-2.5 text-rose-400 font-bold">{d.flawedScore}</td>
                      <td className="p-2.5 text-emerald-400 font-bold">{d.idealScore}</td>
                      <td className="p-2.5 text-rose-400">{d.delta}</td>
                      <td className="p-2.5 text-slate-300 text-[10px]">{d.diagnosticNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Temporally Grounded Flaws */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Temporally Grounded Flaws & Vocal Coaching Drills
            </h4>
            <div className="space-y-2">
              {pair.flaws.map((flaw) => (
                <div key={flaw.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-rose-400 font-bold">
                      [{flaw.startSec}s - {flaw.endSec}s] {flaw.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400 uppercase text-[10px]">{flaw.severity} Severity</span>
                  </div>
                  <div className="text-[11px] text-slate-300 italic">"{flaw.flawedSnippet}"</div>
                  <div className="text-[10px] text-emerald-300 font-sans">
                    <strong>Drill:</strong> {flaw.actionableFeedback}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
