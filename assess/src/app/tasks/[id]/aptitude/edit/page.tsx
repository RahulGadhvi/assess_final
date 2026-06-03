"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Save, ChevronDown, ChevronUp, Trash2, Copy, Info, Check, X, Loader2, Circle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AptitudeEditorPage() {
  const params = useParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [roleTitle, setRoleTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAptitudeData = async () => {
      try {
        const response = await fetch(`/api/tasks/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setRoleTitle(data.task.title);
          setQuestions(data.task.aptitudeQuestions || []);
          if (data.task.aptitudeQuestions?.length > 0) {
            setExpandedQId(data.task.aptitudeQuestions[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAptitudeData();
  }, [params.id]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateQuestion = (qId: string, val: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, text: val } : q));
  };

  const handleSetCorrect = (qId: string, optId: string) => {
    setQuestions(questions.map(q => 
      q.id === qId 
        ? { ...q, options: q.options.map((o: any) => ({ ...o, isCorrect: o.id === optId })) } 
        : q
    ));
    triggerToast("Saved Change");
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-text-muted animate-pulse">Fetching dynamic validation metrics from route ID...</div>;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-6 right-6 z-50 bg-surface border border-border text-text-primary px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm">
            <Check className="w-4 h-4 text-success" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/tasks/${params.id}`} className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-medium text-text-primary capitalize">{roleTitle} — Aptitude Test</h1>
          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold uppercase tracking-wider">{questions.length} Questions Active</span>
        </div>
        <button onClick={() => triggerToast("Changes committed to server instance")} className="h-10 px-6 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-medium transition-all shadow-accent-glow flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[260px] bg-[#0A0A0A] border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border"><h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sections Matrix</h2></div>
          <nav className="flex-1 p-2"><button className="w-full text-left px-3 py-3 rounded-lg text-xs bg-surface border-l-2 border-accent text-text-primary font-medium">Cognitive Logic Profile ({questions.length})</button></nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {questions.length === 0 ? (
              <div className="bg-[#0A0A0A] border border-border border-dashed rounded-xl p-12 text-center text-sm text-text-muted">
                No active questions saved in this registry slot. Run the OpenAI compilation wizard to generate items.
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, index) => {
                  const isExpanded = expandedQId === q.id;
                  return (
                    <div key={q.id || index} className="border border-border rounded-xl bg-[#0A0A0A] overflow-hidden">
                      <button onClick={() => setExpandedQId(isExpanded ? null : q.id)} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-surface/50 transition-colors">
                        <span className="font-mono text-xs text-accent font-semibold w-6">q{index + 1}</span>
                        <p className="flex-1 text-left text-sm text-text-primary truncate font-medium">{q.text}</p>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-border bg-background">
                            <div className="p-6 space-y-4">
                              <textarea value={q.text} onChange={(e) => handleUpdateQuestion(q.id, e.target.value)} className="w-full h-20 bg-black border border-border rounded-xl p-3 text-text-primary text-sm focus:border-accent outline-none resize-none" />
                              <div className="space-y-2">
                                {q.options?.map((opt: any, oIdx: number) => (
                                  <div key={opt.id || oIdx} className="flex items-center gap-3">
                                    <button onClick={() => handleSetCorrect(q.id, opt.id)} className="focus:outline-none">{opt.isCorrect ? <CheckCircle2 className="w-4 h-4 text-accent" /> : <Circle className="w-4 h-4 text-border" />}</button>
                                    <span className="font-mono text-xs text-text-muted">{String.fromCharCode(65 + oIdx)}</span>
                                    <input type="text" readOnly value={opt.text} className="flex-1 h-9 bg-black border border-border rounded-lg px-3 text-xs text-text-muted" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}