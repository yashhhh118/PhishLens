"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [maxResults, setMaxResults] = useState(20);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-300 text-lg animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setResults(null);
    setExpandedIdx(null);
    try {
      const res = await fetch("http://localhost:8000/gmail/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: session.accessToken,
          max_results: maxResults,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Server responded with ${res.status}`);
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setScanning(false);
    }
  };

  const emails = results?.emails ?? results?.results ?? [];
  const summary = {
    total: emails.length,
    safe: emails.filter((e) => (e.analysis?.verdict ?? "").toLowerCase() === "safe").length,
    suspicious: emails.filter((e) => (e.analysis?.verdict ?? "").toLowerCase() === "suspicious").length,
    highRisk: emails.filter((e) => {
      const v = (e.analysis?.verdict ?? "").toLowerCase();
      return v === "high risk" || v === "high_risk" || v === "dangerous";
    }).length,
  };

  const verdictColor = (verdict) => {
    const v = (verdict ?? "").toLowerCase();
    if (v === "safe") return "bg-emerald-600 text-emerald-100";
    if (v === "suspicious") return "bg-yellow-600 text-yellow-100";
    return "bg-red-600 text-red-100";
  };

  const riskBarColor = (score) => {
    if (score <= 30) return "bg-emerald-500";
    if (score <= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              🛡️ PhishLens <span className="text-gray-500 font-normal text-sm">Dashboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-200">{session.user?.name}</p>
              <p className="text-xs text-gray-500">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors cursor-pointer border border-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Scan Controls */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="maxResults" className="text-sm font-medium text-gray-400">
              Emails to scan
            </label>
            <select
              id="maxResults"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={20}>20 emails</option>
              <option value={50}>50 emails</option>
              <option value={100}>100 emails</option>
            </select>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors cursor-pointer"
          >
            {scanning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Scanning…
              </span>
            ) : (
              "🔍 Scan My Inbox"
            )}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-xl px-5 py-4 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Summary Cards */}
        {results && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Scanned", value: summary.total, color: "text-indigo-400", border: "border-indigo-500/30" },
              { label: "Safe", value: summary.safe, color: "text-emerald-400", border: "border-emerald-500/30" },
              { label: "Suspicious", value: summary.suspicious, color: "text-yellow-400", border: "border-yellow-500/30" },
              { label: "High Risk", value: summary.highRisk, color: "text-red-400", border: "border-red-500/30" },
            ].map((card) => (
              <div
                key={card.label}
                className={`bg-gray-900 border ${card.border} rounded-xl p-5 text-center`}
              >
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{card.label}</p>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </section>
        )}

        {/* Email List */}
        {results && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-300">Scanned Emails</h2>
            {emails.length === 0 && (
              <p className="text-gray-500 text-sm">No emails found.</p>
            )}
            {emails.map((email, idx) => {
              const verdict = email.analysis?.verdict ?? "Unknown";
              const score = email.analysis?.score ?? 0;
              const isExpanded = expandedIdx === idx;

              return (
                <div
                  key={idx}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all"
                >
                  {/* Row */}
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-800/60 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{email.subject ?? "No Subject"}</p>
                      <p className="text-xs text-gray-500 truncate">{email.sender ?? email.from ?? "Unknown sender"}</p>
                    </div>

                    {/* Risk Score Bar */}
                    <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${riskBarColor(score)}`}
                          style={{ width: `${Math.min(score, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{score}%</span>
                    </div>

                    {/* Verdict Badge */}
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${verdictColor(verdict)}`}>
                      {verdict}
                    </span>

                    {/* Chevron */}
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 px-5 py-4 space-y-3 bg-gray-900/50">
                      {email.analysis?.category && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">Category</p>
                          <p className="text-sm text-gray-300">{email.analysis.category}</p>
                        </div>
                      )}

                      {email.analysis?.summary && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">Summary</p>
                          <p className="text-sm text-gray-300">{email.analysis.summary}</p>
                        </div>
                      )}

                      {email.analysis?.reasons?.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Reasons</p>
                          <ul className="space-y-1">
                            {email.analysis.reasons.map((reason, rIdx) => (
                              <li key={rIdx} className="text-sm text-gray-400 flex items-start gap-2">
                                <span className="text-yellow-500 mt-0.5">⚠</span>
                                <span>{typeof reason === "string" ? reason : reason.description ?? JSON.stringify(reason)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
