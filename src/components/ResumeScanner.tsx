import React, { useState } from "react";
import { AlertCircle, ArrowRight, Brain, CheckCircle2, FileText, Loader2, Sparkles, Trophy, Upload, UserCheck } from "lucide-react";
import { ResumeAnalysis, Question } from "../types";

interface ResumeScannerProps {
  onStartCustomInterview: (questions: Question[], title: string, role: string) => void;
}

export default function ResumeScanner({ onStartCustomInterview }: ResumeScannerProps) {
  const [resumeText, setResumeText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(5);

  const handleScan = async (textToScan: string) => {
    if (!textToScan || textToScan.trim().length < 20) {
      setError("Please paste a more substantial resume (at least 20 characters).");
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: textToScan, questionCount }),
      });

      if (!response.ok) {
        throw new Error("Failed to scan resume. Check server connection and try again.");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during resume analysis.");
    } finally {
      setIsScanning(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    const extension = file.name.split(".").pop()?.toLowerCase();
    
    if (extension === "txt") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResumeText(text);
        handleScan(text);
      };
      reader.readAsText(file);
    } else if (extension === "pdf" || extension === "docx") {
      setIsScanning(true);
      try {
        const response = await fetch(`/api/parse-resume?type=${extension}`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: file,
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to extract text from ${extension.toUpperCase()} file.`);
        }
        
        const data = await response.json();
        if (!data.text || data.text.trim().length === 0) {
          throw new Error("No readable text could be extracted from this document.");
        }
        
        setResumeText(data.text);
        handleScan(data.text);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to upload and parse resume file.");
        setIsScanning(false);
      }
    } else {
      setError("Unsupported file format. Please upload a .txt, .pdf, or .docx file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setResumeText("");
    setError(null);
  };

  const launchInterviewSession = () => {
    if (!analysis) return;
    onStartCustomInterview(
      analysis.suggestedQuestions,
      "Resume-Specific Performance Assessment",
      "Tailored Role matching Resume"
    );
  };

  return (
    <div className="space-y-8 animate-fade-in" id="resume-advisor-view">
      {/* Description Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" /> Resume Scanner & AI Advisor
        </h2>
        <p className="text-xs text-gray-400">
          Upload or paste your resume. Our AI scans for technical keywords, estimates your placement scores, suggests improvements, and prepares you for real questions interviewer would ask.
        </p>
      </div>

      {!analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="resume-input-container">
          {/* Copy-Paste Resume Text */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-4">
            <h3 className="font-bold text-white text-base">Paste Resume Plain Text</h3>
            <textarea
              className="w-full h-80 rounded-xl bg-gray-900/60 border border-gray-800 focus:border-indigo-500/50 p-4 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none resize-none transition"
              placeholder="Paste your standard text resume here, including profile summaries, skills, work experiences, education and projects..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={isScanning}
            />
            
            {/* Number of Questions Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Questions to Generate</label>
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
                    disabled={isScanning}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleScan(resumeText)}
              disabled={isScanning || !resumeText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium rounded-xl transition cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Scanning & Extracting Skills...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Run Deep Resume Scan
                </>
              )}
            </button>
          </div>

          {/* Drag & Drop File Upload */}
          <div
            className={`glass-panel p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition ${
              dragActive ? "border-indigo-500 bg-indigo-500/5" : "border-gray-800"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 mb-4">
              <Upload className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="font-bold text-white text-base">Drag & Drop Resume</h3>
            <p className="text-xs text-gray-400 max-w-xs mt-1 mb-6">
              Drag your PDF, Word (.docx), or Text (.txt) file here, or click to browse.
            </p>

            <label className="px-5 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 font-medium text-xs transition cursor-pointer relative">
              Browse Files
              <input
                type="file"
                className="hidden"
                accept=".txt,.pdf,.docx"
                onChange={handleFileChange}
                disabled={isScanning}
              />
            </label>

            {error && (
              <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left max-w-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Scan results visualizer */
        <div className="space-y-6 animate-fade-in" id="resume-results-container">
          {/* Header Score Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between md:col-span-1 text-center md:text-left">
              <div>
                <span className="text-xs text-gray-400 font-medium">Estimated Resume Score</span>
                <div className="flex items-baseline justify-center md:justify-start gap-1.5 mt-2">
                  <span className="text-5xl font-extrabold font-mono text-indigo-400 glow-text-indigo">
                    {analysis.overallResumeScore}
                  </span>
                  <span className="text-sm text-gray-500">/100</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                {analysis.overallResumeScore >= 80
                  ? "Outstanding! Excellent keyword densities and impact metrics. Highly interview-ready."
                  : analysis.overallResumeScore >= 60
                  ? "Good start. Can be boosted with better action verbs and quantified achievements."
                  : "Critical improvements needed. Missing standard key pillars or weak content description."}
              </p>
            </div>

            {/* Extracted Skills badges */}
            <div className="glass-panel p-6 rounded-2xl md:col-span-2">
              <h3 className="font-bold text-white text-sm mb-3">Extracted Tech Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.skillsFound.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 text-xs rounded-md bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/25"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                These keywords are automatically detected for interview matching logic.
              </p>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/10">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Resume Strengths
              </h3>
              <ul className="space-y-3">
                {analysis.strengths.map((str, index) => (
                  <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-rose-500/10">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Suggested Improvements
              </h3>
              <ul className="space-y-3">
                {analysis.improvements.map((imp, index) => (
                  <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5"></span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested customized Interview Questions */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Custom Simulated Questions</h3>
                <p className="text-xs text-gray-400">
                  Formulated by our AI recruiter based on your background and projects
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 text-gray-400 rounded-xl hover:bg-gray-800 text-xs transition font-semibold cursor-pointer"
                >
                  Scan Another Resume
                </button>
                <button
                  onClick={launchInterviewSession}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  <Brain className="w-4 h-4" /> Start Mock Interview Now <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 divide-y divide-gray-800/60 pt-2">
              {analysis.suggestedQuestions.map((q, idx) => (
                <div key={q.id} className="pt-3 first:pt-0">
                  <div className="flex justify-between items-start gap-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 font-mono font-bold">
                      Q{idx + 1} • Resume-Specific
                    </span>
                    <span className="text-[11px] text-gray-400">Difficulty: <b className="text-indigo-400">{q.difficulty}</b></span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1.5 leading-relaxed">
                    {q.text}
                  </p>
                  <p className="text-xs text-gray-400 italic mt-1 font-mono">
                    💡 Hint: {q.hints?.[0] || "Be ready to explain the structural patterns of your projects."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
