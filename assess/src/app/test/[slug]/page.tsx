"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2, Award, ClipboardCheck, BookOpen } from "lucide-react";
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

export default function CandidateTestPortal() {
  const params = useParams();
  const slugString = (params.slug as string) || "";

  // Split routing parameters out from slug token (e.g., "taskid_aptitude")
  const [taskId, testType] = slugString.split("_");

  // Portal Workflow States
  const [step, setStep] = useState<"auth" | "quiz" | "complete">("auth");
  const [candidateName, setCandidateName] = useState("");
  const [candidateId, setCandidateId] = useState("");
  
  const [roleTitle, setRoleTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!taskId || !testType) {
      setIsLoading(false);
      return;
    }

    const fetchTestData = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`);
        if (response.ok) {
          const data = await response.json();
          setRoleTitle(data.task.title);
          
          // Dynamically select correct question stack matching URL parameters
          const fetchedQuestions = testType === "aptitude" 
            ? data.task.aptitudeQuestions 
            : data.task.domainQuestions;
            
          setQuestions(fetchedQuestions || []);
        }
      } catch (err) {
        console.error("Error hydrating test metrics profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestData();
  }, [taskId, testType]);

  // Step 1: Register candidate session under current Task
  const handleRegisterCandidateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) return;

    setIsSubmitting(true);
    try {
      // Changed: Point directly to the base candidates route array collection
      const res = await fetch(`/api/tasks/${taskId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: candidateName }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCandidateId(data.candidate.id);
        setStep("quiz");
      } else {
        alert("Session validation failed. Please check with your recruitment panel.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOption = (qId: string, optId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  // Step 2: Auto-calculate score and update backend row
  const handleSubmitTestPayload = async () => {
    setIsSubmitting(true);
    
    let correctTally = 0;
    questions.forEach(q => {
      const selectedOptId = selectedAnswers[q.id];
      const correctOpt = q.options.find(o => o.isCorrect);
      if (correctOpt && selectedOptId === correctOpt.id) {
        correctTally++;
      }
    });

    const finalPercentageScore = questions.length > 0 
      ? Math.round((correctTally / questions.length) * 100) 
      : 0;

    const targetDatabaseField = testType === "aptitude" ? "aptScore" : "domScore";

    try {
      await fetch(`/api/tasks/${taskId}/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: targetDatabaseField, value: finalPercentageScore }),
      });
      setStep("complete");
    } catch (err) {
      console.error("Error transmitting candidate responses:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono text-xs text-text-muted gap-3 animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin text-accent" />
        <span>Syncing test environment constraints safely...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-2 font-mono text-xs text-text-muted text-center p-4">
        <p className="text-destructive font-bold uppercase">Invalid Assessment Access Node</p>
        <p>This evaluation terminal context could not be located inside database clusters.</p>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background text-text-primary px-4 font-sans relative">
      <div className="absolute top-0 inset-x-0 h-48 bg-[radial-gradient(circle_at_top,rgba(94,106,210,0.03)_0%,transparent_85%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {/* --- SCREEN 1: Candidate Verification --- */}
        {step === "auth" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-[440px] bg-surface border border-border rounded-2xl p-8 shadow-2xl z-10">
            <div className="text-center mb-6">
              <span className="px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider">
                {testType} Evaluation Session
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary uppercase mt-3">{roleTitle}</h1>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">Please verify your identity credentials below to initialize your interactive testing timeline.</p>
            </div>

            <form onSubmit={handleRegisterCandidateSession} className="space-y-4">
              <div>
                <label htmlFor="candidate_name" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Legal Applicant Name</label>
                <input
                  id="candidate_name"
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  required
                  placeholder="Enter your full name..."
                  className="w-full h-12 bg-black border border-border rounded-xl px-4 text-text-primary text-sm outline-none transition-colors focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !candidateName.trim()}
                className="w-full h-12 bg-text-primary hover:bg-white text-black font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Examination"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* --- SCREEN 2: Dynamic Question Card --- */}
        {step === "quiz" && activeQuestion && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden">
            
            <div className="h-1 w-full bg-black border-b border-border">
              <motion.div className="h-full bg-accent" animate={{ width: `${progressPercent}%` }} />
            </div>

            <header className="px-6 py-4 bg-[#0A0A0A] border-b border-border flex justify-between items-center font-mono text-[11px] font-bold text-text-muted">
              <span className="uppercase flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Track: {activeQuestion.section || testType}</span>
              <span>Question {currentIdx + 1} of {questions.length}</span>
            </header>

            <div className="p-6 md:p-8 space-y-6 flex-1">
              <h2 className="text-lg font-medium text-text-primary leading-relaxed">
                {activeQuestion.text}
              </h2>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {activeQuestion.options?.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[activeQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(activeQuestion.id, opt.id)}
                      className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center gap-4 ${isSelected ? "bg-accent/5 border-accent text-text-primary" : "bg-black border-border text-text-muted hover:border-text-muted hover:text-text-primary"}`}
                    >
                      <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold border flex items-center justify-center shrink-0 ${isSelected ? "bg-accent border-accent text-white" : "bg-surface border-border"}`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-border bg-[#0A0A0A] flex justify-between items-center font-mono text-xs">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="h-10 px-4 border border-border hover:bg-surface rounded-lg transition-colors text-text-primary disabled:opacity-20"
              >
                PREVIOUS
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="h-10 px-5 bg-text-primary hover:bg-white text-black font-bold rounded-lg transition-colors"
                >
                  NEXT
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitTestPayload}
                  className="h-10 px-5 bg-accent hover:bg-accent-hover text-white font-bold rounded-lg transition-all shadow-accent-glow flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                  SUBMIT_TEST
                </button>
              )}
            </footer>
          </motion.div>
        )}

        {/* --- SCREEN 3: Test Finished Success Screen --- */}
        {step === "complete" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[460px] bg-surface border border-border rounded-2xl p-8 shadow-2xl text-center space-y-6 z-10">
            <div className="w-16 h-16 bg-success/10 border border-success/20 text-success rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight uppercase text-text-primary font-mono">Session Concluded</h1>
              <p className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
                Thank you, <span className="text-text-primary font-semibold font-mono">{candidateName}</span>. Your testing metrics have been securely compiled and synchronized with the employer evaluation matrix.
              </p>
            </div>

            <div className="bg-black border border-border/80 rounded-xl p-3.5 font-mono text-[11px] text-text-muted flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-accent shrink-0" />
              <span>You may now safely close this browser window.</span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}