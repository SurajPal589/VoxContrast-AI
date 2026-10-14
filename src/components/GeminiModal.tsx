import React, { useState } from 'react';
import { X, Sparkles, Key, CheckCircle, ExternalLink } from 'lucide-react';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export const GeminiModal: React.FC<GeminiModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(tempKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-studio-surface border border-studio-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Gemini API Multimodal Analysis</h3>
            <p className="text-xs text-slate-400">Optional: Deep semantic critique & clinical review</p>
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            <strong>Zero-Crash Principle:</strong> VoxContrast AI operates 100% out-of-the-box without requiring an API key using our deterministic 5-axis scoring math and acoustic grounding algorithms.
          </p>
          <p className="text-slate-400 text-[11px]">
            If you provide a Gemini API key, VoxContrast AI will supplement the deterministic grounding with real-time multimodal LLM semantic evaluation.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-slate-300 font-medium flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            Google Gemini API Key
          </label>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            className="w-full bg-slate-950 border border-studio-border rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:underline"
          >
            Get a free Gemini API key <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-studio-card border border-studio-border text-slate-300 hover:text-white text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            {saved ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> Saved!
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
