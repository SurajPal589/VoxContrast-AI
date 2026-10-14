import React from 'react';
import {
  Activity,
  Layers,
  Mic,
  ShieldCheck,
  FileDown,
  Sparkles,
  Volume2
} from 'lucide-react';
import { ContrastiveSpeechPair } from '../types/speech';

interface NavbarProps {
  activeTab: 'dashboard' | 'dataset' | 'studio' | 'rubric';
  setActiveTab: (tab: 'dashboard' | 'dataset' | 'studio' | 'rubric') => void;
  dataset: ContrastiveSpeechPair[];
  selectedPairId: string;
  onSelectPair: (id: string) => void;
  onDownloadJSON: () => void;
  onPrintPDF: () => void;
  onOpenGeminiModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dataset,
  selectedPairId,
  onSelectPair,
  onDownloadJSON,
  onPrintPDF,
  onOpenGeminiModal,
}) => {
  return (
    <header className="border-b border-studio-border bg-studio-bg/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Track Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  VoxContrast AI
                </span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  Track C
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Contrastive Speech Analytics & Temporal Flaw Grounding</p>
            </div>
          </div>

          {/* Quick Scenario Selector for Mobile */}
          <div className="md:hidden">
            <select
              value={selectedPairId}
              onChange={(e) => onSelectPair(e.target.value)}
              className="bg-studio-card border border-studio-border text-xs rounded-md px-2 py-1 text-slate-200"
            >
              {dataset.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-studio-surface border border-studio-border rounded-xl p-1 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-card'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Evaluation Dashboard
          </button>

          <button
            onClick={() => setActiveTab('dataset')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dataset'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-card'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Dataset Explorer & Builder
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'studio'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-card'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Live Studio
          </button>

          <button
            onClick={() => setActiveTab('rubric')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'rubric'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-card'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Rubric & Reproducibility
          </button>
        </nav>

        {/* Actions & Scenario Dropdown */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Pair Selector */}
          <div className="flex items-center gap-1.5 bg-studio-surface border border-studio-border rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-mono">Pair:</span>
            <select
              value={selectedPairId}
              onChange={(e) => onSelectPair(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[210px] truncate"
            >
              {dataset.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.title} ({p.domain})
                </option>
              ))}
            </select>
          </div>

          {/* Export Report Actions */}
          <button
            onClick={onPrintPDF}
            title="Print or Save PDF Diagnostic Scorecard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-studio-card border border-studio-border hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            Scorecard PDF
          </button>

          <button
            onClick={onDownloadJSON}
            title="Download JSON Diagnostic Data"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-studio-card border border-studio-border hover:border-slate-600 text-slate-300 hover:text-white text-xs font-mono font-medium transition"
          >
            .JSON
          </button>

          {/* Optional Gemini API Modal */}
          <button
            onClick={onOpenGeminiModal}
            title="Configure Optional Gemini API Key for deep multimodal analysis"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Gemini
          </button>
        </div>
      </div>
    </header>
  );
};
