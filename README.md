# DevScope

DevScope is a full-stack developer analytics platform with two workflows:

- **GitHub Analysis Mode**: Enter a GitHub username to view language distribution, top repositories, DevScore, and AI insights.
- **README Summary Mode**: Enter a repository (`owner/repo`) to generate a concise AI summary, features, and tech stack.

## Stack

- Frontend: React + Vite + Tailwind CSS + Recharts
- Backend: Node.js + Express
- APIs: GitHub REST API + Google Gemini API

## Setup

1. Install dependencies:
   - `npm install`
   - `npm --prefix server install`
2. Configure backend environment:
   - Copy `server/.env.example` to `server/.env`
   - Add `GEMINI_API_KEY` (required)
   - Add `GITHUB_TOKEN` (optional but recommended to avoid low API rate limits)
3. Start both frontend and backend:
   - `npm run dev:full`

Frontend runs on `http://localhost:5173` and proxies API requests to backend on `http://localhost:5000`.

## API Routes

- `GET /api/analyze/:username`
- `POST /api/insights`
- `GET /api/readme?repo=owner/repo`
- `POST /api/summarize-readme`

## Notes

- Raw README text is never displayed in the UI.
- The AI prompt explicitly avoids job-role predictions.
- Invalid username/repository and missing README cases are handled with user-friendly errors.
