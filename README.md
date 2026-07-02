# AuraInterview — AI-Powered Placement Prep Console

AuraInterview is a high-performance web platform designed to prepare candidates for modern software engineering, system design, and database administration technical interviews. Powered by advanced Large Language Models, it generates custom placement prep scenarios, scans resumes for key competencies, and evaluates speech and communication skills natively.

---

## Key Features

- **AI Scenario Generator:** Generate tailored mock interview questions based on specific job descriptions, difficulty levels, and domains (OOPS, DBMS, DSA, System Design).
- **Resume Scanner & Technical Keyword Extractor:** Scan PDF, Word, or plain text resumes. AuraInterview calculates an overall resume score, extracts technical keywords, suggests strengths/improvements, and formulates customized interview questions based on your background.
- **Interactive Interview Arena:** Answer technical questions through typed code/text or by recording voice/video responses, complete with real-time AI grading, speaking pace analysis (WPM), and key point coverage.
- **AI English Communication Coach:** A free, 10-question verbal fluency drill. It uses browser-native text-to-speech (TTS) to read prompts aloud and speech-to-text (STT) to transcribe your responses locally. The AI then evaluates grammar mistakes, suggests vocabulary enhancements, and provides professional re-phrasings.
- **Unified Cloud Sync & Local Fallback:** Supports offline mode with local storage persistence and syncs data to a cloud database (MongoDB Atlas) when logged in.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS, Lucide Icons, Framer Motion
- **Backend:** Node.js, Express
- **AI Integration:** NVIDIA NIM API (`meta/llama-3.1-8b-instruct`)
- **Speech APIs:** Native Web Speech API (Speech Synthesis & Speech Recognition)
- **Database:** MongoDB

---

## Local Setup

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- A terminal shell

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
NVIDIA_API_KEY="your-nvidia-api-key"
MONGODB_URI="your-mongodb-atlas-connection-string"
APP_URL="http://localhost:3000"
```

### 3. Installation
Install the project dependencies:
```bash
npm install
```

### 4. Development Server
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Build and Production Run
Compile client assets and pack the server:
```bash
npm run build
npm run start
```

---

## Multi-Platform Deployment

The application is natively cross-platform and can be deployed to Render, Railway, or Heroku as a unified Node.js web service.

1. **Build Command:** `npm install && npm run build`
2. **Start Command:** `npm start`
3. **Environment Variables:** Provide `NVIDIA_API_KEY` and `MONGODB_URI` inside your hosting console.
