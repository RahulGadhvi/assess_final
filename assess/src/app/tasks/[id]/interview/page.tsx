"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, MessageSquare, Star, Sparkles, Loader2, User } from "lucide-react";
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
  const [roleTitle, setRoleTitle] = useState("Position");
  const [candidateName, setCandidateName] = useState("Candidate");

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
            const currentCandidate = data.task.candidates.find(
              (c: { id: string; name: string }) => c.id === candidateId
            );
            if (currentCandidate) setCandidateName(currentCandidate.name);
          }

          if (data.task.interviewQuestions && data.task.interviewQuestions.length > 0) {
            setQuestions(data.task.interviewQuestions);
          } else {
            setQuestions([
              {
                id: "int_fallback_1",
                competency: "Technical Depth",
                question: "Can you walk me through the architecture of a system you built or managed?",
                followUpProbe: "How did you handle failure scenarios and scaling?",
                signalToLookFor: "Looks for system design knowledge and operational experience.",
              },
            ]);
          }
        }
      } catch {
        console.error("Error loading interview data");
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
    triggerToast(`Rated: ${value}/5`);
  };

  const handleCompleteInterview = async () => {
    if (!candidateId) {
      router.push(`/tasks/${params.id}`);
      return;
    }

    setIsFinishing(true);
    const totalStarsPossible = questions.length * 5;
    const starsEarned = Object.values(ratings).reduce((a, b) => a + b, 0);
    const calculatedPercentage =
      totalStarsPossible > 0 ? Math.round((starsEarned / totalStarsPossible) * 100) : 0;

    const notesText = Object.entries(notes)
      .map(([qId, note]) => `${qId}: ${note}`)
      .join("\n");

    try {
      await fetch(`/api/tasks/${params.id}/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "intScore",
          value: calculatedPercentage,
          notes: notesText,
        }),
      });

      triggerToast("Interview score saved.");
      setTimeout(() => router.push(`/tasks/${params.id}`), 1000);
    } catch {
      console.error("Error saving interview");
      setIsFinishing(false);
    }
  };

  const currentQuestion = questions[activeQuestionIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 md:p-12 relative flex flex-col">
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-surface border border-border text-text-primary px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs">
            <Check className="w-4 h-4 text-success" /> {toastMessage}
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-border pb-6">
          <div>
            <Link
              href={`/tasks/${params.id}`}
              className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent shrink-0" /> Evaluator Console
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Role: <span className="text-text-primary">{roleTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface border border-border px-4 py-2 rounded-xl">
            <User className="w-4 h-4 text-accent" />
            <div>
              <p className="text-xs text-text-muted">Evaluating</p>
              <p className="text-sm font-medium text-text-primary">{candidateName}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          <div className="lg:col-span-4 bg-[#0A0A0A] border border-border rounded-xl p-4 flex flex-col gap-2 max-h-[calc(100vh-240px)] overflow-y-auto">
            <p className="text-xs text-text-muted px-2 mb-2">Competencies</p>
            {questions.map((q, idx) => {
              const isActive = idx === activeQuestionIndex;
              const currentRating = ratings[q.id];

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all flex flex-col gap-1.5 ${
                    isActive
                      ? "bg-surface border-accent text-text-primary"
                      : "bg-transparent border-border text-text-muted hover:bg-surface/30"
                  }`}
                >
                  <div className="flex justify-between items-center w-full text-xs">
                    <span className="text-accent bg-accent/10 px-2 py-0.5 rounded">
                      Q{idx + 1} &middot; {q.competency}
                    </span>
                    {currentRating && <span className="text-success">{currentRating}/5</span>}
                  </div>
                  <p className="text-xs line-clamp-2 leading-relaxed text-text-muted">{q.question}</p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            {currentQuestion && (
              <div className="bg-[#0A0A0A] border border-border rounded-xl p-6 flex flex-col gap-6 flex-1">
                <div>
                  <span className="text-xs text-text-muted block mb-1">Question</span>
                  <h2 className="text-lg font-medium text-text-primary leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 space-y-1">
                  <span className="text-xs text-accent flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Follow-up Probe
                  </span>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {currentQuestion.followUpProbe}
                  </p>
                </div>

                <div className="bg-surface/40 border border-dashed border-border rounded-xl p-4 space-y-1">
                  <span className="text-xs text-success flex items-center gap-1.5">
                    Look For
                  </span>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {currentQuestion.signalToLookFor}
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-border space-y-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-2">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isSelected = star <= (ratings[currentQuestion.id] || 0);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleUpdateRating(currentQuestion.id, star)}
                            className={`p-2 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-accent/10 border-accent text-accent"
                                : "bg-black border-border text-text-muted hover:border-text-muted"
                            }`}
                          >
                            <Star
                              className={`w-5 h-5 ${isSelected ? "fill-accent stroke-accent" : "stroke-current"}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes_input" className="block text-xs text-text-muted mb-1.5">
                      Notes
                    </label>
                    <textarea
                      id="notes_input"
                      value={notes[currentQuestion.id] || ""}
                      onChange={(e) =>
                        setNotes(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))
                      }
                      placeholder="Observations..."
                      className="w-full h-24 bg-black border border-border rounded-xl p-3 text-text-primary text-xs focus:border-accent outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-[#0A0A0A] border border-border rounded-xl p-4 shrink-0 text-xs">
              <button
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                className="h-10 px-4 border border-border hover:bg-surface text-text-primary font-medium rounded-lg transition-colors disabled:opacity-20"
              >
                Previous
              </button>

              <span className="text-text-muted">
                {Object.keys(ratings).length}/{questions.length} rated
              </span>

              <button
                onClick={() => {
                  if (activeQuestionIndex < questions.length - 1) {
                    setActiveQuestionIndex(prev => prev + 1);
                  } else {
                    handleCompleteInterview();
                  }
                }}
                disabled={isFinishing}
                className="h-10 px-5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isFinishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {activeQuestionIndex === questions.length - 1 ? "Finish Interview" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
