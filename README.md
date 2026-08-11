# AI English Coach

A full-stack AI-powered application designed to help non-native speakers practice and improve their spoken English. The application provides an interactive voice-based conversation interface where the AI acts as a patient, encouraging language coach.

## Live Links

- **Frontend Application (Vercel):** [https://ai-english-coach-jet.vercel.app](https://ai-english-coach-jet.vercel.app)
- **Backend API (Render):** [https://ai-english-coach-60k7.onrender.com](https://ai-english-coach-60k7.onrender.com)

## Tech Stack

### Frontend
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Voice Capabilities:** Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

### Backend
- **Framework:** Node.js + Express
- **Language:** TypeScript
- **WebSockets:** `ws` (for real-time streaming audio interactions)
- **Database:** Supabase (PostgreSQL)
- **AI Model:** Google Gemini (via `@google/generative-ai`)

## Features
- **Real-Time Voice Chat:** Speak to the AI and receive verbal responses.
- **Dynamic Scenarios:** Practice specific situations like job interviews, ordering at a restaurant, or casual small talk.
- **Progress Tracking:** Analyzes vocabulary and grammar to dynamically update your proficiency level.
- **RAG Document Context:** Upload resumes or job descriptions to conduct highly-contextualized mock interviews.

## Local Setup

### 1. Database
Set up a Supabase project and run the SQL migration located in `backend/schema.sql`.

### 2. Environment Variables
You will need to create a `.env` file in both the `frontend` and `backend` directories.

**Backend `.env`**
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`**
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the App
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```
