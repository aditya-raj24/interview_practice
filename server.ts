import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import dns from "dns";
import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";

// Configure Node.js to use Google DNS to bypass local ISP SRV resolution issues (ECONNREFUSED)
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (err) {
  console.warn("Custom DNS config warning:", err);
}
import { 
  connectDb, 
  registerUser, 
  loginUser, 
  getSessions, 
  saveSession, 
  deleteSession 
} from "./src/lib/serverDb";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to call NVIDIA's OpenAI-compatible chat API
async function callNvidiaAPI(systemInstruction: string, promptText: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY environment variable is required.");
  }

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from NVIDIA API");
  }
  return content;
}

// Clean JSON response by removing markdown blocks if they are present
function cleanJSONString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/i, "");
    cleaned = cleaned.replace(/```$/, "");
  }
  return cleaned.trim();
}

// 1. Scenario / Question Generator API
app.post("/api/generate-scenario", async (req, res) => {
  try {
    const { jobRole, jobDescription, category, difficulty, questionCount } = req.body;

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 15);
    const diffText = difficulty && difficulty !== "Mixed" ? `${difficulty} difficulty level` : "mixed difficulty (Easy, Medium, and Hard)";

    let categoryPrompt = "";
    if (category === "OOPS") {
      categoryPrompt = "Focus purely on Object-Oriented Programming (OOPS) concepts like inheritance, polymorphism, encapsulation, abstraction, SOLID principles, and design patterns.";
    } else if (category === "DBMS") {
      categoryPrompt = "Focus purely on Database Management Systems (DBMS), normalization, indexing, transactions, ACID properties, SQL vs NoSQL, and query optimizations.";
    } else if (category === "System Design") {
      categoryPrompt = "Focus purely on System Design concepts, scalability, load balancing, caching, databases partition, microservices, CDN, and high-level architecture.";
    } else if (category === "DSA") {
      categoryPrompt = "Focus purely on Data Structures & Algorithms (DSA), Arrays, Linked Lists, Trees, Graphs, Hash Maps, Stacks/Queues, Dynamic Programming, Recursion, Sorting/Searching, and Algorithmic Complexities (Big O notation). Make sure questions are standard placement-oriented coding questions but discussed conceptually (i.e. explain the algorithm, space/time complexity, and optimizations).";
    } else {
      categoryPrompt = `Prepare a general placement prep interview. Mix of DSA, OOPS, DBMS, System Design, and Behavioral/Technical questions tailored to this role: ${jobRole}.`;
    }

    const systemInstruction = `You are an expert interviewer and technical recruiter. Generate exactly ${count} highly relevant technical interview questions of ${diffText} for the job role: "${jobRole}".
Job Description: "${jobDescription || "Standard placement preparation technical questions"}"
Category Focus: ${categoryPrompt}

For each question, provide:
1. The question text.
2. The category (must be exactly one of: OOPS, DBMS, System Design, DSA, Behavioral, Resume-Specific, or Job-Specific).
3. The difficulty (must be exactly one of: Easy, Medium, Hard).
4. A highly detailed and structured model answer.
5. 2-3 short hints to guide the candidate.

You must respond with a JSON object containing a "questions" array.
Example JSON structure:
{
  "questions": [
    {
      "text": "...",
      "category": "...",
      "difficulty": "...",
      "modelAnswer": "...",
      "hints": ["...", "..."]
    }
  ]
}`;

    const rawResponse = await callNvidiaAPI(systemInstruction, `Generate ${count} interview questions now in JSON format.`);
    const parsed = JSON.parse(cleanJSONString(rawResponse) || "{}");
    const questions = parsed.questions || [];

    // Ensure unique IDs
    const questionsWithIds = questions.map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index}`,
    }));

    res.json({ questions: questionsWithIds });
  } catch (error: any) {
    console.error("Error in generate-scenario:", error);
    res.status(500).json({ error: error.message || "Failed to generate interview scenario." });
  }
});

// 2. Resume Scan / Question Generator API
app.post("/api/analyze-resume", async (req, res) => {
  try {
    const { resumeText, questionCount } = req.body;
    if (!resumeText || resumeText.trim().length < 10) {
      return res.status(400).json({ error: "Please provide a valid resume text." });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 3), 15);

    const systemInstruction = `You are an AI Resume Analyzer and technical interviewer.
Scan the following resume text.
1. Identify up to 10 key technical skills.
2. Assess the strengths and areas of improvements of the resume.
3. Formulate exactly ${count} customized interview questions that an interviewer would likely ask based on the candidate's listed projects, experiences, and technical stacks. Provide a model answer and hints for each.
4. Calculate an overall Resume Score from 0 to 100 based on standard tech resume best practices (impact words, formatting indications, projects, skills).

You must respond with a JSON object following this exact schema structure:
{
  "skillsFound": ["Skill 1", "Skill 2"],
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "overallResumeScore": 85,
  "suggestedQuestions": [
    {
      "text": "...",
      "category": "Resume-Specific",
      "difficulty": "Easy",
      "modelAnswer": "...",
      "hints": ["...", "..."]
    }
  ]
}`;

    const rawResponse = await callNvidiaAPI(systemInstruction, `Analyze this resume text:\n\n${resumeText}`);
    const data = JSON.parse(cleanJSONString(rawResponse) || "{}");

    // Ensure unique IDs
    if (data.suggestedQuestions) {
      data.suggestedQuestions = data.suggestedQuestions.map((q: any, index: number) => ({
        ...q,
        id: `resume-q-${Date.now()}-${index}`,
        category: "Resume-Specific",
      }));
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error in analyze-resume:", error);
    res.status(500).json({ error: error.message || "Failed to analyze resume." });
  }
});

