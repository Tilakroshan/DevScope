const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  },
});

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const parseGeminiJson = (rawText) => {
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  const startIndex = cleaned.indexOf("{");
  const endIndex = cleaned.lastIndexOf("}");
  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Gemini response is not valid JSON.");
  }
  return JSON.parse(cleaned.slice(startIndex, endIndex + 1));
};

function calculateDevScore(repos) {
  const repoCount = repos.length;
  const now = new Date();
  const recentActiveRepos = repos.filter((repo) => {
    const daysSincePush = (now - new Date(repo.pushed_at)) / (1000 * 60 * 60 * 24);
    return daysSincePush <= 90;
  }).length;

  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const averageAgeDays =
    repoCount === 0
      ? 365
      : repos.reduce((sum, repo) => {
          const age = (now - new Date(repo.created_at)) / (1000 * 60 * 60 * 24);
          return sum + age;
        }, 0) / repoCount;

  const activityScore = clamp((recentActiveRepos / Math.max(repoCount, 1)) * 30, 0, 30);
  const consistencyScore = clamp((365 / Math.max(averageAgeDays, 30)) * 20, 0, 20);
  const impactScore = clamp(Math.log10(totalStars + totalForks + 1) * 20, 0, 20);
  const volumeScore = clamp(Math.min(repoCount, 30) / 30 * 30, 0, 30);

  return Math.round(activityScore + consistencyScore + impactScore + volumeScore);
}

function buildLanguageDistribution(repos) {
  const totals = {};
  repos.forEach((repo) => {
    const language = repo.language || "Other";
    totals[language] = (totals[language] || 0) + 1;
  });
  const totalRepos = repos.length || 1;
  return Object.fromEntries(
    Object.entries(totals).map(([language, count]) => [language, Number(((count / totalRepos) * 100).toFixed(1))]),
  );
}

app.get("/api/analyze/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const { data: repos } = await githubApi.get(`/users/${username}/repos`, {
      params: {
        per_page: 100,
        sort: "updated",
      },
    });

    if (!repos.length) {
      return res.status(404).json({ error: "No repositories found for this user." });
    }

    const topRepositories = [...repos]
      .sort((a, b) => {
        const scoreA = a.stargazers_count * 2 + a.forks_count + Date.parse(a.pushed_at) / 1e11;
        const scoreB = b.stargazers_count * 2 + b.forks_count + Date.parse(b.pushed_at) / 1e11;
        return scoreB - scoreA;
      })
      .slice(0, 6)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
      }));

    return res.json({
      username,
      repositoryCount: repos.length,
      languageDistribution: buildLanguageDistribution(repos),
      topRepositories,
      devScore: calculateDevScore(repos),
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "GitHub user not found." });
    }
    return res.status(500).json({ error: "Unable to fetch GitHub profile data." });
  }
});

app.post("/api/insights", async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing." });
  }

  const { profileData } = req.body;
  if (!profileData) {
    return res.status(400).json({ error: "profileData is required." });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Analyze this GitHub profile data and return JSON only.
Do not predict job roles.
Return in this format:
{
  "skillSummary": "2-3 concise lines",
  "improvementSuggestions": ["bullet 1", "bullet 2", "bullet 3"]
}

Data:
${JSON.stringify(profileData, null, 2)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseGeminiJson(text);
    return res.json({
      skillSummary: parsed.skillSummary || "No summary available.",
      improvementSuggestions: Array.isArray(parsed.improvementSuggestions)
        ? parsed.improvementSuggestions
        : ["No suggestions provided."],
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate AI insights." });
  }
});

app.get("/api/readme", async (req, res) => {
  const { repo } = req.query;
  if (!repo || !repo.includes("/")) {
    return res.status(400).json({ error: "Provide repo as owner/repo." });
  }

  const [owner, name] = repo.split("/");
  try {
    const { data } = await githubApi.get(`/repos/${owner}/${name}/readme`);
    const readme = Buffer.from(data.content, "base64").toString("utf8");
    return res.json({ readme });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Repository or README not found." });
    }
    return res.status(500).json({ error: "Unable to fetch README." });
  }
});

app.post("/api/summarize-readme", async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing." });
  }

  const { readme } = req.body;
  if (!readme?.trim()) {
    return res.status(400).json({ error: "readme text is required." });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Analyze the following README content.
Return ONLY JSON:
{
  "summary": "short explanation (2-4 lines)",
  "features": ["key feature"],
  "techStack": ["detected technology"]
}
Do not copy text. Do not add extra explanation.

README:
${readme}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseGeminiJson(text);
    return res.json({
      summary: parsed.summary || "Summary unavailable.",
      features: Array.isArray(parsed.features) ? parsed.features : [],
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to summarize README." });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DevScope server running on port ${PORT}`);
});
