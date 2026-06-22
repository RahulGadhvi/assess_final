"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Copy, Check, Users, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CandidateRecord {
  id: string;
  name: string;
  aptScore: number | null;
  domScore: number | null;
  intScore: number | null;
  overall: number | null;
}

interface TaskDetail {
  id: string;
  title: string;
  location: string;
  workType: string;
  candidates?: CandidateRecord[];
}

export default function TaskDetailPage() {
  const params = useParams();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<{ id: string; field: string } | null>(null);
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTaskDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        setCandidates(data.task.candidates || []);
      }
    } catch {
      console.error("Error loading task");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadTaskDetails();
  }, [loadTaskDetails]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTaskDetails();
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = (type: string) => {
    const domain = typeof window !== "undefined" ? window.location.origin : "";
    const computedLink = `${domain}/test/${params.id}_${type}`;
    navigator.clipboard.writeText(computedLink);
    triggerToast(`Copied ${type} test link.`);
  };

  const updateCandidateScore = async (candidateId: string, field: string, value: string) => {
    const numValue = value.trim() === "" ? null : parseInt(value);
    if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
      setEditingScore(null);
      return;
    }

    const updatedCandidates = candidates.map((c) => {
      if (c.id === candidateId) {
        const nextState = { ...c, [field]: numValue };
        const scores = [nextState.aptScore, nextState.domScore, nextState.intScore].filter(s => s !== null) as number[];
        nextState.overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return nextState;
      }
      return c;
    });

    setCandidates(updatedCandidates);
    setEditingScore(null);

    try {
      await fetch(`/api/tasks/${params.id}/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: numValue }),
      });
      triggerToast("Score saved.");
    } catch {
      console.error("Error saving score");
    }
  };

  const renderScoreChip = (score: number | null, id: string, field: string) => {
    if (editingScore?.id === id && editingScore?.field === field) {
      return (
        <input
          autoFocus
          type="number"
          min="0"
          max="100"
          defaultValue={score !== null ? score : ""}
          placeholder="--"
          onBlur={(e) => updateCandidateScore(id, field, e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateCandidateScore(id, field, (e.target as HTMLInputElement).value)}
          className="w-16 bg-black border border-accent rounded px-2 py-0.5 text-xs text-text-primary text-center outline-none"
        />
      );
    }

    if (score === null) {
      return (
        <button
          onClick={() => setEditingScore({ id, field })}
          className="text-text-muted hover:text-text-primary text-xs transition-colors border border-border border-dashed px-2 py-0.5 rounded"
        >
          Add
        </button>
      );
    }

    let colorClass = "bg-red-500/10 text-red-400 border border-red-500/20";
    if (score >= 70) colorClass = "bg-success/10 text-success border border-success/20";
    else if (score >= 40) colorClass = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";

    return (
      <button
        onClick={() => setEditingScore({ id, field })}
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        {score}%
      </button>
    );
  };

  if (isLoading || !task) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-text-muted text-xs gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-accent" />
        <span>Loading task...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative text-text-primary">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface border border-border text-text-primary px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs">
          <Check className="w-4 h-4 text-success" /> {toastMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{task.title}</h1>
              <p className="text-xs text-text-muted mt-1 capitalize">
                {task.workType} &middot; {task.location} &middot;{" "}
                <span className="text-accent">ID: {task.id}</span>
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-10 px-4 border border-border hover:bg-surface text-text-primary rounded-lg text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0A0A0A] border border-border rounded-xl p-6 flex flex-col justify-between h-[180px]">
            <div>
              <h3 className="text-xs text-text-muted mb-2">Aptitude Test</h3>
              <p className="text-sm text-text-primary font-medium">Cognitive aptitude assessment</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/tasks/${params.id}/aptitude/edit`} className="flex-1">
                <button className="w-full h-10 bg-surface border border-border hover:border-text-muted text-text-primary rounded-lg text-xs transition-colors">Review Questions</button>
              </Link>
              <button onClick={() => handleCopyLink("aptitude")} className="h-10 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs transition-colors flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-border rounded-xl p-6 flex flex-col justify-between h-[180px]">
            <div>
              <h3 className="text-xs text-text-muted mb-2">Domain Test</h3>
              <p className="text-sm text-text-primary font-medium">Technical knowledge assessment</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/tasks/${params.id}/domain/edit`} className="flex-1">
                <button className="w-full h-10 bg-surface border border-border hover:border-text-muted text-text-primary rounded-lg text-xs transition-colors">Review Questions</button>
              </Link>
              <button onClick={() => handleCopyLink("domain")} className="h-10 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs transition-colors flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-border rounded-xl p-6 flex flex-col justify-between h-[180px]">
            <div>
              <h3 className="text-xs text-accent mb-2">Interview</h3>
              <p className="text-sm text-text-primary font-medium">Structured interview evaluation</p>
            </div>
            <div className="text-xs text-text-muted bg-surface/50 border border-border px-3 py-2.5 rounded-lg">
              Launch from candidate list below
            </div>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex items-center mb-4 border-b border-border pb-4">
            <h2 className="text-sm text-text-muted flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" /> Candidates
            </h2>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-black text-xs text-text-muted">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-center">Aptitude</th>
                  <th className="px-6 py-4 text-center">Domain</th>
                  <th className="px-6 py-4 text-center">Interview</th>
                  <th className="px-6 py-4 text-center bg-black/40">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-text-muted">
                      No candidates yet. Share test links to gather results.
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-black/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">
                        <div className="flex flex-col">
                          <span>{c.name}</span>
                          <Link
                            href={`/tasks/${params.id}/interview?candidate=${c.id}`}
                            className="text-xs text-accent hover:underline mt-0.5"
                          >
                            Start Interview
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{renderScoreChip(c.aptScore, c.id, "aptScore")}</td>
                      <td className="px-6 py-4 text-center">{renderScoreChip(c.domScore, c.id, "domScore")}</td>
                      <td className="px-6 py-4 text-center">{renderScoreChip(c.intScore, c.id, "intScore")}</td>
                      <td className="px-6 py-4 text-center font-bold text-accent bg-black/20">{c.overall || 0}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
