"use client";

import { useState } from "react";

const VERDICT_STYLES = {
  Safe: {
    badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
    ring: "ring-emerald-500/30",
    glow: "shadow-emerald-500/20",
    bar: "bg-emerald-500",
    icon: "✓",
  },
  Suspicious: {
    badge: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
    ring: "ring-amber-500/30",
    glow: "shadow-amber-500/20",
    bar: "bg-amber-500",
    icon: "⚠",
  },
  "High Risk": {
    badge: "bg-red-500/20 text-red-400 border border-red-500/40",
    ring: "ring-red-500/30",
    glow: "shadow-red-500/20",
    bar: "bg-red-500",
    icon: "✕",
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("message");
  const [messageText, setMessageText] = useState("");
  const [urlText, setUrlText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleScan() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let endpoint, body;

      if (activeTab === "message") {
        endpoint = "http://localhost:8000/scan/text";
        body = { text: messageText };
      } else {
        endpoint = "http://localhost:8000/scan/url";
        body = { url: urlText };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message || "Failed to reach backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  const style = result ? VERDICT_STYLES[result.verdict] ?? VERDICT_STYLES["Suspicious"] : null;
  const inputIsEmpty = activeTab === "message" ? !messageText.trim() : !urlText.trim();

  return (
    <div className="min-h-screen bg-[#080b14] text-white font-sans">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080b14]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          {/* Shield icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            PhishLens
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#scanner" className="hover:text-white transition-colors">Scanner</a>
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="/login" className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">Sign In</a>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            API Online
          </span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center pt-40 pb-20 px-6 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            AI-Powered Phishing Detection
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">
            <span className="text-white">Detect Phishing.</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Stay Safe.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Paste a suspicious message or URL below. PhishLens analyses it in real-time using
            keyword detection, domain reputation, typosquatting checks, and more.
          </p>
        </div>
      </section>

      {/* ── Scanner Card ── */}
      <section id="scanner" className="relative flex justify-center px-4 pb-24">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-sm">

            {/* Tab Bar */}
            <div className="flex border-b border-white/10">
              {[
                { id: "message", label: "Scan Message", icon: "✉" },
                { id: "url",     label: "Scan URL",     icon: "🔗" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => { setActiveTab(tab.id); setResult(null); setError(null); }}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/5"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 space-y-4">
              {activeTab === "message" ? (
                <div className="relative">
                  <textarea
                    id="message-input"
                    rows={6}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Paste suspicious email or message here…
e.g. 'Urgent! Your account has been compromised. Click here to verify: http://paypa1.com/secure'"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-slate-200 placeholder-slate-600 px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 text-sm">
                    https://
                  </div>
                  <input
                    id="url-input"
                    type="url"
                    value={urlText}
                    onChange={(e) => setUrlText(e.target.value)}
                    placeholder="paste-suspicious-url.com/path"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-slate-200 placeholder-slate-600 pl-[72px] pr-4 py-4 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              )}

              <button
                id="scan-btn"
                onClick={handleScan}
                disabled={loading || inputIsEmpty}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                  loading || inputIsEmpty
                    ? "bg-blue-600/30 text-blue-400/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analysing…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    Scan Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              <span className="text-base leading-none mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Results ── */}
          {result && style && (
            <div className={`mt-6 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden shadow-xl ${style.glow} shadow-2xl`}>

              {/* Score header */}
              <div className={`p-6 border-b border-white/10 flex items-center justify-between gap-4`}>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Risk Score</p>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-black tabular-nums leading-none text-white">
                      {result.score}
                    </span>
                    <span className="text-slate-500 text-lg mb-1">/ 100</span>
                  </div>
                  {/* Score bar */}
                  <div className="mt-3 w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold ${style.badge}`}>
                    <span>{style.icon}</span>
                    {result.verdict}
                  </span>
                  <p className="text-xs text-slate-500">
                    Category: <span className="text-slate-300 font-medium">{result.category}</span>
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="px-6 pt-5 pb-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Summary</p>
                <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
              </div>

              {/* Reasons */}
              {result.reasons && result.reasons.length > 0 && (
                <div className="px-6 pb-6">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">
                    Detection Signals ({result.reasons.length})
                  </p>
                  <ul className="space-y-2">
                    {result.reasons.map((reason, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-slate-300 bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/5"
                      >
                        <span className="text-blue-400 mt-0.5 shrink-0">›</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.reasons && result.reasons.length === 0 && (
                <div className="px-6 pb-6">
                  <p className="text-sm text-slate-500 italic">No specific signals detected.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 text-center py-6 text-xs text-slate-600">
        © {new Date().getFullYear()} PhishLens · Built to keep you safe online
      </footer>
    </div>
  );
}
