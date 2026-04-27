
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


## DevScope UI
Github Analyze
<img width="1697" height="832" alt="Screenshot 2026-04-27 221156" src="https://github.com/user-attachments/assets/5774ced5-94dc-4c99-9301-bca53192030a" />
README summary
<img width="1675" height="752" alt="Screenshot 2026-04-27 221254" src="https://github.com/user-attachments/assets/4dee920c-1155-47e2-b2b2-202330c6b614" />

