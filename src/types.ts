export interface Question {
  id: string;
  text: string;
  category: "OOPS" | "DBMS" | "System Design" | "DSA" | "Behavioral" | "Resume-Specific" | "Job-Specific";
  difficulty: "Easy" | "Medium" | "Hard";
  modelAnswer: string;
  hints?: string[];
}

export interface InterviewSession {
  id: string;
  title: string;
  jobRole: string;
  jobDescription?: string;
  category: "OOPS" | "DBMS" | "System Design" | "DSA" | "Comprehensive" | "Custom";
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>; // questionId -> UserAnswer
  isCompleted: boolean;
  score?: SessionScore;
  createdAt: string;
}

export interface UserAnswer {
  questionId: string;
  text: string;
  code?: string;
  codeLanguage?: string;
  audioUrl?: string; // base64 or object URL of recorded response
  audioDuration?: number; // in seconds
  videoUrl?: string; // base64 or object URL of recorded video response
  analysis?: AnswerAnalysis;
}

export interface AnswerAnalysis {
  score: number; // 0 - 100
  strengths: string[];
  weaknesses: string[];
  fillerWordCount: {
    um: number;
    like: number;
    basically: number;
    uh: number;
    youKnow: number;
  };
  paceWpm: number; // Words Per Minute
  feedbackText: string;
  keyPointsCovered: string[];
  keyPointsMissing: string[];
  betterPhrasing: string;
}

export interface SessionScore {
  overall: number;
  technical: number;
  communication: number;
  relevance: number;
  confidence: number;
}

export interface ResumeAnalysis {
  skillsFound: string[];
  suggestedQuestions: Question[];
  strengths: string[];
  improvements: string[];
  overallResumeScore: number; // 0 - 100
}

export interface PerformanceSnapshot {
  date: string;
  overallScore: number;
  technical: number;
  communication: number;
  relevance: number;
  confidence: number;
  sessionTitle: string;
}
