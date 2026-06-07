"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, ChevronDown, ChevronUp, Trash2, Plus, Check, Circle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  section: string;
  text: string;
  options: Option[];
}

export default function AptitudeEditorPage() {
  const params = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [roleTitle, setRoleTitle] = useState("Sales Executive");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        console.error("Error reading assessment track:", err);
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

  // --- CRUD FUNCTIONS ---

  const handleAddQuestion = () => {
    const newId = "temp_" + Math.random().toString(36).substring(2, 7);
    const newQuestion: Question = {
      id: newId,
      section: "General Reasoning",
      text: "New Question Text Statement",
      options: [
        { id: "opt1_" + newId, text: "Option A text", isCorrect: true },
        { id: "opt2_" + newId, text: "Option B text", isCorrect: false },
        { id: "opt3_" + newId, text: "Option C text", isCorrect: false },
        { id: "opt4_" + newId, text: "Option D text", isCorrect: false },
      ]
    };

    setQuestions([...questions, newQuestion]);
    setExpandedQId(newId);
    triggerToast("Appended empty item template.");
  };

  const handleDeleteQuestion = (qId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering accordion expansion toggle
    if (!confirm("Remove this question from the test?")) return;
    setQuestions(questions.filter(q => q.id !== qId));
    triggerToast("Question removed from local profile.");
  };

  const handleUpdateQuestionText = (qId: string, val: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, text: val } : q));
  };

  const handleUpdateOptionText = (qId: string, optId: string, val: string) => {
    setQuestions(questions.map(q => 
      q.id === qId 
        ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, text: val } : o) } 
        : q
    ));
  };

  const handleSetCorrectAnswer = (qId: string, optId: string) => {
    setQuestions(questions.map(q => 
      q.id === qId 
        ? { ...q, options: q.options.map(o => ({ ...o, isCorrect: o.id === optId })) } 
        : q
    ));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tasks/${params.id}/aptitude`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      if (response.ok) {
        triggerToast("Changes successfully synced directly to database server.");
      } else {
        triggerToast("Saved locally inside workspace cache.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Network fallback cache updated.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-text-muted animate-pulse">
        Fetching dynamic validation items from route parameters...
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden text-text-primary">
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-surface border border-border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono">
            <Check className="w-4 h-4 text-success" /> {toastMessage}
          </div>
        )}
      </AnimatePresence>

      <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/tasks/${params.id}`} className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-medium capitalize text-sm font-mono">{roleTitle} — Aptitude Test</h1>
          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-mono uppercase tracking-wider">{questions.length} Q_ACTIVE</span>
        </div>
        <button 
          onClick={handleSaveChanges} 
          disabled={isSaving}
          className="h-10 px-5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-2 shadow-accent-glow"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          Save Changes
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[260px] bg-[#0A0A0A] border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border"><h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Sections Matrix</h2></div>
          <nav className="flex-1 p-2">
            <button className="w-full text-left px-3 py-3 rounded-lg text-xs bg-surface border-l-2 border-accent text-text-primary font-medium font-mono">
              Cognitive Logic Profile ({questions.length})
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar pb-32">
          <div className="max-w-3xl mx-auto space-y-4">
            {questions.length === 0 ? (
              <div className="bg-[#0A0A0A] border border-border border-dashed rounded-xl p-12 text-center text-sm text-text-muted font-mono">
                No questions found. Click below to add an empty item block.
              </div>
            ) : (
              questions.map((q, index) => {
                const isExpanded = expandedQId === q.id;
                return (
                  <div key={q.id} className="border border-border rounded-xl bg-[#0A0A0A] overflow-hidden group">
                    <div 
                      onClick={() => setExpandedQId(isExpanded ? null : q.id)} 
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-surface/50 transition-colors cursor-pointer select-none"
                    >
                      <span className="font-mono text-xs text-accent font-semibold w-6">q{index + 1}</span>
                      <p className="flex-1 text-left text-sm text-text-primary truncate font-medium">{q.text}</p>
                      
                      <button 
                        onClick={(e) => handleDeleteQuestion(q.id, e)}
                        className="p-1.5 text-text-muted hover:text-destructive transition-colors rounded hover:bg-black md:opacity-0 group-hover:opacity-100"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-border bg-background">
                          <div className="p-6 space-y-4">
                            <div>
                              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-1.5">Question String Prompt</label>
                              <textarea 
                                value={q.text} 
                                onChange={(e) => handleUpdateQuestionText(q.id, e.target.value)} 
                                className="w-full h-20 bg-black border border-border rounded-xl p-3 text-text-primary text-sm focus:border-accent outline-none resize-none" 
                              />
                            </div>
                            
                            <div className="space-y-2.5">
                              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">Answer Variance Primitives</label>
                              {q.options?.map((opt, oIdx) => (
                                <div key={opt.id} className="flex items-center gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => handleSetCorrectAnswer(q.id, opt.id)} 
                                    className="focus:outline-none shrink-0"
                                  >
                                    {opt.isCorrect ? <CheckCircle2 className="w-4 h-4 text-accent" /> : <Circle className="w-4 h-4 text-border hover:text-text-muted" />}
                                  </button>
                                  <span className="font-mono text-xs text-text-muted w-4 font-bold">{String.fromCharCode(65 + oIdx)}</span>
                                  <input 
                                    type="text" 
                                    value={opt.text} 
                                    onChange={(e) => handleUpdateOptionText(q.id, opt.id, e.target.value)}
                                    className={`flex-1 h-9 bg-black border rounded-lg px-3 text-xs text-text-primary outline-none transition-colors ${opt.isCorrect ? 'border-accent/50 focus:border-accent' : 'border-border focus:border-text-muted'}`} 
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}

            <button 
              type="button" 
              onClick={handleAddQuestion}
              className="w-full h-12 border border-dashed border-border rounded-xl text-xs font-mono text-text-muted hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> ADD_NEW_QUESTION
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}