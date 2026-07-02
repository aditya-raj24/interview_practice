import React, { useState } from "react";
import { Sparkles, Briefcase, FileText, Layers, Database, Brain, Trophy, ChevronRight, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { Question } from "../types";

interface ScenarioGeneratorProps {
  onStartCustomInterview: (questions: Question[], title: string, role: string, category: any) => void;
}

export default function ScenarioGenerator({ onStartCustomInterview }: ScenarioGeneratorProps) {
  const [jobRole, setJobRole] = useState("Software Development Engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"Comprehensive" | "OOPS" | "DBMS" | "System Design" | "Custom" | "DSA">("Comprehensive");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Mixed" | "Easy" | "Medium" | "Hard">("Mixed");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predefinedScenarios = [
    {
      role: "SDE I (Placement Prep)",
      desc: "Focus on fundamentals of Data structures, Object Oriented designs, simple databases, and normalizations.",
      category: "Comprehensive" as const,
    },
    {
      role: "Backend System Engineer",
      desc: "Emphasis on high volume microservices, database optimizations, query plans, caching (Redis/Memcached), and solid system scaling architectures.",
      category: "System Design" as const,
    },
    {
      role: "Database Architect",
      desc: "Expert SQL tuning, deep indexing designs, distributed transactions, normal forms, replication topologies, and high-availability database models.",
      category: "DBMS" as const,
    }
  ];

  const handleGenerate = async () => {
    if (!jobRole || jobRole.trim().length < 3) {
      setError("Please specify a valid targeted job role.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole,
          jobDescription: jobDescription || "Standard technical questions",
          category: selectedCategory,
          difficulty: selectedDifficulty,
          questionCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact scenario generation engine. Check API credentials.");
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions were generated. Try writing a more detailed description.");
      }

      onStartCustomInterview(
        data.questions,
        `Placement prep: ${jobRole}`,
        jobRole,
        selectedCategory
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate interview scenario.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPredefined = (sc: typeof predefinedScenarios[0]) => {
    setJobRole(sc.role);
    setJobDescription(sc.desc);
    setSelectedCategory(sc.category);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="scenario-generator-view">
      {/* Description Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" /> AI Scenario Generator
        </h2>
        <p className="text-xs text-gray-400">
          Formulate highly tailored technical interview sessions by specifying a custom job description, or prepare for specialized core technical modules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Scenario Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <h3 className="font-bold text-white text-base">Custom Placement Target</h3>
                        {/* Subject Selector Buttons */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Target Subject Core</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: "Comprehensive", label: "Comprehensive Prep" },
                  { id: "OOPS", label: "OOPS Focused" },
                  { id: "DBMS", label: "DBMS Focused" },
                  { id: "System Design", label: "System Design" },
                  { id: "DSA", label: "DSA & Algorithms" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

             {/* Targeted Job Role input */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> Job Role / Profile Name
              </label>
              <input
                type="text"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition"
                placeholder="e.g. Staff Fullstack Engineer, Junior iOS Developer..."
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Target Difficulty Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Target Difficulty</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "Mixed", label: "Mixed Levels" },
                  { id: "Easy", label: "Easy Level" },
                  { id: "Medium", label: "Medium Level" },
                  { id: "Hard", label: "Hard Level" },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff.id as any)}
                    className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      selectedDifficulty === diff.id
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                    disabled={isGenerating}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`py-2 text-center text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      questionCount === num
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                    disabled={isGenerating}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description details textarea */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Core Job Description / Key Technologies
              </label>
              <textarea
                className="w-full h-44 bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none resize-none transition"
                placeholder="Paste the company job description, technical stack requirements, or placement guidelines to customize questions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm rounded-xl hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 shadow-lg shadow-indigo-600/10 transition cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Custom Scenarios...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" /> Build & Start Interview Session <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Predefined Quick Launcher Templates */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Quick Templates</h3>
            <p className="text-xs text-gray-400">Launch standard placements test scenarios instantly:</p>

            <div className="space-y-3 pt-1">
              {predefinedScenarios.map((sc, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectPredefined(sc)}
                  className="w-full text-left p-4 rounded-xl bg-slate-900/40 hover:bg-indigo-500/5 border border-slate-800 hover:border-indigo-500/30 transition flex flex-col space-y-1 group cursor-pointer"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-white text-xs group-hover:text-indigo-300 transition">
                      {sc.role}
                    </span>
                    <span className="text-[9px] bg-slate-800 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold">
                      {sc.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {sc.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
