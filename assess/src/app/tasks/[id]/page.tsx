"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, Check, ChevronRight, X, Trophy, List, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TaskDetailPage() {
  const params = useParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"table" | "leaderboard">("table");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<{ id: string, field: string } | null>(null);
  
  // Real dynamic states populated from backend query 
  const [task, setTask] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTaskDetails = async () => {
      try {
        const response = await fetch(`/api/tasks/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setTask(data.task);
          setCandidates(data.task.candidates || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTaskDetails();
  }, [params.id]);

  const handleCopy = (type: string) => {
    setCopiedLink(type);
    setToastMessage(`Copied link token parameter: /test/${params.id}_${type}`);
    setTimeout(() => {
      setCopiedLink(null);
      setToastMessage(null);
    }, 3000);
  };

  const updateScore = (id: string, field: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setCandidates(candidates.map(c => c.id === id ? { ...c, [field]: numValue } : c));
    }
    setEditingScore(null);
  };

  const renderScoreChip = (score: number | null, id: string, field: string) => {
    if (score === null) return <span className="text-text-muted">-</span>;
    let colorClass = "bg-red-500/20 text-red-400";
    if (score >= 70) colorClass = "bg-success/20 text-success";
    else if (score >= 40) colorClass = "bg-yellow-500/20 text-yellow-400";

    if (editingScore?.id === id && editingScore?.field === field) {
      return (
        <input
          autoFocus
          defaultValue={score}
          onBlur={(e) => updateScore(id, field, e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateScore(id, field, (e.target as HTMLInputElement).value)}
          className="w-16 bg-black border border-accent rounded px-2 py-0.5 text-xs text-text-primary text-center outline-none"
        />
      );
    }

    return (
      <button 
        onClick={() => setEditingScore({ id, field })}
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass} hover:opacity-80 transition-opacity`}
      >
        {score}%
      </button>
    );
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-mono text-text-muted text-sm animate-pulse">Querying server task matrix logs...</div>;
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-mono text-destructive">Record not found inside active database clusters.</p>
        <Link href="/dashboard" className="text-xs text-accent underline">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative">
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-6 right-6 z-50 bg-surface border border-border text-text-primary px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm">
            <Check className="w-4 h-4 text-success" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-text-primary mb-2 capitalize">{task.title}</h1>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-text-muted">Database Token: {task.id}</span>
                <span className="px-2 py-0.5 rounded-full bg-border text-text-muted text-[10px] font-semibold uppercase tracking-wider">{task.workType} · {task.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[#0A0A0A] border border-border rounded-xl p-6 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-text-primary">Job Description</h3>
              <button onClick={() => setIsDrawerOpen(true)} className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View JD Facets <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <pre className="font-mono text-sm text-text-muted whitespace-pre-wrap font-sans">{task.jdText}</pre>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {[
              { id: 'aptitude', title: 'Aptitude Test', desc: 'Cognitive criteria parameters built from target Job Description values.', link: `/tasks/${params.id}/aptitude/edit` },
              { id: 'domain', title: 'Domain Test', desc: 'Role-specific technical problems mapped directly to core stack definitions.', link: `/tasks/${params.id}/domain/edit` },
              { id: 'interview', title: 'Interview Script', desc: 'Dynamic alignment prompts generated for human panel technical evaluators.', link: `/tasks/${params.id}/interview` },
            ].map((artifact) => (
              <div key={artifact.id} className="bg-[#0A0A0A] border border-border rounded-xl p-6 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-text-primary">{artifact.title}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent/20 text-accent">Active</span>
                </div>
                <p className="text-sm text-text-muted mb-6 flex-1">{artifact.desc}</p>
                <div className="flex flex-col gap-2">
                  <Link href={artifact.link}>
                    <button className="w-full h-10 bg-text-primary hover:bg-white text-black rounded-lg font-medium text-sm transition-all shadow-sm">
                      {artifact.id === 'interview' ? 'View Script' : 'View and Edit'}
                    </button>
                  </Link>
                  <button onClick={() => handleCopy(artifact.id)} className="w-full h-10 bg-transparent border border-border hover:bg-surface text-text-primary rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2">
                    {copiedLink === artifact.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    {copiedLink === artifact.id ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-text-primary flex items-center gap-2"><Users className="w-5 h-5 text-text-muted" /> Applicant Pipeline Log</h2>
            <div className="flex p-1 bg-surface border border-border rounded-lg">
              <button onClick={() => setActiveTab("table")} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "table" ? "bg-accent text-white shadow" : "text-text-muted hover:text-text-primary"}`}><List className="w-4 h-4" /> Table</button>
              <button onClick={() => setActiveTab("leaderboard")} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "leaderboard" ? "bg-accent text-white shadow" : "text-text-muted hover:text-text-primary"}`}><Trophy className="w-4 h-4" /> Leaderboard</button>
            </div>
          </div>

          {activeTab === "table" ? (
            <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-[#0A0A0A]">
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Candidate Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Aptitude Rating</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Domain Skill Rating</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Interview Performance</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Weighted Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-black/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">{c.name}</td>
                      <td className="px-6 py-4 text-center">{renderScoreChip(c.aptScore, c.id, 'aptScore')}</td>
                      <td className="px-6 py-4 text-center">{renderScoreChip(c.domScore, c.id, 'domScore')}</td>
                      <td className="px-6 py-4 text-center">{renderScoreChip(c.intScore, c.id, 'intScore')}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-accent">{c.overall}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
              {[...candidates].sort((a, b) => (b.overall || 0) - (a.overall || 0)).map((c, index) => (
                <div key={c.id} className="flex items-center gap-4">
                  <div className="w-6 text-center font-mono text-text-muted text-sm">{index + 1}</div>
                  <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center flex-shrink-0 text-xs font-bold text-text-primary">{c.name.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-text-primary">{c.name}</span>
                      <span className="font-mono text-text-primary">{c.overall || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-border">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${c.overall || 0}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-accent rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface border-l border-l-border z-50 p-6 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-medium text-text-primary">AI JD Extraction</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-border"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Isolated Metadata Token</h3>
                  <span className="font-mono text-xs text-accent select-all">{task.id}</span>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Job Structure Configuration</h3>
                  <p className="text-sm text-text-primary leading-relaxed">This evaluation pathway is actively driving structured multi-stage assessments dynamically fetched from the application runtime kernel node parameters.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}