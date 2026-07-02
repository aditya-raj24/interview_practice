import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Terminal, 
  Layers, 
  Database, 
  Brain, 
  Trophy, 
  FileText, 
  LayoutDashboard, 
  Compass, 
  AlertCircle, 
  CheckCircle,
  TrendingUp, 
  ShieldAlert,
  Mic,
  Video,
  Play,
  RotateCcw,
  Plus,
  CloudLightning,
  CloudOff,
  User as UserIcon,
  X,
  Menu
} from "lucide-react";
import { InterviewSession, Question } from "./types";
import Dashboard from "./components/Dashboard";
import ScenarioGenerator from "./components/ScenarioGenerator";
import ResumeScanner from "./components/ResumeScanner";
import InterviewArena from "./components/InterviewArena";
import PerformanceReport from "./components/PerformanceReport";
import AuthPanel from "./components/AuthPanel";
import { AuthUser } from "./components/AuthPanel";
import EnglishCoach from "./components/EnglishCoach";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "generator" | "resume" | "arena" | "report" | "english">("dashboard");
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [selectedReportSession, setSelectedReportSession] = useState<InterviewSession | null>(null);
  
  // Custom Auth & Modal state variables
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Monitor auth status and merge local/cloud databases
  useEffect(() => {
    const storedUser = localStorage.getItem("aura_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to restore authenticated user:", err);
      }
    }
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      if (user) {
        setIsCloudSyncing(true);
        try {
          // Load sessions from backend database (MongoDB or fallback local JSON)
          const response = await fetch(`/api/sessions?userId=${encodeURIComponent(user.uid)}`);
          const data = await response.json();
          const serverSessions = data.sessions || [];
          
          // Merge local sessions if any exist
          const stored = localStorage.getItem("aura_interview_sessions");
          let merged = [...serverSessions];
          
          if (stored) {
            try {
              const localSessions: InterviewSession[] = JSON.parse(stored);
              const serverIds = new Set(serverSessions.map((s: any) => s.id));
              const missingOnServer = localSessions.filter(s => !serverIds.has(s.id) && !s.id.startsWith("seed-"));
              
              if (missingOnServer.length > 0) {
                // Upload missing sessions to cloud/fallback database
                for (const session of missingOnServer) {
                  await fetch("/api/sessions/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.uid, session })
                  });
                  merged.push(session);
                }
                // Sort by date (newest first)
                merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              }
            } catch (err) {
              console.error("Failed to parse/merge local sessions:", err);
            }
          }
          
          setPastSessions(merged);
          localStorage.setItem("aura_interview_sessions", JSON.stringify(merged));
        } catch (error) {
          console.error("Error loading/merging database sessions from server:", error);
        } finally {
          setIsCloudSyncing(false);
        }
      } else {
        // Fallback/Restoring standard local storage sessions
        const stored = localStorage.getItem("aura_interview_sessions");
        if (stored) {
          try {
            setPastSessions(JSON.parse(stored));
          } catch (err) {
            console.error("Failed to parse stored sessions:", err);
          }
        } else {
          // Seed default highly detailed sessions to populate graphs and logs immediately if no local history exists
          const seeded: InterviewSession[] = [
            {
              id: "seed-1",
              title: "System Design Practice - Scale-up Architecture",
              jobRole: "Senior Backend Developer",
              category: "System Design",
              isCompleted: true,
              currentQuestionIndex: 2,
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
              questions: [
                {
                  id: "sq-1",
                  text: "Explain how you would design a rate limiter for a high-volume public API.",
                  category: "System Design",
                  difficulty: "Medium",
                  modelAnswer: "A rate limiter limits traffic from specific clients. Popular algorithms include Token Bucket, Leaking Bucket, and Sliding Window Log. Redis is ideal for storage due to sub-millisecond atomic increments."
                },
                {
                  id: "sq-2",
                  text: "How do you manage database horizontal scalability (sharding) vs vertical scalability?",
                  category: "System Design",
                  difficulty: "Hard",
                  modelAnswer: "Vertical scale is limited by CPU/RAM constraints. Horizontal scale (sharding) partitions rows across databases using partition keys. Tradeoffs include complicated queries, join limitations, and re-sharding overhead."
                }
              ],
              answers: {
                "sq-1": {
                  questionId: "sq-1",
                  text: "I would use a Token Bucket algorithm stored inside Redis. Redis is very fast and supports atomic increments, preventing race conditions from multiple concurrent API servers.",
                  analysis: {
                    score: 84,
                    strengths: ["Clear choice of Token Bucket", "Correctly identified Redis atomic operations."],
                    weaknesses: ["Did not mention sliding window tradeoff alternatives."],
                    fillerWordCount: { um: 1, like: 2, basically: 0, uh: 0, youKnow: 1 },
                    paceWpm: 125,
                    feedbackText: "Excellent fundamental knowledge. Mention sliding windows or token leaking differences to make it perfect.",
                    keyPointsCovered: ["Token Bucket", "Redis atomic operations"],
                    keyPointsMissing: ["Sliding window counter"],
                    betterPhrasing: "I would implement a rate-limiting filter using the Token Bucket algorithm backed by Redis. Storing counts in Redis allows shared state across API nodes with atomic increment queries."
                  }
                },
                "sq-2": {
                  questionId: "sq-2",
                  text: "Sharding splits your dataset by a key, but it makes joins hard.",
                  analysis: {
                    score: 68,
                    strengths: ["Identified partitioning and join problems."],
                    weaknesses: ["Answer is extremely brief.", "No mention of consistent hashing or key skewness."],
                    fillerWordCount: { um: 0, like: 0, basically: 1, uh: 0, youKnow: 0 },
                    paceWpm: 80,
                    feedbackText: "Elaborate more on consistent hashing, partition key choice, and how skewness is handled.",
                    keyPointsCovered: ["Database partitioning", "Join constraints"],
                    keyPointsMissing: ["Consistent hashing", "Hotspot partition key mitigation"],
                    betterPhrasing: "Horizontal partitioning, or sharding, distributes database rows across machines using a shard key. While this scales write throughput, it introduces significant complexity in cross-shard joins and transaction management."
                  }
                }
              },
              score: {
                overall: 76,
                technical: 78,
                communication: 74,
                relevance: 78,
                confidence: 75
              }
            },
            {
              id: "seed-2",
              title: "OOPS Solid Principles Appraisal",
              jobRole: "SDE II Candidate",
              category: "OOPS",
              isCompleted: true,
              currentQuestionIndex: 1,
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
              questions: [
                {
                  id: "sq-3",
                  text: "Can you describe the Liskov Substitution Principle (LSP) with a clear software design example?",
                  category: "OOPS",
                  difficulty: "Medium",
                  modelAnswer: "LSP states that subtypes must be substitutable for their base types. A classic violation is a Square inheriting from Rectangle where setting height changes width, breaking expected rectangle assumptions."
                }
              ],
              answers: {
                "sq-3": {
                  questionId: "sq-3",
                  text: "Liskov means children should be able to replace parents without causing errors. For example, a square inherits rectangle but modifying rectangle width should not break square rules.",
                  analysis: {
                    score: 89,
                    strengths: ["Excellent substitution definition.", "Correctly applied square/rectangle inheritance trap."],
                    weaknesses: ["Could list real-world interface decoupling tools."],
                    fillerWordCount: { um: 0, like: 1, basically: 0, uh: 1, youKnow: 0 },
                    paceWpm: 135,
                    feedbackText: "Outstanding response. Decouple square and rectangle with a common shape interface to follow correct LSP standards.",
                    keyPointsCovered: ["Subtype substitutability", "Rectangle/Square paradox"],
                    keyPointsMissing: ["Interface segregation"],
                    betterPhrasing: "The Liskov Substitution Principle asserts that objects of a superclass should be replaceable with objects of its subclasses without breaking application behavior. To prevent square-rectangle inheritance issues, decouple them using a shared geometric shape interface."
                  }
                }
              },
              score: {
                overall: 89,
                technical: 90,
                communication: 88,
                relevance: 91,
                confidence: 87
              }
            }
          ];
          setPastSessions(seeded);
          localStorage.setItem("aura_interview_sessions", JSON.stringify(seeded));
        }
      }
    };

    loadSessions();
  }, [user]);

  // Sync sessions with localStorage and cloud database
  const saveSessions = async (updated: InterviewSession[]) => {
    setPastSessions(updated);
    localStorage.setItem("aura_interview_sessions", JSON.stringify(updated));
    
    if (user) {
      try {
        // Save sessions to custom database
        await Promise.all(updated.map(s => 
          fetch("/api/sessions/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.uid, session: s })
          })
        ));
      } catch (err) {
        console.error("Failed to sync new sessions to server:", err);
      }
    }
  };

  // Triggers immediate subject preparation
  const handleStartCategoryInterview = async (category: "OOPS" | "DBMS" | "System Design" | "Comprehensive" | "Custom" | "DSA") => {
    setActiveTab("dashboard");
    const titleMap = {
      OOPS: "Object-Oriented Design & Principles Test",
      DBMS: "Relational DBMS & Query Optimization",
      "System Design": "Distributed Systems Scalability Test",
      Comprehensive: "Comprehensive Tech Placement Drill",
      Custom: "Custom Placement Scenario",
      DSA: "Data Structures & Algorithms Placement Test"
    };

    const roleMap = {
      OOPS: "Object Oriented Design Specialist",
      DBMS: "Database Administrator & Architect",
      "System Design": "Distributed Systems Engineer",
      Comprehensive: "Software Development Engineer (SDE)",
      Custom: "Custom Targeted Role",
      DSA: "Algorithm Engineer & Problem Solver"
    };

    setActiveTab("generator");
    // Pre-fill Scenario Generator inputs
    const elRole = document.querySelector('input[placeholder*="SDE I"]') as HTMLInputElement;
    if (elRole) {
      elRole.value = roleMap[category] || "Software Development Engineer";
    }
    setIsSidebarOpen(false);
  };

  // Launch the active interview playground
  const handleStartCustomInterview = (questions: Question[], title: string, role: string, category?: any) => {
    const newSession: InterviewSession = {
      id: `session-${Date.now()}`,
      title,
      jobRole: role,
      category: category || "Custom",
      questions,
      currentQuestionIndex: 0,
      answers: {},
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    const updated = [newSession, ...pastSessions];
    saveSessions(updated);
    setActiveSession(newSession);
    setActiveTab("arena");
  };

  // Handle active session state updates
  const handleUpdateSession = (updatedSession: InterviewSession) => {
    setActiveSession(updatedSession);
    const updatedPast = pastSessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    saveSessions(updatedPast);

    if (updatedSession.isCompleted) {
      setSelectedReportSession(updatedSession);
      setActiveTab("report");
    }
  };

  // Viewing report from logs list
  const handleViewSessionReport = (session: InterviewSession) => {
    setSelectedReportSession(session);
    setActiveTab("report");
  };

  const handleResetHistory = async () => {
    if (window.confirm("Are you sure you want to clear your local interview progress logs? This will reset your analytics trendlines.")) {
      localStorage.removeItem("aura_interview_sessions");
      setPastSessions([]);
      
      if (user) {
        try {
          const response = await fetch(`/api/sessions?userId=${encodeURIComponent(user.uid)}`);
          const data = await response.json();
          const sessions = data.sessions || [];
          
          await Promise.all(sessions.map((s: any) => 
            fetch("/api/sessions/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.uid, sessionId: s.id })
            })
          ));
        } catch (err) {
          console.error("Failed to clear sessions from server:", err);
        }
      }
    }
  };

  // Calculate high-level stats
  const completedSessions = pastSessions.filter(s => s.isCompleted);
  const averageConfidence = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.score?.confidence || 0), 0) / completedSessions.length)
    : 0;

  return (
    <div className="flex h-screen w-full bg-[#0A0A0C] text-slate-200 overflow-hidden font-sans" id="app-root">
      
      {/* Mobile Sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Layout */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 flex flex-col bg-[#0F1115] transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-auto shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`} 
        id="sidebar"
      >
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif italic text-indigo-400 font-bold tracking-tight">
              AuraInterview
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-bold">
              AI-Powered Placement Prep
            </p>
          </div>
          {/* Close button for mobile sidebar */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Navigation link stacks */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" id="sidebar-nav">
          <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wider mb-2 px-2">
            Main Console
          </div>
          
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setActiveSession(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl border text-left transition ${
              activeTab === "dashboard"
                ? "bg-slate-800/80 text-white border-slate-700/80"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold">Workspace Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("generator");
              setActiveSession(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl border text-left transition ${
              activeTab === "generator"
                ? "bg-slate-800/80 text-white border-slate-700/80"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30"
            }`}
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold">Scenario Generator</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("resume");
              setActiveSession(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl border text-left transition ${
              activeTab === "resume"
                ? "bg-slate-800/80 text-white border-slate-700/80"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30"
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Resume Scanner</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("english");
              setActiveSession(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl border text-left transition ${
              activeTab === "english"
                ? "bg-slate-800/80 text-white border-slate-700/80"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30"
            }`}
          >
            <Mic className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-semibold">AI English Coach</span>
          </button>

          <div className="pt-6 text-[11px] text-slate-600 font-bold uppercase tracking-wider mb-2 px-2">
            Subject Accelerators
          </div>
          
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => handleStartCategoryInterview("OOPS")}
              className="text-left text-xs px-3 py-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" /> OOPS Concept Drills
            </button>
            <button
              onClick={() => handleStartCategoryInterview("DBMS")}
              className="text-left text-xs px-3 py-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" /> DBMS Norms & Tuning
            </button>
            <button
              onClick={() => handleStartCategoryInterview("System Design")}
              className="text-left text-xs px-3 py-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-slate-500" /> System Design Architectures
            </button>
            <button
              onClick={() => handleStartCategoryInterview("DSA")}
              className="text-left text-xs px-3 py-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-slate-500" /> DSA & Algorithmic Drills
            </button>
          </div>
        </nav>

        {/* Action Bottom bar inside sidebar */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-indigo-900/10 rounded-xl p-4 border border-indigo-500/15">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-indigo-300">Resume Matcher</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase">Ready</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Scan for keywords to reveal custom interview answers recruiter wants.
            </p>
            <button 
              onClick={() => {
                setActiveTab("resume");
                setIsSidebarOpen(false);
              }}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-semibold transition cursor-pointer"
            >
              Open Scan Console
            </button>
          </div>

          <button
            onClick={handleResetHistory}
            className="w-full mt-4 text-center text-[10px] text-slate-600 hover:text-slate-400 font-bold uppercase tracking-wider cursor-pointer"
          >
            Reset Logs History
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame container */}
      <main className="flex-1 flex flex-col overflow-hidden" id="main-content">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 bg-[#0F1115]/80 shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white lg:hidden cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target Domain Role</span>
              <span className="text-xs font-bold text-slate-200">
                {activeSession ? activeSession.jobRole : "Comprehensive Placement Prep"}
              </span>
            </div>
            {activeSession && (
              <>
                <div className="h-8 w-px bg-slate-800 mx-2"></div>
                <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase">REC AUDIO LIVE</span>
                </div>
              </>
            )}
            
            {/* Cloud Status Indicator */}
            <div className="h-8 w-px bg-slate-800 mx-2"></div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-xs transition cursor-pointer"
            >
              {user ? (
                <>
                  <CloudLightning className={`w-3.5 h-3.5 text-emerald-400 ${isCloudSyncing ? "animate-bounce" : ""}`} />
                  <span className="text-[10px] font-mono font-medium text-emerald-400">Cloud Connected</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-mono text-slate-400">Local Cache</span>
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Avg Placement Prep Score</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{averageConfidence}%</span>
            </div>
            
            {/* Active User profile avatar / Login button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              id="profile-trigger-btn"
            >
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-xs font-semibold text-slate-300 group-hover:text-white transition">
                    {user.displayName || "Aura Candidate"}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold font-mono group-hover:border-indigo-400/50 transition">
                    {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : "AC"}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition">
                    Sign In
                  </span>
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold group-hover:border-slate-500 transition">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Main Area containing active page tab */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <Dashboard 
              pastSessions={pastSessions}
              onStartCategory={handleStartCategoryInterview}
              onViewSession={handleViewSessionReport}
            />
          )}

          {activeTab === "generator" && (
            <ScenarioGenerator 
              onStartCustomInterview={handleStartCustomInterview}
            />
          )}

          {activeTab === "resume" && (
            <ResumeScanner 
              onStartCustomInterview={(questions, title, role) => handleStartCustomInterview(questions, title, role, "Resume-Specific")}
            />
          )}

          {activeTab === "english" && (
            <EnglishCoach />
          )}

          {activeTab === "arena" && activeSession && (
            <InterviewArena 
              session={activeSession}
              onUpdateSession={handleUpdateSession}
              onBackToDashboard={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "report" && selectedReportSession && (
            <PerformanceReport 
              session={selectedReportSession}
              onBackToDashboard={() => setActiveTab("dashboard")}
            />
          )}
        </div>

      </main>

      {/* Cloud Authentication Backdrop / Modal Popup */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="auth-modal-overlay">
          <div className="relative w-full max-w-md bg-[#0F1115] rounded-2xl border border-slate-800 shadow-2xl p-1 overflow-hidden">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="p-4">
              <AuthPanel 
                user={user} 
                onAuthChange={(updatedUser) => {
                  setUser(updatedUser);
                  // Close modal automatically on successful action/login
                  if (updatedUser) {
                    setTimeout(() => {
                      setShowAuthModal(false);
                    }, 1200);
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
