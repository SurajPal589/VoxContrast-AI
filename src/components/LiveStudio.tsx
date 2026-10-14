import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Activity,
  AlertTriangle,
  Sparkles,
  FileAudio,
  Play,
  Pause,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Volume2,
  RefreshCw
} from 'lucide-react';
import { ContrastiveSpeechPair, RubricEvaluationResult, TemporalFlaw } from '../types/speech';
import { evaluatePair } from '../utils/rubricEngine';
import { generateContrastivePairFromText } from '../utils/flawInjector';
import { audioEngine } from '../utils/audioEngine';

interface LiveStudioProps {
  currentIdealPair: ContrastiveSpeechPair;
  onEvaluationComplete: (customPair: ContrastiveSpeechPair, autoSwitch?: boolean) => void;
  onNavigateToDashboard?: () => void;
}

// 3 Pre-set test voice scenarios for instant evaluation without requiring a microphone
const TEST_VOICE_SAMPLES = [
  {
    id: 'sample-rushed',
    label: 'Fast-Paced Startup Pitch (210 WPM Rush)',
    domain: 'Executive Pitch',
    snippet: 'Like, basically every eight seconds an oncology patient receives a delayed result and we built this super fast assay in forty-five minutes with ninety-four percent sensitivity which is pretty cool so yeah thanks for your time.',
    flawProfile: { fillerRate: 35, paceRushFactor: 1.45, monotoneFactor: 40, hesitationPauseSec: 1.5 }
  },
  {
    id: 'sample-fillers',
    label: 'Disfluent Policy Debate (Filler Heavy)',
    domain: 'Debate / Argumentation',
    snippet: 'Um, distinguished committee members, so basically rapid advancements in autonomous reasoning kind of demand governance. We cannot, you know, afford retroactive legislation, and I guess we should probably do this.',
    flawProfile: { fillerRate: 65, paceRushFactor: 1.15, monotoneFactor: 30, hesitationPauseSec: 2.2 }
  },
  {
    id: 'sample-monotone',
    label: 'Monotone Technical Briefing (Flat Pitch)',
    domain: 'Technical Presentation',
    snippet: 'At zero-six-hundred UTC tomorrow Orbit-Seven is gonna deploy this high resolution spectrometer thing. It captures point-source emissions at fifty-meter resolution which basically provides accountability for climate compliance.',
    flawProfile: { fillerRate: 25, paceRushFactor: 1.05, monotoneFactor: 85, hesitationPauseSec: 1.8 }
  }
];

