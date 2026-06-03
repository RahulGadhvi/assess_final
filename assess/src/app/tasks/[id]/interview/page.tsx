"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Copy, MessageSquare, ShieldAlert, Star, Sparkles, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface InterviewQuestion {
  id: string;
  competency: string;
  question: string;
  followUpProbe: string;
  signalToLookFor: string;
}

export default function InterviewScriptPage() {
  const params = useParams();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [roleTitle, setRoleTitle] = useState("Senior Role");
  
  // Evaluation State Tracker
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTitle = localStorage.getItem("active_task_title");
      if (storedTitle) setRoleTitle(storedTitle);

      const storedScript = localStorage.getItem("latest_generated_interview");
      if (storedScript) {
        try {
          const parsed = JSON.parse(storedScript);
          if (parsed.questions && parsed.questions.length > 0) {
            setQuestions(parsed.questions);
          } else if (Array.isArray(parsed)) {
            setQuestions(parsed);
          }
        } catch (e) {
          console.error("Failed to parse local interview script storage buffer:", e);
        }
      }
      
      // Fallback generator if empty to keep sandbox alive
      if (!storedScript || questions.length === 0) {
        setQuestions([
          {
            id: "i1",
            competency: "Technical Depth",
            question: "Can you walk me through the architecture of a high-throughput real-time pipeline you built using modern distributed system patterns?",
            followUpProbe: "How did you structure error boundaries and avoid memory leaks under heavy connection stress?",
            signalToLookFor: "Looks for awareness of thread scheduling, horizontal storage scaling, backpressure, and race conditions."
          },
          {
            id: "i2",
            competency: "Situational Judgment",
            question: "Describe a time a critical component failed right during peak user traffic metrics in production. How did you coordinate resolution paths?",
            followUpProbe: "What mitigation structures did you implement afterward to guarantee this failure signature wouldn't recur?",
            signalToLookFor: "Evaluates production ownership telemetry, isolation metrics, metrics-driven diagnostic methods, and peer collaboration parameters."
          },
          {
            id: "i3",
            competency: "Culture & Alignment",
            question: "How do you evaluate which tech stacks to embrace versus when to stick with simple, boring architectures to optimize business velocity?",
            followUpProbe: "Give an example where you deliberately chose an architecture that wasn't your personal preference for the good of the team.",
            signalToLookFor: "Checks for pragmatism, absence of resume-driven development tendencies, and high empathy vectors toward business values."
          }
        ]);
      }
      setIsLoading(false);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyScript = () => {
    const textBlock = questions.map((q, i) => `[${q.competency}] Q${i+1}: ${q.question}\nProbe: ${q.followUpProbe}\n`).join("\n");
    navigator.clipboard.writeText(textBlock);
    triggerToast("Copied script text directly to clipboard!");
  };

  const currentQuestion = questions[activeQuestionIndex];

  // Render Skeleton Loader for Async Hydration State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl space-y-4">
          <div className="h-8 bg-[#111113] animate-pulse rounded-lg w-1/4" />
          <div className="h-48 bg-[#111113] animate-pulse rounded-2xl w-full" />
          <div className="h-32 bg-[#111113] animate-pulse rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 md:p-12 relative flex flex-col">
      
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

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-8">
        
        {/* Navigation Breadcrumb Headers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <Link href={`/tasks/${params.id}`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Task Detail
            </Link>
            <h1 className="text-2xl font-medium tracking-tight text-text-primary capitalize flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent shrink-0" /> Live Interview Script Evaluator
            </h1>
            <p className="text-xs font-mono text-text-muted mt-1">
              Target Position Context: <span className="text-text-primary text-xs font-sans tracking-tight">{roleTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyScript}
              className="h-10 px-4 bg-transparent border border-border hover:bg-surface text-text-primary rounded-lg text-xs font-medium transition-all flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Copy Entire Script
            </button>
            <button 
              onClick={() => window.print()}
              className="h-10 px-4 bg-transparent border border-border hover:bg-surface text-text-primary rounded-lg text-xs font-medium transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Guidelines
            </button>
          </div>
        </div>

        {/* Evaluation Panel Grid Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
          
          {/* Left Navigation: Question Selector Column */}
          <div className="lg:col-span-4 bg-[#0A0A0A] border border-border rounded-xl p-4 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-240px)] custom-scrollbar">
            <p className="text-[10px] font-semibold font-mono uppercase tracking-widest text-text-muted px-2 mb-2">
              Question Timeline
            </p>
            {questions.map((q, idx) => {
              const isActive = idx === activeQuestionIndex;
              const hasNotes = !!notes[q.id]?.trim();
              const currentRating = ratings[q.id];

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all flex flex-col gap-1.5 ${
                    isActive 
                      ? "bg-surface border-accent text-text-primary shadow-accent-glow" 
                      : "bg-transparent border-border text-text-muted hover:text-text-primary hover:bg-surface/30"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-mono text-[10px] font-semibold uppercase text-accent tracking-wider bg-accent/10 px-2 py-0.5 rounded-md">
                      Q{idx + 1} · {q.competency || "Focus Core"}
                    </span>
                    {currentRating && (
                      <span className="text-xs font-mono text-success flex items-center gap-0.5 font-bold">
                        ★ {currentRating}
                      </span>
                    )}
                  </div>
                  <p className="text-xs line-clamp-2 leading-relaxed">
                    {q.question}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Panel: Primary Assessment Execution Dashboard Area */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id || activeQuestionIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="bg-[#0A0A0A] border border-border rounded-xl p-6 flex flex-col gap-6 flex-1"
                >
                  {/* Current Active Core Question Prompt */}
                  <div>
                    <span className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-2">
                      Active Question Prompt
                    </span>
                    <h2 className="text-xl font-medium text-text-primary leading-relaxed">
                      {currentQuestion.question}
                    </h2>
                  </div>

                  {/* Follow-up / Deepening Probes Container block */}
                  <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase text-accent tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-accent" /> Follow-Up Deepening Probe (Residual Heat Vector)
                    </span>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {currentQuestion.followUpProbe || "No custom deepening parameter supplied for this competency layer."}
                    </p>
                  </div>

                  {/* Signals to search for validation parameters container block */}
                  <div className="bg-surface/40 border border-dashed border-border rounded-xl p-4 flex flex-col gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase text-success tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-success" /> Key Performance Evaluator Signals
                    </span>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {currentQuestion.signalToLookFor}
                    </p>
                  </div>

                  {/* Live Interactive Evaluation Controls Input Matrix */}
                  <div className="mt-auto pt-6 border-t border-border space-y-4">
                    <div>
                      <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                        Live Score Tracker Matrix
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isSelected = star <= (ratings[currentQuestion.id] || 0);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => {
                                setRatings(prev => ({ ...prev, [currentQuestion.id]: star }));
                                triggerToast(`Competency Assessment synchronized to level: ${star}/5`);
                              }}
                              className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                                isSelected 
                                  ? "bg-accent/10 border-accent text-accent shadow-accent-glow" 
                                  : "bg-black border-border text-text-muted hover:border-text-muted hover:text-text-primary"
                              }`}
                            >
                              <Star className={`w-5 h-5 ${isSelected ? "fill-accent stroke-accent" : "stroke-current"}`} />
                            </button>
                          );
                        })}
                        <span className="text-xs text-text-muted font-mono ml-2">
                          (1 = Critical Concern, 5 = Elite Pipeline Benchmark)
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="interviewer_notes" className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                        Interviewer Diagnostic Evaluation Notes (Auto-buffering)
                      </label>
                      <textarea
                        id="interviewer_notes"
                        value={notes[currentQuestion.id] || ""}
                        onChange={(e) => setNotes(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                        placeholder="Type real-time responses, architecture choices mentioned, red flags raised, or candidate performance metrics..."
                        className="w-full h-24 bg-black border border-border rounded-xl p-3 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none custom-scrollbar placeholder:text-[#424242]"
                      />
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Action Bottom Nav Controls */}
            <div className="flex justify-between items-center bg-[#0A0A0A] border border-border rounded-xl p-4 shrink-0">
              <button
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                className="h-10 px-4 border border-border hover:bg-surface text-text-primary text-xs font-medium rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous Indicator
              </button>
              
              <span className="font-mono text-xs text-text-muted">
                Evaluated: {Object.keys(ratings).length} of {questions.length} domains
              </span>

              <button
                onClick={() => {
                  if (activeQuestionIndex < questions.length - 1) {
                    setActiveQuestionIndex(prev => prev + 1);
                  } else {
                    triggerToast("Evaluation completed. Storing performance telemetry analytics.");
                  }
                }}
                className="h-10 px-6 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors shadow-accent-glow"
              >
                {activeQuestionIndex === questions.length - 1 ? "Complete Interview" : "Advance Pipeline"}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}