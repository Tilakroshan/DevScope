# DevScope

DevScope is a full-stack developer analytics platform with two workflows:

- **GitHub Analysis Mode**: Enter a GitHub username to view language distribution, top repositories, DevScore, and AI insights.
- **README Summary Mode**: Enter a repository (`owner/repo`) to generate a concise AI summary, features, and tech stack.

## Features

- GitHub profile analysis
- Language usage distribution
- Top repositories ranking
- DevScore (0–100)
- AI-based skill summary
- AI suggestions for improvement
- README summarization for repositories


## Stack

- Frontend: React + Vite + Tailwind CSS + Recharts
- Backend: Node.js + Express
- APIs: GitHub REST API + Google Gemini API

## Setup

1. Install dependencies:
   - `npm install`
   - `npm --prefix server install`
2. Configure backend environment:
   - In `server/.env`
   - Add `GEMINI_API_KEY` 
   - Add `GITHUB_TOKEN`
3. Start Project:
   - `npm run dev:full`

Frontend runs on `http://localhost:5173` and proxies API requests to backend on `http://localhost:5000`.

## How It Works

1. User enters GitHub username or repository
2. Backend fetches data using GitHub API
3. AI processes data and generates insights
4. Frontend displays structured results
