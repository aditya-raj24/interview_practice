import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  ArrowLeft, 
  BookOpen, 
  ShieldAlert, 
  MessageSquareCode, 
  ThumbsUp, 
  ThumbsDown,
  HelpCircle,
  HelpCircle as HintIcon,
  RotateCcw,
  Plus,
  Video
} from "lucide-react";
import { Question, InterviewSession, UserAnswer, AnswerAnalysis, SessionScore } from "../types";

interface InterviewArenaProps {
  session: InterviewSession;
  onUpdateSession: (updated: InterviewSession) => void;
  onBackToDashboard: () => void;
}

export default function InterviewArena({ session, onUpdateSession, onBackToDashboard }: InterviewArenaProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(session.currentQuestionIndex);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [codeAnswer, setCodeAnswer] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [feedMode, setFeedMode] = useState<"audio" | "video">("audio");
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  
  // Audio/Video context & WebRTC variables
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState<number[]>([10, 20, 10, 30, 20, 40, 15, 35, 10, 20]);
  const levelIntervalRef = useRef<number | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Analysis / Feedback state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const currentQuestion = session.questions[currentQuestionIdx];

  // Clean up timers and streams on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopAudioVisualizer();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update response input when index changes
  useEffect(() => {
    const existingAnswer = session.answers[currentQuestion.id];
    if (existingAnswer) {
      setTypedAnswer(existingAnswer.text);
      setRecordedAudioUrl(existingAnswer.audioUrl || null);
      setAudioDuration(existingAnswer.audioDuration || 0);
      setCodeAnswer(existingAnswer.code || "");
      setSelectedLanguage(existingAnswer.codeLanguage || "cpp");
    } else {
      setTypedAnswer("");
      setRecordedAudioUrl(null);
      setAudioDuration(0);
      setCodeAnswer("");
      setSelectedLanguage("cpp");
    }
    setShowHint(false);
    setAnalysisError(null);
  }, [currentQuestionIdx, session]);

  // Audio timer functions
  const startTimer = () => {
    setAudioDuration(0);
    timerIntervalRef.current = window.setInterval(() => {
      setAudioDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Simulated live audio wave level visualizer
  const startAudioVisualizer = () => {
    levelIntervalRef.current = window.setInterval(() => {
      setAudioLevel(
        Array.from({ length: 14 }, () => Math.floor(Math.random() * 50) + 5)
      );
    }, 120);
  };

  const stopAudioVisualizer = () => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    setAudioLevel([10, 15, 12, 10, 8, 14, 10, 12, 11, 10]);
  };

  // Start audio/video recorder
  const handleStartRecording = async () => {
    try {
      audioChunksRef.current = [];
      const constraints = feedMode === "video" 
        ? { audio: true, video: { width: 640, height: 480 } }
        : { audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      // Determine mimetype
      const options = feedMode === "video"
        ? { mimeType: "video/webm;codecs=vp9,opus" }
        : { mimeType: "audio/webm" };
        
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = feedMode === "video" ? "video/webm" : "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        if (feedMode === "video") {
          setRecordedVideoUrl(url);
          setRecordedAudioUrl(null);
        } else {
          setRecordedAudioUrl(url);
          setRecordedVideoUrl(null);
        }
        
        stream.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
      
      if (feedMode === "audio") {
        startAudioVisualizer();
      } else {
        // Feed video source to live preview element
        setTimeout(() => {
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        }, 50);
      }
    } catch (err) {
      console.warn("Media access denied or not supported in this context. Falling back to mock recording.");
      setIsRecording(true);
      startTimer();
      if (feedMode === "audio") {
        startAudioVisualizer();
      }
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    stopTimer();
    stopAudioVisualizer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      // Mock recording fallback URLs
      if (feedMode === "video") {
        setRecordedVideoUrl("mock-video-placeholder");
        setRecordedAudioUrl(null);
      } else {
        setRecordedAudioUrl("mock-audio-placeholder");
        setRecordedVideoUrl(null);
      }
    }
  };

  // AI evaluation trigger for current response
  const handleEvaluateAnswer = async () => {
    const hasConceptAnswer = typedAnswer && typedAnswer.trim().length >= 15;
    const hasCodeAnswer = codeAnswer && codeAnswer.trim().length >= 10;
    
    if (!hasConceptAnswer && !hasCodeAnswer) {
      setAnalysisError("Your answer is too short. Please write an explanation (at least 15 chars) or a code solution (at least 10 chars) for feedback.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    const combinedAnswerText = codeAnswer
      ? `${typedAnswer}\n\n[Candidate Code (${selectedLanguage})]:\n${codeAnswer}`
      : typedAnswer;

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: currentQuestion.text,
          category: currentQuestion.category,
          userAnswerText: combinedAnswerText,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact AI analysis engine. Ensure you provided a valid GEMINI_API_KEY.");
      }

      const rawAnalysis = await response.json();

      // Enriched linguistic analyzer for filler words & speaking pacing
      const fillerWordCount = {
        um: (typedAnswer.match(/\bum\b/gi) || []).length + (typedAnswer.match(/\buh\b/gi) || []).length,
        like: (typedAnswer.match(/\blike\b/gi) || []).length,
        basically: (typedAnswer.match(/\bbasically\b/gi) || []).length,
        uh: (typedAnswer.match(/\buh\b/gi) || []).length,
        youKnow: (typedAnswer.match(/\byou know\b/gi) || []).length,
      };

      const wordCount = typedAnswer.trim().split(/\s+/).length;
      // Estimate pace in WPM based on typing duration or a healthy default 135 wpm
      const durationMin = audioDuration > 0 ? audioDuration / 60 : wordCount / 135;
      const paceWpm = Math.round(wordCount / (durationMin || 0.5)) || 120;

      const fullAnalysis: AnswerAnalysis = {
        score: rawAnalysis.score || 75,
        strengths: rawAnalysis.strengths || ["Covers direct concept fundamentals."],
        weaknesses: rawAnalysis.weaknesses || ["Could elaborate with specific software applications."],
        fillerWordCount,
        paceWpm,
        feedbackText: rawAnalysis.feedbackText || "Good attempt. Add deep-dive patterns to make it exceptional.",
        keyPointsCovered: rawAnalysis.keyPointsCovered || [],
        keyPointsMissing: rawAnalysis.keyPointsMissing || [],
        betterPhrasing: rawAnalysis.betterPhrasing || typedAnswer,
      };

      const updatedAnswers = {
        ...session.answers,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          text: typedAnswer,
          code: codeAnswer || undefined,
          codeLanguage: codeAnswer ? selectedLanguage : undefined,
          audioUrl: recordedAudioUrl || undefined,
          videoUrl: recordedVideoUrl || undefined,
          audioDuration: audioDuration || undefined,
          analysis: fullAnalysis,
        },
      };

      const updatedSession: InterviewSession = {
        ...session,
        answers: updatedAnswers,
        currentQuestionIndex: currentQuestionIdx,
      };

      onUpdateSession(updatedSession);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Something went wrong evaluating your response.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Finish session, consolidate scores
  const handleFinishInterview = () => {
    const answeredCount = Object.keys(session.answers).length;
    if (answeredCount === 0) {
      onBackToDashboard();
      return;
    }

    // Consolidated overall rating calculations
    const scoreValues = Object.values(session.answers)
      .map(ans => ans.analysis?.score || 70);
    const averageScore = Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length);

    // Formulate a structured performance package
    const finalScore: SessionScore = {
      overall: averageScore,
      technical: Math.min(100, Math.round(averageScore * 1.02)),
      communication: Math.min(100, Math.round(averageScore * 0.98)),
      relevance: Math.min(100, Math.round(averageScore * 1.01)),
      confidence: Math.min(100, Math.round(averageScore * 0.95)),
    };

    const finalSession: InterviewSession = {
      ...session,
      isCompleted: true,
      score: finalScore,
    };

    onUpdateSession(finalSession);
  };

  const saveDraftState = () => {
    const existing = session.answers[currentQuestion.id];
    if (
      typedAnswer !== (existing?.text || "") ||
      codeAnswer !== (existing?.code || "") ||
      recordedAudioUrl !== (existing?.audioUrl || null) ||
      recordedVideoUrl !== (existing?.videoUrl || null)
    ) {
      const updatedAnswers = {
        ...session.answers,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          text: typedAnswer,
          code: codeAnswer || undefined,
          codeLanguage: codeAnswer ? selectedLanguage : undefined,
          audioUrl: recordedAudioUrl || undefined,
          videoUrl: recordedVideoUrl || undefined,
          audioDuration: audioDuration || undefined,
          analysis: existing?.analysis,
        },
      };

      onUpdateSession({
        ...session,
        answers: updatedAnswers,
        currentQuestionIndex: currentQuestionIdx,
      });
    }
  };

  const handleNext = () => {
    saveDraftState();
    if (currentQuestionIdx < session.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    saveDraftState();
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const currentAnswer = session.answers[currentQuestion.id];
  const hasEvaluated = !!currentAnswer?.analysis;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="interview-arena">
      {/* Session Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <button 
            onClick={onBackToDashboard}
            className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Terminal Console
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {session.title}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {session.category} Mode
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Current Target Subject: <span className="text-indigo-300 font-semibold">{session.jobRole}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Question Progress</span>
            <span className="text-sm font-semibold text-slate-300">
              {currentQuestionIdx + 1} of {session.questions.length}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <button
            onClick={handleFinishInterview}
            className="px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/15 transition cursor-pointer"
          >
            End & Calculate Placement Metrics
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Question, Recording Tool & Text Response */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          
          {/* Active Question Panel */}
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-indigo-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[11px] font-mono bg-slate-800 text-indigo-300 px-2 py-0.5 rounded uppercase font-bold">
                Question {currentQuestionIdx + 1}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Difficulty: <b className="text-indigo-400">{currentQuestion.difficulty}</b>
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-3.5 leading-relaxed">
              {currentQuestion.text}
            </h3>

            {/* Hint Toggler */}
            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  <HintIcon className="w-3.5 h-3.5" />
                  {showHint ? "Hide Recruiter Hint" : "Reveal Recruiter Hint"}
                </button>
                {showHint && (
                  <div className="mt-2.5 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300 leading-relaxed font-sans italic">
                    💡 Hint: {currentQuestion.hints[0]}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Voice Response / Recording Section */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Response Workspace</h3>
              
              {/* Webcam vs Voice Toggler */}
              <div className="flex gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFeedMode("audio")}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition tracking-wider cursor-pointer ${
                    feedMode === "audio"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  disabled={isRecording}
                >
                  Voice Only
                </button>
                <button
                  type="button"
                  onClick={() => setFeedMode("video")}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition tracking-wider cursor-pointer ${
                    feedMode === "video"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  disabled={isRecording}
                >
                  Webcam Feed
                </button>
              </div>
            </div>

            {/* Live Video Recording Preview Gutter */}
            {isRecording && feedMode === "video" && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video max-w-sm w-full mx-auto shadow-xl">
                <video 
                  ref={videoPreviewRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
                <div className="absolute top-3 left-3 bg-red-600 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-white flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span> LIVE WEBCAM REC
                </div>
                <div className="absolute bottom-3 right-3 bg-slate-900/80 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300">
                  Duration: {formatTime(audioDuration)}
                </div>
              </div>
            )}

            {/* Audio Wave Visualizer Simulation during live recording */}
            {isRecording && feedMode === "audio" ? (
              <div className="h-16 bg-slate-900/60 rounded-xl border border-red-500/10 flex items-center justify-center gap-1.5 px-6">
                {audioLevel.map((lvl, index) => (
                  <div
                    key={index}
                    className="w-1.5 bg-indigo-500 rounded-full transition-all duration-100"
                    style={{ height: `${lvl}%` }}
                  ></div>
                ))}
              </div>
            ) : null}

            {/* Recorded Video Playback Player */}
            {!isRecording && recordedVideoUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 bg-slate-950 aspect-video max-w-sm w-full mx-auto shadow-xl animate-fade-in">
                {recordedVideoUrl !== "mock-video-placeholder" ? (
                  <video 
                    src={recordedVideoUrl} 
                    controls 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-indigo-950/20">
                    <Video className="w-8 h-8 text-indigo-400/60 mb-2 animate-pulse" />
                    <span className="text-xs font-semibold text-white">Recorded Video Track Ready</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 font-mono">Mock Webcam Session Saved • {formatTime(audioDuration || 15)}</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setRecordedVideoUrl(null);
                    setAudioDuration(0);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-white transition"
                  title="Clear Video"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Recorded Speech Response Playback */}
            {!isRecording && recordedAudioUrl && feedMode === "audio" && (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-indigo-500/15 text-indigo-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Recorded Speech Response</span>
                    <span className="text-[10px] text-slate-400 font-mono">Recorded Duration: {formatTime(audioDuration || 15)}</span>
                  </div>
                </div>

                {/* HTML5 Audio Playback element */}
                <div className="flex items-center gap-2">
                  {recordedAudioUrl !== "mock-audio-placeholder" ? (
                    <audio src={recordedAudioUrl} controls className="h-8 max-w-[200px]" />
                  ) : (
                    <span className="text-[11px] text-emerald-400 italic font-medium">Recorded Track Ready</span>
                  )}
                  <button
                    onClick={() => {
                      setRecordedAudioUrl(null);
                      setAudioDuration(0);
                    }}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Clear Recording"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab/spaces handler inside editor */}
            {/* Answer Input and Code Editor split workspace */}
            <div className={`grid grid-cols-1 ${currentQuestion.category === "DSA" ? "lg:grid-cols-2" : ""} gap-6`}>
              
              {/* Left Side: Concept Explanation */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Concept Explanation</h4>
                  <span className="text-[10px] text-slate-500">Describe your algorithm / logic</span>
                </div>
                <textarea
                  className="w-full h-72 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 p-4 text-xs font-sans text-slate-200 placeholder-slate-600 focus:outline-none resize-none transition"
                  placeholder="Explain your approach here (e.g. hash map, two pointers, time complexity)..."
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  disabled={isAnalyzing}
                />
                <div className="text-[11px] text-slate-500 text-right">
                  Word Count: {typedAnswer.trim() ? typedAnswer.trim().split(/\s+/).length : 0}
                </div>
              </div>

              {/* Right Side: DSA Code Editor Workspace */}
              {currentQuestion.category === "DSA" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Code Editor</h4>
                    
                    {/* Language Selector Dropdown */}
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-indigo-400 font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                      disabled={isAnalyzing}
                    >
                      <option value="cpp">C++ (GCC)</option>
                      <option value="python">Python 3</option>
                      <option value="java">Java 17</option>
                      <option value="javascript">JavaScript (ES6)</option>
                    </select>
                  </div>

                  {/* IDE-like text area with line numbers */}
                  <div className="flex font-mono text-xs bg-slate-950 rounded-xl border border-slate-800 overflow-hidden h-72">
                    {/* Line numbers gutter */}
                    <div className="w-10 bg-slate-900/60 border-r border-slate-800/80 text-slate-600 text-right pr-2 py-3 select-none font-mono">
                      {Array.from({ length: Math.max(1, codeAnswer.split("\n").length) }, (_, i) => i + 1).map(num => (
                        <div key={num} className="leading-5 h-5">{num}</div>
                      ))}
                    </div>
                    {/* Editor text area */}
                    <textarea
                      className="flex-1 bg-transparent p-3 text-indigo-300 placeholder-slate-700 focus:outline-none resize-none overflow-y-auto leading-5 h-full font-mono outline-none"
                      value={codeAnswer}
                      onChange={(e) => setCodeAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          e.preventDefault();
                          const textarea = e.currentTarget;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const val = textarea.value;
                          const newVal = val.substring(0, start) + "    " + val.substring(end);
                          setCodeAnswer(newVal);
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + 4;
                          }, 0);
                        }
                      }}
                      placeholder={`// Write your ${selectedLanguage} solution here...`}
                      spellCheck={false}
                      disabled={isAnalyzing}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 text-right font-mono">
                    Lines: {codeAnswer.split("\n").length} | Char count: {codeAnswer.length}
                  </div>
                </div>
              )}

            </div>

            {/* Controls Bar */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" /> Record Voice response
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition animate-pulse cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" /> Stop Voice Recording
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleEvaluateAnswer}
                  disabled={isAnalyzing || !typedAnswer.trim()}
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Analyzing Response...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Evaluate with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {analysisError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}
          </div>

          {/* Navigation controls */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentQuestionIdx === 0}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 rounded-xl transition cursor-pointer"
            >
              Previous Question
            </button>

            <button
              onClick={handleNext}
              disabled={currentQuestionIdx === session.questions.length - 1}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 rounded-xl transition cursor-pointer"
            >
              Next Question
            </button>
          </div>

        </div>

        {/* Right Column: Dynamic Real-time AI Evaluation Panel */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          
          {hasEvaluated ? (
            <div className="space-y-6 animate-fade-in" id="realtime-feedback-panel">
              {/* Score card */}
              <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">AI Grading</h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-emerald-400 font-mono tracking-tight glow-text-emerald">
                    {currentAnswer.analysis?.score}%
                  </span>
                  <span className="text-xs text-slate-500">Placement Match</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-3">
                  {/* Linguistic pacing / words per minute */}
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Linguistic Tempo:</span>
                    <span className="font-semibold text-indigo-400">{currentAnswer.analysis?.paceWpm} WPM</span>
                  </div>

                  {/* Filler words counts */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Filler Word Breakers</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-300 font-mono">
                        "Like": {currentAnswer.analysis?.fillerWordCount.like || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-300 font-mono">
                        "Um/Uh": {currentAnswer.analysis?.fillerWordCount.um || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-300 font-mono">
                        "Basically": {currentAnswer.analysis?.fillerWordCount.basically || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & constructive feedback */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/60 pb-2">Linguistic Insights</h4>
                
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Strengths
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside pl-1 leading-relaxed">
                    {currentAnswer.analysis?.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Gaps & Improvements
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside pl-1 leading-relaxed">
                    {currentAnswer.analysis?.weaknesses.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Better Phrasing Recommendations */}
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Recommended AI Phrasing</h4>
                <p className="text-xs text-slate-300 italic bg-slate-900/40 p-3 rounded-xl border border-indigo-500/10 leading-relaxed font-sans">
                  "{currentAnswer.analysis?.betterPhrasing}"
                </p>
              </div>

              {/* Model Ideal Answers Compare */}
              <div className="glass-panel p-5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Model Recruiter Standard</h4>
                <div className="text-xs text-slate-400 leading-relaxed overflow-y-auto max-h-48 whitespace-pre-line bg-gray-950 p-3 rounded-xl">
                  {currentQuestion.modelAnswer}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl text-center py-12 text-slate-500 flex flex-col items-center justify-center space-y-3">
              <div className="p-3.5 rounded-full bg-slate-900 text-indigo-400">
                <MessageSquareCode className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-white text-sm">Real-Time Evaluation</h4>
              <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                Provide or record your answer, then click <b>Evaluate with AI</b> to receive high-fidelity performance scores, linguistic gaps, and correct terminology suggestions.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
