import React from "react";
import { 
  Trophy, 
  Award, 
  MessageSquareCode, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Volume2, 
  Sparkles, 
  TrendingUp, 
  FileText,
  RotateCcw,
  Star
} from "lucide-react";
import { InterviewSession, Question, UserAnswer } from "../types";

interface PerformanceReportProps {
  session: InterviewSession;
  onBackToDashboard: () => void;
}

export default function PerformanceReport({ session, onBackToDashboard }: PerformanceReportProps) {
  const score = session.score || { overall: 75, technical: 75, communication: 75, relevance: 75, confidence: 75 };

  // Generate specific placement advice based on performance profile
  const getPlacementAdvice = () => {
    if (score.overall >= 85) {
      return {
        level: "Top 5% Candidate (Exceptional Ready)",
        message: "Your conceptual clarity in Subject-Matter (especially structural design, normalizing concepts, and SOLID alignments) is outstanding. Your conversational pacing is highly professional. Focus on doing dummy full-scale architectural builds to cement elite design standard.",
        color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      };
    } else if (score.overall >= 70) {
      return {
        level: "Interview Ready with Minor Adjustments",
        message: "You possess solid foundational definitions but sometimes truncate crucial deep architecture details. Ensure you clearly outline the tradeoff calculations (such as storage latency, object instantiation complexity, memory footprints) in future sessions to climb to the outstanding tier.",
        color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
      };
    } else {
      return {
        level: "Strengthen Technical Terminology",
        message: "We suggest going through core reference manuals on database transaction isolation levels, object encapsulation patterns, and SOLID microservices boundaries. Re-run custom scenario preparation to practice structuring answers cleanly.",
        color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
      };
    }
  };

  const advice = getPlacementAdvice();

  return (
    <div className="space-y-8 animate-fade-in" id="performance-report-view">
      {/* Upper Report Nav */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <button 
            onClick={onBackToDashboard}
            className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Terminal Dashboard
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5.5 h-5.5 text-indigo-400" /> Placement Performance Appraisal
          </h2>
          <p className="text-xs text-slate-400">
            Session Title: <span className="text-slate-200 font-semibold">{session.title}</span> • Targeted Subject: <span className="text-indigo-300 font-semibold">{session.jobRole}</span>
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Return to Console
        </button>
      </div>

      {/* Main Score Appraisal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Scores Circular Summary & Advice Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Score Visual Card */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
            
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-4">Overall Prep Score</span>
            
            {/* Elegant Circular Score Indicator */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-indigo-500"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - score.overall / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold font-mono text-white leading-none">{score.overall}%</span>
                <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-widest mt-1">Placement Score</span>
              </div>
            </div>

            <div className="w-full mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Technical</span>
                <div className="text-lg font-extrabold text-purple-400 font-mono mt-0.5">{score.technical}%</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Linguistic</span>
                <div className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">{score.communication}%</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Relevance</span>
                <div className="text-lg font-extrabold text-pink-400 font-mono mt-0.5">{score.relevance}%</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Confidence</span>
                <div className="text-lg font-extrabold text-indigo-400 font-mono mt-0.5">{score.confidence}%</div>
              </div>
            </div>
          </div>

          {/* AI Recruiter placement advice */}
          <div className={`p-5 rounded-2xl border ${advice.color} space-y-2`}>
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <Award className="w-4.5 h-4.5 shrink-0" />
              <span>Placement Tier: {advice.level}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              {advice.message}
            </p>
          </div>
        </div>

        {/* Detailed Questions Transcripts and Feedback List (Right columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Question Transcripts & Playback Reviews</h3>
            <p className="text-xs text-slate-400">Review detailed transcript logs, voice playbacks, and correct terminology comparisons for each question.</p>

            <div className="space-y-6 divide-y divide-slate-800/80 pt-2">
              {session.questions.map((q, idx) => {
                const answer = session.answers[q.id];
                return (
                  <div key={q.id} className="pt-5 first:pt-0 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 font-mono font-bold w-fit">
                        Q{idx + 1} • {q.category} Subject
                      </span>
                      {answer?.analysis && (
                        <div className="flex gap-4 text-xs font-mono">
                          <span>Grade Score: <b className="text-emerald-400 font-extrabold">{answer.analysis.score}%</b></span>
                          <span>Tempo: <b className="text-indigo-300">{answer.analysis.paceWpm} WPM</b></span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white">
                      {q.text}
                    </p>

                    {/* Candidate answer description */}
                    {answer ? (
                      <div className="space-y-3 pl-3 border-l-2 border-slate-800">
                        {/* Audio track play back section if recorded */}
                        {answer.audioUrl && (
                          <div className="inline-flex items-center gap-3 bg-slate-900/40 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs max-w-sm">
                            <Volume2 className="w-4 h-4 text-indigo-400" />
                            <span className="font-semibold text-slate-300 font-mono text-[11px]">Recorded Voice response Playback:</span>
                            {answer.audioUrl !== "mock-audio-placeholder" ? (
                              <audio src={answer.audioUrl} controls className="h-6 w-36" />
                            ) : (
                              <span className="text-[10px] text-indigo-400 italic font-mono font-bold">Simulator Voice Track Ready</span>
                            )}
                          </div>
                        )}

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Your Answer Transcript:</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/20 p-3 rounded-lg border border-slate-800/40">
                            "{answer.text}"
                          </p>
                        </div>

                        {answer.analysis && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            {/* Strengths listed */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">Evaluator Strengths:</span>
                              <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                                {answer.analysis.strengths.map((s, sidx) => (
                                  <li key={sidx} className="leading-normal">{s}</li>
                                ))}
                              </ul>
                            </div>
                            {/* Improvements listed */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">Areas of Improvement:</span>
                              <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                                {answer.analysis.weaknesses.map((w, widx) => (
                                  <li key={widx} className="leading-normal">{w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {answer.analysis?.betterPhrasing && (
                          <div className="space-y-1 pt-2">
                            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block">Optimized Professional Phrasing suggestion:</span>
                            <p className="text-xs text-indigo-300/90 italic bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 leading-relaxed">
                              "{answer.analysis.betterPhrasing}"
                            </p>
                          </div>
                        )}

                        {/* Model response answers compare */}
                        <div className="space-y-1 pt-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Ideal Standard Reference:</span>
                          <p className="text-[11px] text-slate-400 leading-relaxed bg-gray-950 p-3 rounded-xl max-h-36 overflow-y-auto whitespace-pre-line">
                            {q.modelAnswer}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic pl-3 border-l-2 border-slate-800">
                        Skipped or unanswered.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
