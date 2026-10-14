import React, { useRef } from 'react';
import { Play, Pause, Square, AlertCircle, CheckCircle, Volume2 } from 'lucide-react';
import { ContrastiveSpeechPair, TemporalFlaw } from '../types/speech';
import { audioEngine, AudioPlaybackState } from '../utils/audioEngine';

interface WaveformTimelineProps {
  pair: ContrastiveSpeechPair;
  playbackState: AudioPlaybackState;
  selectedFlawId: string | null;
  onSelectFlaw: (flaw: TemporalFlaw) => void;
  onSeek: (timeSec: number) => void;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  pair,
  playbackState,
  selectedFlawId,
  onSelectFlaw,
  onSeek
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const duration = pair.durationSec;
  const currentTime = playbackState.currentTimeSec;
  const playheadPercent = Math.min(100, (currentTime / duration) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSec = parseFloat((ratio * duration).toFixed(1));
    onSeek(targetSec);
  };

  const getFlawColor = (category: string) => {
    switch (category) {
      case 'FILLER_CLUSTER': return 'bg-amber-500/30 border-amber-400 text-amber-300';
      case 'PACING_VIOLATION': return 'bg-rose-500/30 border-rose-400 text-rose-300';
      case 'PROSODIC_MONOTONY': return 'bg-purple-500/30 border-purple-400 text-purple-300';
      case 'HESITATION_DEAD_AIR': return 'bg-red-500/30 border-red-400 text-red-300';
      case 'RHETORICAL_WEAKNESS': return 'bg-pink-500/30 border-pink-400 text-pink-300';
      default: return 'bg-yellow-500/30 border-yellow-400 text-yellow-300';
    }
  };

  return (
    <div className="bg-studio-surface border border-studio-border rounded-xl p-4 shadow-sm space-y-3">
      {/* Track Header & Playback Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-400">Position:</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {formatTime(currentTime)}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400 font-mono">{formatTime(duration)}</span>
          </div>

          {playbackState.activeTrack && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 animate-pulse">
              <Volume2 className="w-3 h-3 text-emerald-400" />
              Playing {playbackState.activeTrack === 'ideal' ? 'Ideal' : playbackState.activeTrack === 'flawed' ? 'Flawed' : 'A/B Loop'}
            </span>
          )}
        </div>

        {/* Audio Buttons */}
        <div className="flex items-center gap-2">
          {/* Play Ideal Button */}
          <button
            onClick={() => {
              if (playbackState.isPlaying && playbackState.activeTrack === 'ideal') {
                audioEngine.pause();
              } else {
                audioEngine.playTrack('ideal', pair.idealTranscript, duration, currentTime);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              playbackState.isPlaying && playbackState.activeTrack === 'ideal'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            {playbackState.isPlaying && playbackState.activeTrack === 'ideal' ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Play Ideal
          </button>

          {/* Play Flawed Button */}
          <button
            onClick={() => {
              if (playbackState.isPlaying && playbackState.activeTrack === 'flawed') {
                audioEngine.pause();
              } else {
                audioEngine.playTrack('flawed', pair.flawedTranscript, duration, currentTime);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              playbackState.isPlaying && playbackState.activeTrack === 'flawed'
                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            {playbackState.isPlaying && playbackState.activeTrack === 'flawed' ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Play Flawed
          </button>

          {/* Stop / Reset */}
          <button
            onClick={() => audioEngine.stop()}
            title="Stop and Reset Playhead"
            className="p-1.5 rounded-lg bg-studio-card border border-studio-border hover:border-slate-600 text-slate-400 hover:text-white transition"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Synchronized Dual Track Waveform Canvas */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="relative bg-slate-950 border border-studio-border rounded-xl p-3 cursor-pointer select-none overflow-hidden group"
      >
        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-2.5 h-2.5 -ml-1 bg-cyan-400 rounded-full shadow-sm" />
        </div>

        {/* TRACK 1: Ideal Reference Waveform (Emerald) */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-1.5">
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Ideal Reference Baseline Waveform
            </span>
            <span className="text-[10px] text-emerald-500/80 font-mono">145 WPM Target • Calibrated Prosody</span>
          </div>
          <div className="h-10 w-full flex items-center gap-[2px] bg-slate-900/60 rounded px-1.5 border border-emerald-950">
            {pair.telemetry.map((t, idx) => {
              const heightPct = t.pauseState ? 8 : Math.min(100, Math.max(20, (t.idealWPM / 180) * 85));
              return (
                <div
                  key={`ideal-bar-${idx}`}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-sm transition-all ${
                    t.pauseState
                      ? 'bg-slate-700/40'
                      : currentTime >= t.timeSec
                      ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]'
                      : 'bg-emerald-700/60'
                  }`}
                  title={`t=${t.timeSec}s | Ideal Rate: ${t.idealWPM} WPM | F0: ${t.idealPitchHz} Hz`}
                />
              );
            })}
          </div>
        </div>

        {/* TRACK 2: Candidate Flawed Waveform + Grounded Flaw Bands */}
        <div className="relative">
          <div className="flex items-center justify-between text-[11px] font-mono text-rose-400 mb-1.5">
            <span className="flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              Candidate Speech Track (with Grounded Temporal Flaws)
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono">{pair.flaws.length} Grounded Intervals</span>
          </div>

          <div className="relative h-14 w-full flex items-center gap-[2px] bg-slate-900/60 rounded px-1.5 border border-rose-950/60">
            {/* Waveform Bars */}
            {pair.telemetry.map((t, idx) => {
              const isFlawedWindow = pair.flaws.some(f => t.timeSec >= f.startSec && t.timeSec <= f.endSec);
              const heightPct = t.flawedWPM === 0 ? 6 : Math.min(100, Math.max(15, (t.flawedWPM / 220) * 90));
              return (
                <div
                  key={`flawed-bar-${idx}`}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-sm transition-all ${
                    t.flawedWPM === 0
                      ? 'bg-red-900/50'
                      : isFlawedWindow
                      ? 'bg-rose-500/80'
                      : currentTime >= t.timeSec
                      ? 'bg-slate-300'
                      : 'bg-slate-600'
                  }`}
                  title={`t=${t.timeSec}s | Flawed Rate: ${t.flawedWPM} WPM | F0: ${t.flawedPitchHz} Hz`}
                />
              );
            })}

            {/* Overlay Flaw Interval Highlights directly on Track */}
            {pair.flaws.map((flaw) => {
              const leftPercent = (flaw.startSec / duration) * 100;
              const widthPercent = ((flaw.endSec - flaw.startSec) / duration) * 100;
              const isSelected = selectedFlawId === flaw.id;

              return (
                <div
                  key={flaw.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFlaw(flaw);
                    onSeek(flaw.startSec);
                  }}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`
                  }}
                  className={`absolute top-0 bottom-0 rounded border-2 cursor-pointer transition-all z-20 flex items-center justify-center overflow-hidden ${
                    getFlawColor(flaw.category)
                  } ${
                    isSelected ? 'ring-2 ring-cyan-400 shadow-lg scale-y-105 z-30' : 'hover:opacity-90'
                  }`}
                  title={`[${flaw.startSec}s - ${flaw.endSec}s] ${flaw.category}: Click to inspect drill`}
                >
                  <span className="text-[9px] font-mono font-bold px-1 truncate pointer-events-none">
                    {flaw.category.split('_')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Axis Markers */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1.5">
          <span>00:00.0</span>
          <span>{formatTime(duration * 0.25)}</span>
          <span>{formatTime(duration * 0.5)}</span>
          <span>{formatTime(duration * 0.75)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
