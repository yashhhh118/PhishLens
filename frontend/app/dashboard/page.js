"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ── Scan handler ──────────────────────────────────────────────────────
  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setExpandedId(null);

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
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Server error (${res.status})`);
      }

      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────
  const stats = results
    ? {
        total: results.length,
        safe: results.filter((r) => r.analysis?.verdict === "Safe").length,
        suspicious: results.filter(
          (r) => r.analysis?.verdict === "Suspicious"
        ).length,
        highRisk: results.filter(
          (r) => r.analysis?.verdict === "High Risk"
        ).length,
      }
    : null;

  // ── Loading state ─────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-gray-400 text-sm">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ─── Top bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-gray-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold">
              PL
            </div>
            <span className="text-lg font-semibold tracking-tight">
              PhishLens
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">
                {session.user?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {session.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main content ────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* ── Welcome + scan controls ─────────────────────────────────── */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Scan My Inbox
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Select how many recent emails to scan and click{" "}
            <span className="text-indigo-400 font-medium">Scan Now</span>.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              disabled={loading}
              className="rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value={20}>20 emails</option>
              <option value={50}>50 emails</option>
              <option value={100}>100 emails</option>
            </select>

            <button
              onClick={handleScan}
              disabled={loading}
              className="relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Spinner size="sm" />}
              {loading ? "Scanning…" : "Scan Now"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </section>

        {/* ── Loading indicator ───────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Spinner size="lg" />
            <p className="text-gray-400 text-sm animate-pulse">
              Fetching and analysing your emails — this may take a moment…
            </p>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────── */}
        {stats && !loading && (
          <>
            {/* ── Summary cards ──────────────────────────────────────── */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Scanned"
                value={stats.total}
                color="text-white"
                bg="from-gray-800 to-gray-900"
              />
              <StatCard
                label="Safe"
                value={stats.safe}
                color="text-emerald-400"
                bg="from-emerald-500/10 to-emerald-500/5"
              />
              <StatCard
                label="Suspicious"
                value={stats.suspicious}
                color="text-amber-400"
                bg="from-amber-500/10 to-amber-500/5"
              />
              <StatCard
                label="High Risk"
                value={stats.highRisk}
                color="text-red-400"
                bg="from-red-500/10 to-red-500/5"
              />
            </section>

            {/* ── Email list ─────────────────────────────────────────── */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Scanned Emails
              </h2>

              <div className="space-y-2">
                {results.map((email) => {
                  const isExpanded = expandedId === email.id;
                  const v = email.analysis?.verdict ?? "Unknown";
                  return (
                    <div key={email.id}>
                      {/* Row */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : email.id)
                        }
                        className={`w-full text-left rounded-xl border transition-all
                          ${
                            isExpanded
                              ? "border-indigo-500/40 bg-white/[0.04]"
                              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                          }
                          px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4`}
                      >
                        {/* Subject + sender */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">
                            {email.subject || "(no subject)"}
                          </p>
                          <p className="truncate text-xs text-gray-500 mt-0.5">
                            {email.sender}
                          </p>
                        </div>

                        {/* Score */}
                        <span className="text-xs text-gray-500 tabular-nums">
                          Score: {email.analysis?.score ?? "–"}
                        </span>

                        {/* Badge */}
                        <VerdictBadge verdict={v} />

                        {/* Chevron */}
                        <svg
                          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <AnalysisDetail analysis={email.analysis} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ label, value, color, bg }) {
  return (
    <div
      className={`rounded-xl border border-white/5 bg-gradient-to-b ${bg} p-5`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const styles = {
    Safe: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Suspicious: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    "High Risk": "bg-red-500/15 text-red-400 border-red-500/20",
  };
  const cls =
    styles[verdict] || "bg-gray-500/15 text-gray-400 border-gray-500/20";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {verdict}
    </span>
  );
}

function AnalysisDetail({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="mt-1 rounded-xl border border-white/5 bg-white/[0.02] px-6 py-5 space-y-4 text-sm">
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <span className="text-gray-500">Risk Score</span>{" "}
          <span className="font-bold text-lg tabular-nums">
            {analysis.score}
          </span>
          <span className="text-gray-600">/100</span>
        </div>
        <VerdictBadge verdict={analysis.verdict} />
        <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
          {analysis.category}
        </span>
      </div>

      {/* Summary */}
      <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>

      {/* Reasons */}
      {analysis.reasons?.length > 0 && (
        <div>
          <p className="font-medium text-gray-400 mb-2">Signals detected</p>
          <ul className="space-y-1.5">
            {analysis.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-400">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Spinner({ size = "md" }) {
  const dims = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  return (
    <svg
      className={`${dims} animate-spin text-indigo-400`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
