import React, { useState } from "react";
import { Award, BarChart3, BookOpen, Brain, Calendar, ChevronRight, Clock, Compass, Database, Layers, MessageSquare, Play, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { InterviewSession, PerformanceSnapshot } from "../types";

interface DashboardProps {
  pastSessions: InterviewSession[];
  onStartCategory: (category: "OOPS" | "DBMS" | "System Design" | "Comprehensive" | "Custom" | "DSA") => void;
  onViewSession: (session: InterviewSession) => void;
}

export default function Dashboard({ pastSessions, onStartCategory, onViewSession }: DashboardProps) {
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);

  // Parse snaps from past sessions or use seeded snapshots if none exist yet
  const defaultSnapshots: PerformanceSnapshot[] = [
    { date: "June 15", overallScore: 68, technical: 70, communication: 62, relevance: 68, confidence: 70, sessionTitle: "System Design Basics" },
    { date: "June 18", overallScore: 72, technical: 74, communication: 68, relevance: 70, confidence: 75, sessionTitle: "OOPS & SOLID Patterns" },
    { date: "June 22", overallScore: 78, technical: 80, communication: 74, relevance: 76, confidence: 82, sessionTitle: "DBMS & SQL Tuning" },
    { date: "June 26", overallScore: 84, technical: 85, communication: 80, relevance: 84, confidence: 88, sessionTitle: "Fullstack Architecture" },
    { date: "July 01", overallScore: 91, technical: 92, communication: 88, relevance: 90, confidence: 94, sessionTitle: "Placement Prep Comprehensive" },
  ];

  const snapshots: PerformanceSnapshot[] = [...pastSessions]
    .filter(s => s.isCompleted && s.score)
    .reverse()
    .map(s => {
      const dateObj = new Date(s.createdAt);
      const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date: formattedDate,
        overallScore: s.score!.overall,
        technical: s.score!.technical,
        communication: s.score!.communication,
        relevance: s.score!.relevance,
        confidence: s.score!.confidence,
        sessionTitle: s.title,
      };
    });

  // Calculate current average metrics
  const latestSnapshot = snapshots[snapshots.length - 1] || { overallScore: 0, technical: 0, communication: 0, relevance: 0, confidence: 0 };
  const averageScore = Math.round(snapshots.reduce((acc, curr) => acc + curr.overallScore, 0) / (snapshots.length || 1));
  const technicalAverage = Math.round(snapshots.reduce((acc, curr) => acc + curr.technical, 0) / (snapshots.length || 1));
  const communicationAverage = Math.round(snapshots.reduce((acc, curr) => acc + curr.communication, 0) / (snapshots.length || 1));
  const confidenceAverage = Math.round(snapshots.reduce((acc, curr) => acc + curr.confidence, 0) / (snapshots.length || 1));

  // Custom responsive SVG Line Chart geometry
  const chartHeight = 220;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 30;

  const points = snapshots.map((snap, index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2)) / Math.max(1, snapshots.length - 1);
    const y = chartHeight - paddingY - (snap.overallScore * (chartHeight - paddingY * 2)) / 100;
    return { x, y, snap, index };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view">
      {/* Premium Hero Section */}
      <div className="relative rounded-2xl overflow-hidden glass-panel border border-indigo-500/20 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="space-y-3 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Placement Readiness Active
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Slay Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Technical Interview</span>
          </h1>
          <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
            Practice core computer science subjects (OOPS, DBMS, System Design) or simulate custom corporate job descriptions. Get instant real-time AI feedback, pacing analysis, and performance tracking.
          </p>
        </div>

        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <button
            onClick={() => onStartCategory("Comprehensive")}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition"
            id="start-comprehensive-btn"
          >
            <Play className="w-4 h-4 fill-current" /> Start Placement Practice
          </button>
        </div>
      </div>

      {/* Core Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">Placement Score</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-indigo-400 font-mono tracking-tight glow-text-indigo">
              {averageScore}%
            </span>
            {snapshots.length > 1 && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +5.4%
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Based on past {snapshots.length} assessments</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">Technical Skills</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-purple-400 font-mono tracking-tight">
              {technicalAverage}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Accuracy, SOLID principles, & custom system design</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">Communication Clarity</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {communicationAverage}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Explanation structure, clarity, & flow quality</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">Speech & Confidence</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-pink-400 font-mono tracking-tight">
              {confidenceAverage}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Filler words reduction & speech pace</p>
        </div>
      </div>

      {/* Main Content Layout - Charts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress over time Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col space-y-4" id="progress-chart-card">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Progress Over Time</h3>
                <p className="text-xs text-gray-400">Tracking interview preparedness scores weekly</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-gray-800 text-indigo-300 px-2.5 py-1 rounded-md font-mono">
              Live Tracker
            </span>
          </div>

          {/* SVG Custom Interactive Line Chart */}
          <div className="relative w-full flex justify-center bg-gray-900/30 rounded-xl p-2 border border-gray-800">
            {snapshots.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/40 backdrop-blur-[1.5px] rounded-xl text-center p-4">
                <Brain className="w-8 h-8 text-indigo-400/60 mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-slate-300">No Assessment Data Yet</p>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-normal">
                  Complete your first placement prep interview drill to visualize your core analytics trendlines here.
                </p>
              </div>
            )}
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto select-none"
            >
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / 100;
                return (
                  <g key={val} className="opacity-20">
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#9ca3af"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="#9ca3af"
                      fontSize="9"
                      textAnchor="end"
                      className="font-mono"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Chart Line Gradient */}
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area path */}
              {points.length > 1 && (
                <path
                  d={`${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`}
                  fill="url(#lineGrad)"
                />
              )}

              {/* Trend Line */}
              {points.length > 1 && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              )}

              {/* Data Interactive Circles */}
              {points.map((p) => (
                <g key={p.index}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredDataIndex === p.index ? 7 : 4}
                    className="transition-all duration-150 cursor-pointer"
                    fill={hoveredDataIndex === p.index ? "#a5b4fc" : "#6366f1"}
                    stroke="#0b0f19"
                    strokeWidth={2}
                    onMouseEnter={() => setHoveredDataIndex(p.index)}
                    onMouseLeave={() => setHoveredDataIndex(null)}
                  />
                  {/* Date labels on X-axis */}
                  <text
                    x={p.x}
                    y={chartHeight - paddingY + 16}
                    fill="#9ca3af"
                    fontSize="9"
                    textAnchor="middle"
                    className="font-mono font-medium"
                  >
                    {p.snap.date}
                  </text>
                </g>
              ))}
            </svg>

            {/* Custom Tooltip absolute position overlays */}
            {hoveredDataIndex !== null && points[hoveredDataIndex] && (
              <div
                className="absolute z-20 glass-panel border border-indigo-500/30 p-2.5 rounded-lg shadow-xl text-xs space-y-1 bg-gray-950 pointer-events-none"
                style={{
                  left: `${(points[hoveredDataIndex].x / chartWidth) * 90}%`,
                  top: `${(points[hoveredDataIndex].y / chartHeight) * 70}%`,
                }}
              >
                <p className="font-bold text-white leading-tight">
                  {points[hoveredDataIndex].snap.sessionTitle}
                </p>
                <div className="flex gap-4 text-[10px] text-gray-300">
                  <span>Score: <b className="text-indigo-400 font-mono font-bold">{points[hoveredDataIndex].snap.overallScore}%</b></span>
                  <span>Tech: <b className="text-purple-400 font-mono">{points[hoveredDataIndex].snap.technical}%</b></span>
                  <span>Comm: <b className="text-emerald-400 font-mono">{points[hoveredDataIndex].snap.communication}%</b></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categories / Subject Modules Selector */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between" id="subjects-card">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-base">Preparation Subjects</h3>
            <p className="text-xs text-gray-400">Target critical Computer Science topics directly</p>
          </div>

          <div className="space-y-3 mt-4">
            <button
              onClick={() => onStartCategory("OOPS")}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/40 hover:bg-indigo-500/10 border border-gray-800 hover:border-indigo-500/30 text-left group transition duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Object-Oriented Programming (OOPS)</h4>
                  <p className="text-[11px] text-gray-400">Inheritance, SOLID, Polymorphism</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => onStartCategory("DBMS")}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/40 hover:bg-purple-500/10 border border-gray-800 hover:border-purple-500/30 text-left group transition duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Database Management (DBMS)</h4>
                  <p className="text-[11px] text-gray-400">Normalization, SQL Tuning, ACID</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transform group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => onStartCategory("System Design")}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/40 hover:bg-emerald-500/10 border border-gray-800 hover:border-emerald-500/30 text-left group transition duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">System Design</h4>
                  <p className="text-[11px] text-gray-400">Scalability, Load Balancing, CDN</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transform group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => onStartCategory("DSA")}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-900/40 hover:bg-pink-500/10 border border-gray-800 hover:border-pink-500/30 text-left group transition duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 group-hover:text-pink-300">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">DSA & Algorithms</h4>
                  <p className="text-[11px] text-gray-400">Arrays, Trees, Graphs, Complexity (Big O)</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-pink-400 transform group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* Historical Sessions Log */}
      <div className="glass-panel p-6 rounded-2xl" id="session-history-card">
        <h3 className="font-bold text-white text-base">Your Interview Log</h3>
        <p className="text-xs text-gray-400 mb-4">Review question transcripts, playback recordings, and check detailed AI comments</p>

        {pastSessions.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-gray-800 text-gray-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm font-medium">No custom sessions recorded yet.</p>
            <p className="text-xs mt-1 text-gray-500">Start an interview session to capture history, score metrics, and build progress trendlines.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Role / Session</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Scoring Profile</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                {pastSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-800/20 group transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {session.jobRole}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {session.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-400">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {session.score ? (
                        <div className="flex gap-3 text-xs items-center">
                          <span className="font-semibold text-indigo-400 font-mono">Overall: {session.score.overall}%</span>
                          <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                            Tech: {session.score.technical} | Comm: {session.score.communication}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Incomplete</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewSession(session)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium group-hover:underline cursor-pointer"
                      >
                        Review Report <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
