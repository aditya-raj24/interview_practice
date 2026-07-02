import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Mic, MicOff, Volume2, Loader2, Play, AlertCircle, CheckCircle, ArrowRight, ShieldAlert, Award, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface EvaluationResult {
  score: number;
  grammarCorrections: string[];
  vocabularyImprovements: string[];
  feedbackText: string;
  betterPhrasing: string;
}

interface QuestionAnswerState {
  transcript: string;
  evaluation: EvaluationResult | null;
}

export default function EnglishCoach() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store transcripts and evaluations for all 10 questions
  const [answers, setAnswers] = useState<Record<number, QuestionAnswerState>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);

  const topicsList = [
    "Describe a technical project you worked on recently and the main challenges you overcame.",
    "Explain the concept of Object-Oriented Programming (OOP) to a non-technical manager.",
    "Why are you interested in joining our company, and what unique value do you bring?",
    "Describe a time you had a disagreement with a team member. How did you resolve it?",
    "How do you prioritize your tasks when handling multiple deadlines on a project?",
    "Tell me about a time you failed or made a mistake. What did you learn from it?",
    "How do you explain complex technical details to customers or non-technical stakeholders?",
    "What is your approach to learning new technologies or programming languages?",
    "Describe a situation where you had to work under tight constraints or pressure.",
    "Where do you see yourself professionally in the next five years, and how will this role help you get there?"
  ];

  const activeTopic = topicsList[currentQuestionIdx];

  const handleStartSession = () => {
    setIsSessionActive(true);
    setCurrentQuestionIdx(0);
    setTranscript("");
    setAnswers({});
    setShowSummary(false);
    setExpandedIndex(null);
    setError(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleListenPrompt = () => {
    if ("speechSynthesis" in window) {
      if (isSpeakingPrompt) {
        window.speechSynthesis.cancel();
        setIsSpeakingPrompt(false);
        return;
      }
      setIsSpeakingPrompt(true);
      const utterance = new SpeechSynthesisUtterance(activeTopic);
      utterance.onend = () => setIsSpeakingPrompt(false);
      utterance.onerror = () => setIsSpeakingPrompt(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + " " + finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setError(`Speech recognition issue: ${event.error}`);
          stopSpeechRecognition();
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      setError(err.message || "Failed to start speech recognition.");
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleEvaluateAndNext = async () => {
    if (!transcript.trim() || transcript.trim().split(/\s+/).length < 3) {
      setError("Please speak or write a response (at least 3 words) to submit.");
      return;
    }

    setIsEvaluating(true);
    setError(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingPrompt(false);
    }

    try {
      const response = await fetch("/api/evaluate-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTopic,
          userSpeechText: transcript.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact evaluation engine.");
      }

      const evalData = await response.json();
      
      const newAnswers = {
        ...answers,
        [currentQuestionIdx]: {
          transcript: transcript.trim(),
          evaluation: evalData
        }
      };
      setAnswers(newAnswers);

      // Move to next question or show summary
      if (currentQuestionIdx < topicsList.length - 1) {
        setCurrentQuestionIdx((prev) => prev + 1);
        setTranscript("");
      } else {
        setShowSummary(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze speech. Please check backend.");
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Calculate final performance stats
  const scoreList = Object.values(answers).map((a: any) => a.evaluation?.score || 0);
  const averageScore = scoreList.length > 0 
    ? Math.round(scoreList.reduce((acc, score) => acc + score, 0) / scoreList.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in" id="english-coach-view">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-pink-400" /> AI English Communication Coach
        </h2>
        <p className="text-xs text-gray-400 font-medium">
          Engage in a full 10-question sequential interview. The AI reads prompts, listens to your verbal responses, transcribes them, and gives detailed grammatical feedback to prepare you for actual communication checks.
        </p>
      </div>

      {!isSessionActive ? (
        /* Welcome/Start screen */
        <div className="glass-panel p-8 rounded-2xl text-center max-w-2xl mx-auto space-y-6 py-12">
          <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto">
            <Volume2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">English Fluency Drill</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              This drill guides you through 10 verbal technical and behavioral questions back-to-back. Answer each aloud, get analyzed on correct word choices, grammar, and pronunciation confidence, and receive a comprehensive communication report at the end.
            </p>
          </div>
          <button
            onClick={handleStartSession}
            className="px-8 py-3 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-600/20 active:scale-[0.98] transition cursor-pointer"
          >
            Start 10-Question Drill
          </button>
        </div>
      ) : showSummary ? (
        /* Summary Report screen */
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg font-bold text-white">Fluency Drill Completed</h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Excellent job completing all 10 questions. Review your proficiency metrics, grammatical corrections, and model vocabulary re-phrasings below.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Average Fluency</span>
                <span className="text-4xl font-extrabold text-pink-400 font-mono tracking-tight glow-text-pink">
                  {averageScore}%
                </span>
              </div>
              <div className="h-10 w-px bg-slate-800"></div>
              <button
                onClick={handleStartSession}
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restart Drill
              </button>
            </div>
          </div>

          {/* Drill detail list */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h4 className="font-bold text-white text-sm border-b border-slate-800/60 pb-3">Detailed Session Review</h4>
            <div className="space-y-3">
              {topicsList.map((topicItem, idx) => {
                const isExpanded = expandedIndex === idx;
                const answerObj = answers[idx];
                const evalObj = answerObj?.evaluation;

                return (
                  <div key={idx} className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20">
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-900/40 transition cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-pink-400 font-bold bg-pink-500/10 px-2 py-0.5 rounded uppercase">
                          Question {idx + 1}
                        </span>
                        <p className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">{topicItem}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-pink-400 font-mono">
                          Score: {evalObj?.score || 0}%
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800 bg-[#0F1115]/30 space-y-4 animate-fade-in text-xs">
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Your Speech Transcript</h5>
                          <p className="text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-sans leading-relaxed">
                            "{answerObj?.transcript}"
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <h5 className="font-bold text-red-400 uppercase text-[9px] tracking-wider flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Grammatical Issues
                            </h5>
                            {evalObj?.grammarCorrections && evalObj.grammarCorrections.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300 leading-relaxed">
                                {evalObj.grammarCorrections.map((itm, i) => <li key={i}>{itm}</li>)}
                              </ul>
                            ) : (
                              <p className="text-emerald-400 italic font-medium">Perfect grammar!</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <h5 className="font-bold text-amber-400 uppercase text-[9px] tracking-wider flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" /> Vocabulary upgrades
                            </h5>
                            {evalObj?.vocabularyImprovements && evalObj.vocabularyImprovements.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300 leading-relaxed">
                                {evalObj.vocabularyImprovements.map((itm, i) => <li key={i}>{itm}</li>)}
                              </ul>
                            ) : (
                              <p className="text-slate-500 italic">No specific vocabulary upgrades suggested.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
                          <h5 className="font-bold text-pink-400 uppercase text-[9px] tracking-wider">Polished AI Re-phrasing</h5>
                          <p className="text-slate-300 italic bg-slate-900/50 p-3 rounded-lg border border-pink-500/10 leading-relaxed">
                            "{evalObj?.betterPhrasing}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Active session view */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Active Question Box */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-pink-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono bg-slate-800 text-pink-300 px-2.5 py-0.5 rounded uppercase font-bold">
                  Question {currentQuestionIdx + 1} of 10
                </span>
                <button
                  onClick={handleStartSession}
                  className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel Drill
                </button>
              </div>
              <h3 className="text-base font-bold text-white leading-relaxed">{activeTopic}</h3>
              
              <div className="mt-4 pt-4 border-t border-slate-800/60">
                <button
                  onClick={handleListenPrompt}
                  className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-semibold transition cursor-pointer"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeakingPrompt ? "animate-pulse" : ""}`} />
                  {isSpeakingPrompt ? "Stop Speaking" : "Hear Recruiter Voice Prompt"}
                </button>
              </div>
            </div>

            {/* Speaking workspace */}
            <div className="glass-panel p-6 rounded-2xl space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-sm">Real-time Speaking Console</h3>
                {isListening && (
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider">Listening</span>
                  </div>
                )}
              </div>

              <textarea
                className="w-full h-44 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-pink-500/50 p-4 text-xs font-sans text-slate-200 placeholder-slate-600 focus:outline-none resize-none transition"
                placeholder="Click 'Start Speaking' and state your response, or type directly..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={isEvaluating}
              />

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-4">
                {!isListening ? (
                  <button
                    onClick={startSpeechRecognition}
                    disabled={isEvaluating}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-pink-400" /> Start Speaking
                  </button>
                ) : (
                  <button
                    onClick={stopSpeechRecognition}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <MicOff className="w-4 h-4" /> Stop Speaking
                  </button>
                )}

                <button
                  onClick={handleEvaluateAndNext}
                  disabled={isEvaluating || isListening || !transcript.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-pink-500 text-white font-bold text-xs rounded-xl hover:from-pink-500 hover:to-pink-400 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 shadow-lg shadow-pink-600/10 transition cursor-pointer"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Evaluating Speech...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-current" /> 
                      {currentQuestionIdx === topicsList.length - 1 ? "Evaluate & Finish Drill" : "Evaluate & Next Question"} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar current feedback */}
          <div className="col-span-1 space-y-6">
            {currentQuestionIdx > 0 && answers[currentQuestionIdx - 1] ? (
              <div className="space-y-6 animate-fade-in" id="current-question-feedback">
                <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl"></div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Last Question score</h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-pink-400 font-mono tracking-tight">
                      {answers[currentQuestionIdx - 1].evaluation?.score}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Fluency Score</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {answers[currentQuestionIdx - 1].evaluation?.feedbackText}
                  </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest">Better Phrasing Tip</h4>
                  <p className="text-xs text-slate-300 italic bg-slate-900/40 p-3 rounded-xl border border-pink-500/10 leading-relaxed leading-normal">
                    "{answers[currentQuestionIdx - 1].evaluation?.betterPhrasing}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl text-center py-16 text-slate-500 flex flex-col items-center justify-center space-y-3">
                <div className="p-3.5 rounded-full bg-slate-900 text-pink-400">
                  <Volume2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-white text-sm">Speech Tracking</h4>
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Real-time grammar analysis, vocabulary improvements, and correct formatting tips will be displayed here for each question after you submit.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
