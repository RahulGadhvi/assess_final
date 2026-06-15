"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, MessageSquare, ShieldAlert, Star, Sparkles, Loader2, User } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface InterviewQuestion {
  id: string;
  competency: string;
  question: string;
  followUpProbe: string;
  signalToLookFor: string;
}

export default function InterviewScriptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const candidateId = searchParams.get("candidate") || "";
  
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [roleTitle, setRoleTitle] = useState("Target Position");
  const [candidateName, setCandidateName] = useState("Selected Candidate");
  
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        const response = await fetch(`/api/tasks/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setRoleTitle(data.task.title);
          
          if (candidateId && data.task.candidates) {
            const currentCandidate = data.task.candidates.find((c: { id: string; name: string }) => c.id === candidateId);
            if (currentCandidate) setCandidateName(currentCandidate.name);
          }

          if (data.task.interviewQuestions && data.task.interviewQuestions.length > 0) {
            setQuestions(data.task.interviewQuestions);
          } else {
            setQuestions([
              {
                id: "int_fallback_1",
                competency: "Technical Depth",
                question: "Can you walk me through the operational architecture of a high-throughput pipeline you built or managed?",
                followUpProbe: "How did you structure error boundaries and avoid leaks under load scaling conditions?",
                signalToLookFor: "Looks for horizontal storage familiarity, thread boundaries, and diagnostic metrics knowledge."
              }
            ]);
          }
        }
      } catch (err) {
        console.error("Error pulling interview telemetry data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterviewData();
  }, [params.id, candidateId]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateRating = (qId: string, value: number) => {
    setRatings(prev => ({ ...prev, [qId]: value }));
    triggerToast(`Competency scored: ${value}/5`);
  };

  const handleCompleteInterview = async () => {
    if (!candidateId) {
      router.push(`/tasks/${params.id}`);
      return;
    }

    setIsFinishing(true);
    const totalStarsPossible = questions.length * 5;
    const starsEarned = Object.values(ratings).reduce((a, b) => a + b, 0);
    const calculatedPercentage = totalStarsPossible > 0 ? Math.round((starsEarned / totalStarsPossible) * 100) : 0;

    try {
      await fetch(`/api/tasks/${params.id}/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "intScore", value: calculatedPercentage }),
      });

      triggerToast("Interview score metrics compiled and written to database.");
      setTimeout(() => router.push(`/tasks/${params.id}`), 1000);
    } catch (err) {
      console.error(err);
      setIsFinishing(false);
    }
  };

  const currentQuestion = questions[activeQuestionIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-text-muted animate-pulse">
        Initializing evaluator context matching candidate profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 md:p-12 relative flex flex-col font-sans">
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-surface border border-border text-text-primary px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono animate-fade-in">
            <Check className="w-4 h-4 text-success" /> {toastMessage}
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-border pb-6">
          <div>
            <Link href={`/tasks/${params.id}`} className="inline-flex items-center gap-2 text-xs font-mono text-text-muted hover:text-text-primary transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" /> Cancel Session
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent shrink-0" /> Evaluator Console
            </h1>
            <p className="text-xs font-mono text-text-muted mt-0.5">Role: <span className="text-text-primary uppercase">{roleTitle}</span></p>
          </div>

          <div className="flex items-center gap-3 bg-surface border border-border px-4 py-2 rounded-xl">
            <User className="w-4 h-4 text-accent" />
            <div className="text-left">
              <p className="text-[10px] font-mono text-text-muted uppercase font-bold leading-none">Evaluating Candidate</p>
              <p className="text-sm font-medium text-text-primary font-mono mt-0.5">{candidateName}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-strict">
          <div className="lg:col-span-4 bg-[#0A0A0A] border border-border rounded-xl p-4 flex flex-col gap-2 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-text-muted px-2 mb-2">Competency Tracks</p>
            {questions.map((q, idx) => {
              const isActive = idx === activeQuestionIndex;
              const currentRating = ratings[q.id];

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all flex flex-col gap-1.5 ${isActive ? "bg-surface border-accent text-text-primary shadow-accent-glow" : "bg-transparent border-border text-text-muted hover:bg-surface/30"}`}
                >
                  <div className="flex justify-between items-center w-full font-mono text-[10px] font-bold">
                    <span className="uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-md">Q{idx + 1} · {q.competency}</span>
                    {currentRating && <span className="text-success font-bold">★ {currentRating}</span>}
                  </div>
                  <p className="text-xs line-clamp-2 leading-relaxed text-text-muted font-sans">{q.question}</p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            {currentQuestion && (
              <div className="bg-[#0A0A0A] border border-border rounded-xl p-6 flex flex-col gap-6 flex-1">
                <div>
                  <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Active Behavioral Prompt</span>
                  <h2 className="text-lg font-medium text-text-primary leading-relaxed">{currentQuestion.question}</h2>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 space-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase text-accent tracking-wider flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-accent" /> Follow-Up Diagnostic Probe</span>
                  <p className="text-xs text-text-muted leading-relaxed font-sans">{currentQuestion.followUpProbe}</p>
                </div>

                <div className="bg-surface/40 border border-dashed border-border rounded-xl p-4 space-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase text-success tracking-wider flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-success" /> Quality Telemetry Signals to Look For</span>
                  <p className="text-xs text-text-muted leading-relaxed font-sans">{currentQuestion.signalToLookFor}</p>
                </div>

                <div className="mt-auto pt-6 border-t border-border space-y-4">
                  <div>
                    <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Assign Competency Score</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isSelected = star <= (ratings[currentQuestion.id] || 0);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleUpdateRating(currentQuestion.id, star)}
                            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${isSelected ? "bg-accent/10 border-accent text-accent shadow-accent-glow" : "bg-black border-border text-text-muted hover:border-text-muted"}`}
                          >
                            <Star className={`w-5 h-5 ${isSelected ? "fill-accent stroke-accent" : "stroke-current"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes_input" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Diagnostic Panel Notes (Auto-cached)</label>
                    <textarea
                      id="notes_input"
                      value={notes[currentQuestion.id] || ""}
                      onChange={(e) => setNotes(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                      placeholder="Input observations..."
                      className="w-full h-24 bg-black border border-border rounded-xl p-3 text-text-primary text-xs focus:border-accent outline-none resize-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-[#0A0A0A] border border-border rounded-xl p-4 shrink-0 font-mono text-xs">
              <button
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                className="h-10 px-4 border border-border hover:bg-surface text-text-primary font-bold rounded-lg transition-colors disabled:opacity-20"
              >
                PREV_METRIC
              </button>
              
              <span className="text-text-muted">Evaluated: {Object.keys(ratings).length}/{questions.length} Fields</span>

              <button
                onClick={() => {
                  if (activeQuestionIndex < questions.length - 1) {
                    setActiveQuestionIndex(prev => prev + 1);
                  } else {
                    handleCompleteInterview();
                  }
                }}
                disabled={isFinishing}
                className="h-10 px-5 bg-accent hover:bg-accent-hover text-white font-bold rounded-lg transition-colors shadow-accent-glow flex items-center gap-2"
              >
                {isFinishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {activeQuestionIndex === questions.length - 1 ? "FINISH_INTERVIEW" : "ADVANCE_STAGE"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}