"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Save, ChevronDown, ChevronUp, Trash2, Copy, Info, Check, X, Loader2, Circle, CheckCircle2, Code } from "lucide-react";
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

export default function DomainEditorPage() {
  const params = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [roleTitle, setRoleTitle] = useState("Target Role");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch task from the server memory database
  useEffect(() => {
    const fetchDomainData = async () => {
      try {
        const response = await fetch(`/api/tasks/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setRoleTitle(data.task.title);
          setQuestions(data.task.domainQuestions || []);
          if (data.task.domainQuestions?.length > 0) {
            setExpandedQId(data.task.domainQuestions[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading domain questions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDomainData();
  }, [params.id]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateQuestion = (qId: string, val: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, text: val } : q));
  };

  const handleUpdateOption = (qId: string, optId: string, val: string) => {
    setQuestions(questions.map(q => 
      q.id === qId 
        ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, text: val } : o) } 
        : q
    ));
  };

  const handleSetCorrect = (qId: string, optId: string) => {
    setQuestions(questions.map(q => 
      q.id === qId 
        ? { ...q, options: q.options.map(o => ({ ...o, isCorrect: o.id === optId })) } 
        : q
    ));
    triggerToast("Correct answer updated");
  };

  const handleSimulateAI = () => {
    setIsStreaming(true);
    setTimeout(() => {
      setIsStreaming(false);
      setIsPromptModalOpen(false);
      setAiPrompt("");
      triggerToast("Questions updated by AI");
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-text-muted animate-pulse">
        Loading domain questions...
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-surface border border-border text-text-primary px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm"
          >
            <Check className="w-4 h-4 text-success" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Header */}
      <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/tasks/${params.id}`} className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-medium text-text-primary capitalize">{roleTitle} — Domain Test</h1>
          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold uppercase tracking-wider">
            {questions.length} Questions
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPromptModalOpen(true)}
            className="h-10 px-4 bg-transparent border border-border text-text-primary hover:bg-surface rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            Edit with AI
          </button>
          <button 
            onClick={() => triggerToast("Changes saved successfully")}
            className="h-10 px-6 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Sections Navigation */}
        <aside className="w-[240px] bg-[#0A0A0A] border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" /> Test Sections
            </h2>
          </div>
          <nav className="flex-1 p-2">
            <button className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs bg-surface border-l-2 border-accent text-text-primary font-medium">
              <span>Domain Knowledge</span>
              <span className="text-[10px] font-mono opacity-60 shrink-0">{questions.length} q</span>
            </button>
          </nav>
        </aside>

        {/* Center Canvas Scroll Area */}
        <main className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            
            <div className="mb-6">
              <h2 className="text-xl font-medium text-text-primary mb-1">Domain Questions</h2>
              <p className="text-sm text-text-muted">
                Review and edit the role-specific technical questions generated by AI.
              </p>
            </div>

            <div className="mb-6 bg-surface border border-border rounded-lg px-4 py-3 text-xs text-text-muted flex items-start gap-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Changes made here will update candidate test links instantly.</p>
            </div>

            {/* Questions Accordion Matrix */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="bg-[#0A0A0A] border border-border border-dashed rounded-xl p-12 text-center text-sm text-text-muted">
                  No questions found. Use the creation wizard to generate your technical items.
                </div>
              ) : (
                questions.map((q, index) => {
                  const isExpanded = expandedQId === q.id;

                  return (
                    <motion.div 
                      layout
                      key={q.id || index}
                      className="border border-border rounded-xl bg-[#0A0A0A] overflow-hidden"
                    >
                      {/* Accordion Trigger Row Anchor */}
                      <button 
                        type="button"
                        onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-surface/50 transition-colors"
                      >
                        <span className="font-mono text-xs text-accent font-semibold w-6 text-left">Q{index + 1}</span>
                        <p className="flex-1 text-left text-sm text-text-primary truncate">
                          {q.text}
                        </p>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                      </button>

                      {/* Expanded Section Panel Container */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border bg-background"
                          >
                            <div className="p-6 space-y-5">
                              
                              {/* Question Input Statement */}
                              <div>
                                <label className="block text-[10px] font-semibold font-mono uppercase tracking-wider text-text-muted mb-2">
                                  Question Text
                                  </label>
                                <textarea 
                                  value={q.text}
                                  onChange={(e) => handleUpdateQuestion(q.id, e.target.value)}
                                  className="w-full min-h-[80px] bg-black border border-border rounded-xl p-3 'text-text-primary' text-sm focus:border-accent outline-none resize-none custom-scrollbar leading-relaxed"
                                />
                              </div>

                              {/* Multiple Choice Responses */}
                              <div className="space-y-3">
                                <label className="block text-[10px] font-semibold font-mono uppercase tracking-wider text-text-muted mb-1">
                                  Answer Options
                                </label>
                                {q.options?.map((opt, optIndex) => (
                                  <div key={opt.id || optIndex} className="flex items-center gap-3">
                                    <button 
                                      onClick={() => handleSetCorrect(q.id, opt.id)}
                                      className="shrink-0 p-1 focus:outline-none"
                                      type="button"
                                    >
                                      {opt.isCorrect ? (
                                        <CheckCircle2 className="w-5 h-5 text-accent" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-border hover:text-text-muted transition-colors" />
                                      )}
                                    </button>
                                    <div className="font-mono text-xs text-text-muted w-4 font-bold">
                                      {String.fromCharCode(65 + optIndex)}
                                    </div>
                                    <input
                                      type="text"
                                      value={opt.text}
                                      onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                                      className={`flex-1 h-10 bg-black border rounded-lg px-3 text-sm outline-none transition-colors ${
                                        opt.isCorrect ? "border-accent/40 focus:border-accent" : "border-border focus:border-text-muted"
                                      } text-text-primary`}
                                    />
                                  </div>
                                ))}
                              </div>

                              {/* Tool Actions panel footer */}
                              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                                <button type="button" className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface rounded-md transition-colors">
                                  <Copy className="w-3.5 h-3.5" /> Duplicate
                                </button>
                                <button type="button" className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>

            <button type="button" className="mt-4 w-full h-11 border border-dashed border-border rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center gap-2">
              Add Question
            </button>
          </div>
        </main>
      </div>

      {/* AI Assistant Overlay Modal Context box */}
      <AnimatePresence>
        {isPromptModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !isStreaming && setIsPromptModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#111113] border border-border rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-5 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2 text-accent">
                  <Sparkles className="w-4 h-4" />
                  <h2 className="font-medium text-text-primary">Edit with AI</h2>
                </div>
                <button type="button" onClick={() => !isStreaming && setIsPromptModalOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5">
                <p className="text-xs text-text-muted mb-3 leading-relaxed">
                  Describe what you want to change in this test section. AI will regenerate the questions based on your instructions.
                </p>
                <textarea
                  disabled={isStreaming}
                  autoFocus
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Focus more on database scaling, make options shorter, or increase overall difficulty."
                  className="w-full h-28 bg-black border border-border rounded-xl p-3 text-text-primary text-sm focus:border-accent outline-none resize-none disabled:opacity-50 custom-scrollbar mb-4 placeholder:text-[#424242]"
                />
                
                <button
                  type="button"
                  onClick={handleSimulateAI}
                  disabled={!aiPrompt.trim() || isStreaming}
                  className="w-full h-11 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all shadow-accent-glow flex items-center justify-center disabled:opacity-50"
                >
                  {isStreaming ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Regenerating questions...</span>
                  ) : (
                    "Apply Changes"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}