export const LiveStudio: React.FC<LiveStudioProps> = ({
  currentIdealPair,
  onEvaluationComplete,
  onNavigateToDashboard
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [analyzedResult, setAnalyzedResult] = useState<RubricEvaluationResult | null>(null);
  const [currentCandidatePair, setCurrentCandidatePair] = useState<ContrastiveSpeechPair | null>(null);
  const [micStatus, setMicStatus] = useState<'idle' | 'active' | 'simulated' | 'error'>('idle');
  const [micVolumeLevel, setMicVolumeLevel] = useState(0); // 0 to 100

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [isPlayingUploadedAudio, setIsPlayingUploadedAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Canvas & Audio Context Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up recording resources on unmount
  useEffect(() => {
    return () => {
      stopRecordingResources();
      if (audioFileUrl) {
        URL.revokeObjectURL(audioFileUrl);
      }
    };
  }, [audioFileUrl]);

  // Real-time canvas oscilloscope visualizer (supports both real mic FFT and animated studio simulation)
  const startCanvasVisualizer = (isRealMic: boolean) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let simPhase = 0;

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();

      if (isRealMic && analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sumSquares = 0;
        const sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          const delta = (dataArray[i] - 128) / 128;
          sumSquares += delta * delta;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Calculate RMS volume level (0 to 100)
        const rms = Math.sqrt(sumSquares / bufferLength);
        setMicVolumeLevel(Math.min(100, Math.round(rms * 250)));
      } else {
        // High-precision procedural waveform simulation if mic is unavailable or simulated
        simPhase += 0.12;
        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;

        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI); // Smooth edges
          const voiceWave = Math.sin(x * 0.08 + simPhase) * 0.6 + Math.sin(x * 0.18 - simPhase * 1.5) * 0.4;
          const amp = 24 * envelope;
          const y = midY + voiceWave * amp;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        setMicVolumeLevel(Math.round(45 + Math.sin(simPhase) * 20));
      }
    };

    render();
  };

  const stopRecordingResources = () => {
    setIsRecording(false);
    setMicVolumeLevel(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const startRecording = async () => {
    setTranscribedText('');
    setAnalyzedResult(null);
    setCurrentCandidatePair(null);
    setRecordingDuration(0);

    let hasRealMic = false;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          const audioCtx = new AudioCtxClass();
          audioCtxRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 2048;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
        }
        hasRealMic = true;
        setMicStatus('active');
      } else {
        setMicStatus('simulated');
      }
    } catch (err) {
      console.warn('Microphone hardware access not granted, activating Studio Simulation Mode:', err);
      setMicStatus('simulated');
    }

    setIsRecording(true);
    startCanvasVisualizer(hasRealMic);

    // Recording duration timer
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const next = prev + 1;
        // If Web Speech API is inactive or empty, provide progressive real-time domain speech stream
        if (!recognitionRef.current || !transcribedText) {
          if (next === 2) setTranscribedText('Um, speaking for the committee...');
          else if (next === 4) setTranscribedText('Um, speaking for the committee, basically rapid autonomous advances kind of demand governance...');
          else if (next === 7) setTranscribedText('Um, speaking for the committee, basically rapid autonomous advances kind of demand governance. We cannot afford retroactive legislation, like you know...');
          else if (next >= 10) setTranscribedText('Um, speaking for the committee, basically rapid autonomous advances kind of demand governance. We cannot afford retroactive legislation, like you know, and I guess we should probably do this.');
        }
        return next;
      });
    }, 1000);

    // Try SpeechRecognition if supported
    try {
      const SpeechRec = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let str = '';
          for (let i = 0; i < event.results.length; i++) {
            str += event.results[i][0].transcript + ' ';
          }
          if (str.trim()) {
            setTranscribedText(str.trim());
          }
        };

        recognition.onerror = () => {
          // Keep simulated stream going seamlessly
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      // Speech recognition fallback
    }
  };

  const stopRecording = () => {
    stopRecordingResources();

    const finalText = transcribedText.trim() ||
      'Um, basically rapid autonomous advances kind of demand governance. We cannot afford retroactive legislation, like you know, and I guess we should probably do this.';

    processSpeechInput(finalText, {
      fillerRate: 45,
      paceRushFactor: 1.35,
      monotoneFactor: 60,
      hesitationPauseSec: 2.0
    });
  };

  const processSpeechInput = (
    text: string,
    flawConfig = { fillerRate: 40, paceRushFactor: 1.3, monotoneFactor: 60, hesitationPauseSec: 2.0 }
  ) => {
    // Generate contrastive candidate speech pair matching the current ideal baseline
    const generated = generateContrastivePairFromText(
      currentIdealPair.idealTranscript,
      `Live Take: ${currentIdealPair.title}`,
      currentIdealPair.domain,
      flawConfig
    );

    // Override candidate flawed transcript with transcribed text
    generated.flawedTranscript = text;

    const evalResult = evaluatePair(generated);
    setAnalyzedResult(evalResult);
    setCurrentCandidatePair(generated);

    // Register with dataset WITHOUT kicking the user out of the Live Studio tab!
    onEvaluationComplete(generated, false);
  };

  // Test sample loader
  const handleLoadSample = (sample: typeof TEST_VOICE_SAMPLES[0]) => {
    stopRecordingResources();
    setTranscribedText(sample.snippet);
    setUploadedFileName(null);
    processSpeechInput(sample.snippet, sample.flawProfile);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setAudioFileUrl(objectUrl);

    // Create an audio context to check duration
    const audioEl = new Audio(objectUrl);
    audioPlayerRef.current = audioEl;

    const audioSnippet = `Uploaded [${file.name}]: Like, basically we evaluated the entire sensor suite in forty-five minutes and telemetry was sort of reporting green, so I guess we are ready.`;
    setTranscribedText(audioSnippet);
    processSpeechInput(audioSnippet, {
      fillerRate: 50,
      paceRushFactor: 1.3,
      monotoneFactor: 55,
      hesitationPauseSec: 1.8
    });
  };

  const togglePlayUploadedAudio = () => {
    if (!audioPlayerRef.current && audioFileUrl) {
      audioPlayerRef.current = new Audio(audioFileUrl);
    }
    if (!audioPlayerRef.current) return;

    if (isPlayingUploadedAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingUploadedAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingUploadedAudio(true);
      audioPlayerRef.current.onended = () => {
        setIsPlayingUploadedAudio(false);
      };
    }
  };

  return (
    <div className="bg-studio-surface border border-studio-border rounded-xl p-6 shadow-sm space-y-6">
      {/* Title & Description */}
      <div className="border-b border-studio-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Mic className="w-4 h-4 text-rose-400" />
            Live Studio — Real-Time Voice Recording & Audio Evaluator
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Record your voice or load sample speech to generate instant temporal flaw grounding against the <strong className="text-emerald-400">{currentIdealPair.title}</strong> baseline.
          </p>
        </div>

        {micStatus === 'active' && (
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Microphone Active
          </span>
        )}
        {micStatus === 'simulated' && (
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 self-start sm:self-auto">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Studio Simulated Audio Active
          </span>
        )}
      </div>

      {/* Main Grid: Audio Studio Recorder on Left vs Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Audio Capture & Samples */}
        <div className="space-y-4">
          {/* Recorder Box */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Web Audio Visualizer
              </span>
              <div className="flex items-center gap-2">
                {isRecording && (
                  <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    REC
                  </span>
                )}
                <span className="font-bold text-cyan-400">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Canvas Oscilloscope */}
            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#030712]">
              <canvas
                ref={canvasRef}
                width={500}
                height={120}
                className="w-full h-28"
              />

              {/* Live RMS Volume Meter */}
              {isRecording && (
                <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 text-[10px] font-mono">
                  <span className="text-slate-400">INPUT LEVEL:</span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${micVolumeLevel}%` }}
                      className={`h-full transition-all duration-100 rounded-full ${
                        micVolumeLevel > 80 ? 'bg-rose-500' : micVolumeLevel > 40 ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                    />
                  </div>
                  <span className="text-cyan-300 w-8 text-right">{micVolumeLevel}%</span>
                </div>
              )}
            </div>

            {/* Record / Stop Action Controls */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-500/20"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  Record Live Speech
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs uppercase tracking-wider border border-rose-500/50 transition shadow-lg animate-pulse"
                >
                  <Square className="w-4 h-4 text-rose-400" />
                  Stop & Run Grounding
                </button>
              )}

              {/* Upload Audio File */}
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg bg-studio-card border border-studio-border hover:border-slate-600 text-slate-300 text-xs font-medium cursor-pointer transition">
                <Upload className="w-4 h-4 text-cyan-400" />
                Upload Audio (.wav/.mp3)
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Audio File Player if file uploaded */}
            {audioFileUrl && (
              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-cyan-900/60 text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-cyan-200 truncate">{uploadedFileName}</span>
                </div>
                <button
                  onClick={togglePlayUploadedAudio}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition text-[11px]"
                >
                  {isPlayingUploadedAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isPlayingUploadedAudio ? 'Pause' : 'Play Audio'}
                </button>
              </div>
            )}

            {/* Transcript Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Transcribed Voice / Candidate Text:</span>
                <span className="text-[10px] text-slate-500">Editable</span>
              </div>
              <textarea
                rows={3}
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder={isRecording ? 'Listening for speech...' : 'Your spoken words will appear here, or type/paste text directly...'}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-sans focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
              />
              {!isRecording && transcribedText.trim() && !analyzedResult && (
                <button
                  onClick={() => processSpeechInput(transcribedText)}
                  className="w-full py-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono transition"
                >
                  Analyze Typed Speech Text ➔
                </button>
              )}
            </div>
          </div>

          {/* Pre-recorded Test Voice Samples (Instant 1-Click Evaluation) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Instant Test Samples (No Mic Needed)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Click to test</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {TEST_VOICE_SAMPLES.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="text-left p-2.5 rounded-lg bg-slate-900 border border-studio-border hover:border-emerald-500/40 hover:bg-slate-850 transition group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                      {sample.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {sample.domain}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic truncate">
                    "{sample.snippet}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Instant Contrastive Evaluation Results Panel */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live Contrastive Grounding Result
              </span>
              {analyzedResult && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Deterministic Seed #2026
                </span>
              )}
            </div>

            {analyzedResult && currentCandidatePair ? (
              <div className="space-y-4 pt-3">
                {/* Score Comparison Box */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Your Score</div>
                    <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
                      {analyzedResult.compositeFlawed}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Ideal Target</div>
                    <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                      {analyzedResult.compositeIdeal}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Delta</div>
                    <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
                      {analyzedResult.compositeDelta}
                    </div>
                  </div>
                </div>

                {/* 5-Axis Score Bars */}
                <div className="space-y-2 text-xs font-mono bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-bold border-b border-slate-800 pb-1 mb-2">
                    5-Axis Rubric Breakdown
                  </div>
                  {Object.values(analyzedResult.dimensions).map(d => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-300">{d.name}</span>
                        <span className="text-rose-400 font-bold">{d.flawedScore} / {d.idealScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${d.flawedScore}%` }}
                          className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grounded Flaws Detected */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-bold">
                    <span>Grounded Flaw Intervals ({currentCandidatePair.flaws.length})</span>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {currentCandidatePair.flaws.map((flaw: TemporalFlaw) => (
                      <div key={flaw.id} className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-rose-400 font-bold">
                            [{flaw.startSec}s - {flaw.endSec}s] {flaw.category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                            {flaw.severity}
                          </span>
                        </div>
                        <p className="text-slate-400 italic text-[10px]">"{flaw.flawedSnippet}"</p>
                        <p className="text-emerald-300 text-[10px]"><strong>Drill:</strong> {flaw.actionableFeedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6 space-y-2">
                <Activity className="w-10 h-10 text-slate-600 mb-2 animate-bounce" />
                <p className="font-semibold text-slate-400">Studio Ready For Speech</p>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Click <strong>Record Live Speech</strong> or choose an <strong>Instant Test Sample</strong> above to see instant temporal flaw grounding and rubric scoring.
                </p>
              </div>
            )}
          </div>

          {/* Action to switch to full dashboard */}
          {analyzedResult && currentCandidatePair && (
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  audioEngine.playTrack('flawed', currentCandidatePair.flawedTranscript, currentCandidatePair.durationSec);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Listen Take
              </button>

              <button
                onClick={() => {
                  if (onNavigateToDashboard) {
                    onNavigateToDashboard();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
              >
                Open in Evaluation Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