// 3. User Response Analysis / Real-time Feedback API
app.post("/api/feedback", async (req, res) => {
  try {
    const { questionText, category, userAnswerText } = req.body;
    if (!userAnswerText || userAnswerText.trim().length < 3) {
      return res.status(400).json({ error: "Response is too short to analyze." });
    }

    const systemInstruction = `You are an AI interview feedback engine.
Analyze the user's answer to the given interview question in the specified category.
Question: "${questionText}"
Category: "${category}"
User's Answer: "${userAnswerText}"

Evaluate the answer and provide:
1. An overall score from 0 to 100 for this response.
2. Strengths of the answer.
3. Weaknesses or gaps in their explanation.
4. Detailed constructive feedback.
5. Exact points that they covered from the ideal answer.
6. Crucial missing key points that they should have included.
7. A recommended better phrasing of their answer that is polished and professional.

You must respond with a JSON object following this exact schema structure:
{
  "score": 80,
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "feedbackText": "...",
  "keyPointsCovered": ["Point 1", "Point 2"],
  "keyPointsMissing": ["Missing 1", "Missing 2"],
  "betterPhrasing": "..."
}`;

    const rawResponse = await callNvidiaAPI(systemInstruction, "Evaluate the response.");
    const data = JSON.parse(cleanJSONString(rawResponse) || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Error in feedback API:", error);
    res.status(500).json({ error: error.message || "Failed to generate feedback." });
  }
});

// 3.5. English Communication Evaluation API
app.post("/api/evaluate-english", async (req, res) => {
  try {
    const { topic, userSpeechText } = req.body;
    if (!userSpeechText || userSpeechText.trim().length < 5) {
      return res.status(400).json({ error: "Speech text is too short to evaluate." });
    }

    const systemInstruction = `You are an expert AI English Communication Coach.
Evaluate the user's spoken response on the topic: "${topic}".
Their transcribed spoken text is: "${userSpeechText}"

Evaluate their English communication skills on the following parameters:
1. Grammar & Syntax: Check for grammatical errors, run-on sentences, or tense mismatches.
2. Vocabulary & Expression: Did they use appropriate words and professional phrasing?
3. Clarity & Structure: Is the argument/response logically structured?
4. Filler Words: Identify repetitive filler words like 'um', 'like', 'uh', 'basically', 'you know'.

Provide an overall English Proficiency Score from 0 to 100.
Also provide:
- A list of grammatical corrections.
- A list of vocabulary improvements.
- Constructive feedback.
- A polished, professional model phrasing of what they said.

You must respond with a JSON object following this exact schema structure:
{
  "score": 85,
  "grammarCorrections": ["Error details and correction here"],
  "vocabularyImprovements": ["Suggestions here"],
  "feedbackText": "Your communication is clear, but...",
  "betterPhrasing": "..."
}`;

    const rawResponse = await callNvidiaAPI(systemInstruction, "Evaluate the speech transcript.");
    const data = JSON.parse(cleanJSONString(rawResponse) || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Error in evaluate-english API:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate English communication." });
  }
});

// 4. Custom Database Authentication Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const user = await registerUser(email, password, displayName);
    res.json({ success: true, user });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(400).json({ error: err.message || "Registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const user = await loginUser(email, password);
    res.json({ success: true, user });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(400).json({ error: err.message || "Invalid email or password." });
  }
});

app.post("/api/auth/guest", async (req, res) => {
  try {
    const guestEmail = `guest_${Math.random().toString(36).substring(2, 9)}@aurainterview.app`;
    const guestPassword = Math.random().toString(36).substring(2, 15);
    const user = await registerUser(guestEmail, guestPassword, "Anonymous Guest");
    res.json({ success: true, user: { ...user, isAnonymous: true } });
  } catch (err: any) {
    console.error("Guest login error:", err);
    res.status(500).json({ error: "Failed to initialize guest mode." });
  }
});

// 5. Custom Session Persistence Routes
app.get("/api/sessions", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required." });
    }
    const list = await getSessions(userId);
    res.json({ sessions: list });
  } catch (err: any) {
    console.error("Get sessions error:", err);
    res.status(500).json({ error: "Failed to retrieve sessions." });
  }
});

app.post("/api/sessions/save", async (req, res) => {
  try {
    const { userId, session } = req.body;
    if (!userId || !session) {
      return res.status(400).json({ error: "userId and session are required." });
    }
    await saveSession(userId, session);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Save session error:", err);
    res.status(500).json({ error: "Failed to save session." });
  }
});

app.post("/api/sessions/delete", async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    if (!userId || !sessionId) {
      return res.status(400).json({ error: "userId and sessionId are required." });
    }
    await deleteSession(userId, sessionId);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Delete session error:", err);
    res.status(500).json({ error: "Failed to delete session." });
  }
});

// 6. Resume Text Extraction API for PDF/DOCX
app.post("/api/parse-resume", express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
  try {
    const fileType = req.query.type as string;
    const buffer = req.body;

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: "Empty file buffer received." });
    }

    let extractedText = "";

    if (fileType === "pdf") {
      const parser = new pdfParse.PDFParse({ data: buffer });
      const result = await parser.getText();
      extractedText = result.text;
      await parser.destroy();
    } else if (fileType === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type. Use 'pdf' or 'docx'." });
    }

    res.json({ text: extractedText });
  } catch (err: any) {
    console.error("Resume parsing error:", err);
    res.status(500).json({ error: err.message || "Failed to parse file." });
  }
});

// Integrate Vite Middleware for dev or serve static assets in production
async function startServer() {
  // Initialize Database connection on start (handles MongoDB or local fallback)
  await connectDb();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
