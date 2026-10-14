import React, { useState } from 'react';
import { Activity, Gauge, TrendingUp } from 'lucide-react';
import { ContrastiveSpeechPair, TimeSeriesPoint } from '../types/speech';

interface TelemetryChartProps {
  pair: ContrastiveSpeechPair;
  currentTimeSec: number;
  onSeek: (timeSec: number) => void;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ pair, currentTimeSec, onSeek }) => {
  const [metricMode, setMetricMode] = useState<'both' | 'wpm' | 'pitch'>('both');
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);

  const duration = pair.durationSec;
  const telemetry = pair.telemetry;

  // Chart dimensions in SVG coordinates
  const svgWidth = 900;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Scaling helpers
  // WPM range: 0 to 240
  const maxWPM = 240;
  const minWPM = 0;
  const getYForWPM = (wpm: number) => {
    const clamped = Math.max(minWPM, Math.min(maxWPM, wpm));
    return padding.top + chartHeight - ((clamped - minWPM) / (maxWPM - minWPM)) * chartHeight;
  };

  // Pitch range: 100 Hz to 240 Hz
  const maxPitch = 240;
  const minPitch = 100;
  const getYForPitch = (pitch: number) => {
    const clamped = Math.max(minPitch, Math.min(maxPitch, pitch));
    return padding.top + chartHeight - ((clamped - minPitch) / (maxPitch - minPitch)) * chartHeight;
  };

  const getXForTime = (timeSec: number) => {
    return padding.left + (timeSec / duration) * chartWidth;
  };

  // Optimal WPM zone (130 to 165 WPM)
  const optimalZoneTop = getYForWPM(165);
  const optimalZoneBottom = getYForWPM(130);
  const optimalZoneHeight = Math.abs(optimalZoneBottom - optimalZoneTop);

  // SVG Polyline Path Generators
  const idealWPMPath = telemetry
    .map(t => `${getXForTime(t.timeSec)},${getYForWPM(t.idealWPM)}`)
    .join(' ');

  const flawedWPMPath = telemetry
    .map(t => `${getXForTime(t.timeSec)},${getYForWPM(t.flawedWPM)}`)
    .join(' ');

  const idealPitchPath = telemetry
    .map(t => `${getXForTime(t.timeSec)},${getYForPitch(t.idealPitchHz)}`)
    .join(' ');

  const flawedPitchPath = telemetry
    .map(t => `${getXForTime(t.timeSec)},${getYForPitch(t.flawedPitchHz)}`)
    .join(' ');

  const playheadX = getXForTime(currentTimeSec);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clickX - padding.left) / chartWidth));
    const targetSec = parseFloat((ratio * duration).toFixed(1));
    onSeek(targetSec);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clickX - padding.left) / chartWidth));
    const targetSec = Math.round(ratio * duration);
    const pt = telemetry.find(t => t.timeSec === targetSec);
    if (pt) setHoveredPoint(pt);
  };

  return (
    <div className="bg-studio-surface border border-studio-border rounded-xl p-4 shadow-sm space-y-3">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-studio-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Acoustic Telemetry Time-Series Contour
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">1.0s Resolution</span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-studio-border rounded-lg p-0.5 text-[11px] font-medium">
          <button
            onClick={() => setMetricMode('both')}
            className={`px-2.5 py-1 rounded transition ${
              metricMode === 'both' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setMetricMode('wpm')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
              metricMode === 'wpm' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3 h-3 text-cyan-400" />
            WPM Cadence
          </button>
          <button
            onClick={() => setMetricMode('pitch')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
              metricMode === 'pitch' ? 'bg-slate-800 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-purple-400" />
            F0 Pitch
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative bg-slate-950 rounded-lg border border-studio-border/80 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 md:h-56 cursor-crosshair select-none"
          onClick={handleSvgClick}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Shaded Optimal Pacing Zone (130-165 WPM) */}
          {(metricMode === 'both' || metricMode === 'wpm') && (
            <g>
              <rect
                x={padding.left}
                y={optimalZoneTop}
                width={chartWidth}
                height={optimalZoneHeight}
                fill="rgba(16, 185, 129, 0.08)"
                stroke="rgba(16, 185, 129, 0.2)"
                strokeDasharray="2,2"
              />
              <text
                x={svgWidth - padding.right - 10}
                y={optimalZoneTop + 14}
                fill="#34d399"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
                opacity="0.8"
              >
                OPTIMAL PACING ZONE (130–165 WPM)
              </text>
            </g>
          )}

          {/* Grid Lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={svgWidth - padding.right}
            y2={padding.top}
            stroke="#1e293b"
            strokeDasharray="3,3"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight / 2}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight / 2}
            stroke="#1e293b"
            strokeDasharray="3,3"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight}
            stroke="#334155"
          />

          {/* Y Axis Labels (Left: WPM) */}
          <text x={padding.left - 6} y={padding.top + 4} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
            240
          </text>
          <text x={padding.left - 6} y={padding.top + chartHeight / 2 + 3} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
            120
          </text>
          <text x={padding.left - 6} y={padding.top + chartHeight} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
            0 WPM
          </text>

          {/* Ideal WPM: Dashed Emerald Line */}
          {(metricMode === 'both' || metricMode === 'wpm') && (
            <polyline
              points={idealWPMPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4,3"
              opacity="0.85"
            />
          )}

          {/* Candidate Flawed WPM: Solid Rose Line */}
          {(metricMode === 'both' || metricMode === 'wpm') && (
            <polyline
              points={flawedWPMPath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
            />
          )}

          {/* Ideal Pitch F0: Dashed Cyan Line */}
          {(metricMode === 'both' || metricMode === 'pitch') && (
            <polyline
              points={idealPitchPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.8"
              strokeDasharray="3,3"
              opacity="0.8"
            />
          )}

          {/* Candidate Flawed Pitch F0: Solid Purple Line */}
          {(metricMode === 'both' || metricMode === 'pitch') && (
            <polyline
              points={flawedPitchPath}
              fill="none"
              stroke="#c084fc"
              strokeWidth="2"
            />
          )}

          {/* Playhead Vertical Line */}
          <line
            x1={playheadX}
            y1={padding.top}
            x2={playheadX}
            y2={padding.top + chartHeight}
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeDasharray="2,2"
          />
          <circle cx={playheadX} cy={padding.top} r="3" fill="#22d3ee" />

          {/* Hovered point marker */}
          {hoveredPoint && (
            <line
              x1={getXForTime(hoveredPoint.timeSec)}
              y1={padding.top}
              x2={getXForTime(hoveredPoint.timeSec)}
              y2={padding.top + chartHeight}
              stroke="#94a3b8"
              strokeWidth="1"
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-2 bg-slate-900/95 border border-slate-700 rounded-lg p-2 text-[11px] font-mono shadow-xl backdrop-blur pointer-events-none"
          >
            <div className="text-slate-300 font-bold border-b border-slate-800 pb-1 mb-1">
              Timestamp: {hoveredPoint.timeSec}.0s / {duration}.0s
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <span className="text-rose-400">Flawed WPM:</span>
              <span className="font-bold text-white">{hoveredPoint.flawedWPM} WPM</span>
              <span className="text-emerald-400">Ideal WPM:</span>
              <span className="text-slate-300">{hoveredPoint.idealWPM} WPM</span>
              <span className="text-purple-400">Flawed F0:</span>
              <span className="font-bold text-white">{hoveredPoint.flawedPitchHz} Hz</span>
              <span className="text-cyan-400">Ideal F0:</span>
              <span className="text-slate-300">{hoveredPoint.idealPitchHz} Hz</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 rounded inline-block" />
            <span className="text-rose-400">Candidate Rate (WPM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-emerald-400 inline-block" />
            <span className="text-emerald-400">Ideal Baseline WPM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-purple-400 rounded inline-block" />
            <span className="text-purple-300">Candidate F0 Pitch (Hz)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-cyan-400 inline-block" />
            <span className="text-cyan-400">Ideal F0 Pitch</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500">Click chart to seek audio</div>
      </div>
    </div>
  );
};
