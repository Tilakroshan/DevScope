import { useMemo, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const MODE = {
  GITHUB: "github",
  README: "readme",
};

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#c084fc", "#f87171"];

function App() {
  const [mode, setMode] = useState("");
  const [username, setUsername] = useState("");
  const [repo, setRepo] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [readmeSummary, setReadmeSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const languageChart = useMemo(() => {
    if (!analysis?.languageDistribution) return [];
    return Object.entries(analysis.languageDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [analysis]);

  const analyzeGithub = async (event) => {
    event.preventDefault();
    if (!username.trim()) return;
    setError("");
    setLoading(true);
    setAnalysis(null);
    setInsights(null);
    try {
      const { data } = await axios.get(`/api/analyze/${username.trim()}`);
      setAnalysis(data);
      const insightResponse = await axios.post("/api/insights", { profileData: data });
      setInsights(insightResponse.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to analyze GitHub profile.");
    } finally {
      setLoading(false);
    }
  };

  const summarizeReadme = async (event) => {
    event.preventDefault();
    if (!repo.trim()) return;
    setError("");
    setLoading(true);
    setReadmeSummary(null);
    try {
      const readmeResponse = await axios.get(`/api/readme?repo=${encodeURIComponent(repo.trim())}`);
      const summaryResponse = await axios.post("/api/summarize-readme", {
        readme: readmeResponse.data.readme,
      });
      setReadmeSummary(summaryResponse.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to summarize repository README.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">DevScope</h1>
          <p className="mt-3 text-slate-300">Developer Intelligence Platform</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMode(MODE.GITHUB);
                setError("");
                setReadmeSummary(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === MODE.GITHUB
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              GitHub Analysis
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(MODE.README);
                setError("");
                setAnalysis(null);
                setInsights(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === MODE.README
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              README Summary
            </button>
          </div>
        </header>

        {mode === MODE.GITHUB && (
          <section className="space-y-6 transition-all duration-300">
            <form
              onSubmit={analyzeGithub}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg"
            >
              <label className="mb-2 block text-sm text-slate-300">GitHub Username</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. tilakroshan"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Analyzing..." : "Analyze"}
                </button>
              </div>
            </form>

            {analysis && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                  <h2 className="mb-4 text-lg font-semibold">DevScore</h2>
                  <p className="text-5xl font-bold text-blue-400">{analysis.devScore}</p>
                  <p className="mt-2 text-sm text-slate-300">Score range: 0-100</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                  <h2 className="mb-4 text-lg font-semibold">Language Distribution</h2>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={languageChart} dataKey="value" nameKey="name" outerRadius={100} label>
                          {languageChart.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
                  <h2 className="mb-4 text-lg font-semibold">Top Repositories</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {analysis.topRepositories.map((repository) => (
                      <article key={repository.name} className="rounded-lg border border-slate-700 p-4">
                        <h3 className="font-semibold text-blue-300">{repository.name}</h3>
                        <p className="mt-2 text-sm text-slate-300">
                          {repository.description || "No description provided."}
                        </p>
                        <div className="mt-3 flex gap-4 text-sm text-slate-300">
                          <span>Stars: {repository.stars}</span>
                          <span>Forks: {repository.forks}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                {insights && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
                    <h2 className="mb-3 text-lg font-semibold">AI Insights</h2>
                    <p className="text-slate-200">{insights.skillSummary}</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                      {insights.improvementSuggestions.map((suggestion) => (
                        <li key={suggestion}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {mode === MODE.README && (
          <section className="space-y-6 transition-all duration-300">
            <form
              onSubmit={summarizeReadme}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg"
            >
              <label className="mb-2 block text-sm text-slate-300">Repository (owner/repo)</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g. tilakroshan/DevScope"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Summarizing..." : "Summarize"}
                </button>
              </div>
            </form>

            {readmeSummary && (
              <div className="grid gap-6">
                <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                  <h2 className="mb-2 text-lg font-semibold">Project Summary</h2>
                  <p className="text-slate-200">{readmeSummary.summary}</p>
                </article>
                <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                  <h2 className="mb-2 text-lg font-semibold">Features</h2>
                  <ul className="list-disc space-y-1 pl-5 text-slate-300">
                    {readmeSummary.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </article>
                <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                  <h2 className="mb-2 text-lg font-semibold">Tech Stack</h2>
                  <ul className="list-disc space-y-1 pl-5 text-slate-300">
                    {readmeSummary.techStack.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </article>
              </div>
            )}
          </section>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-rose-300">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
