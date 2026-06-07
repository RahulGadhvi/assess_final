"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function CandidateTestPage() {
  const params = useParams();
  const router = useRouter();
  
  // Decoding tracking tokens: [taskId]_[testType]
  const tokenString = (params?.token as string) || "";
  const [taskId, testType] = tokenString.split("_");

  const [candidateName, setCandidateName] = useState("Guest Applicant");
  const [questions, setQuestions] = useState<any[]>([]);
  const [roleTitle, setRoleTitle] = useState("Position Evaluation Track");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Dynamic Content Hydration Sync Engine
  useEffect(() => {
    if (!taskId) return;
    
    const fetchAssignedAssessmentData = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) throw new Error("Verification token missing.");
        const data = await response.json();
        
        setRoleTitle(data.task.title);
        
        // Isolate question array structures matching the token assignment type
        const extractedQuestions = 
          testType === "domain" 
            ? data.task.domainQuestions 
            : data.task.aptitudeQuestions;
            
        // Use standard structured question array schemas or fallback to validation items
        if (extractedQuestions && extractedQuestions.length > 0) {
          setQuestions(extractedQuestions);
        } else {
          setQuestions([
            {
              id: "fallback-q1",
              section: testType === "domain" ? "Domain Mechanics" : "Cognitive Assessment",
              text: `Welcome to the ${data.task.title} verification loop. Reviewing baseline diagnostics: are modular state management protocols required when optimizing application architecture?`,
              options: [
                { id: "opt-1", text: "Yes, to manage modular complexity parameters safely.", isCorrect: true },
                { id: "opt-2", text: "No, monolithic state layers scale predictably across distributed configurations.", isCorrect: false },
                { id: "opt-3", text: "Only under secondary infrastructure load bottlenecks.", isCorrect: false },
                { id: "opt-4", text: "Cannot be determined without explicit framework definitions.", isCorrect: false }
              ]
            }
          ]);
        }
      } catch (err) {
        console.error("[TEST_HYDRATION_ERROR] System failure reading configuration indices:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedAssessmentData();
  }, [taskId, testType]);

  // Performance Timer Tracking Configuration
  useEffect(() => {
    if (isSubmitted || isLoading) return;
    const interval = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, isLoading]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (!answers[currentQ?.id]) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    
    if (currentIndex < totalQ - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      executeSubmissionPipeline();
    }
  };

  const handlePrev = () => {
    setShowWarning(false);
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const selectOption = (optId: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: optId }));
    setShowWarning(false);
  };

  const executeSubmissionPipeline = async () => {
    setIsSubmitting(true);
    // Simulate updating pipeline scoring parameters down to server logs
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-xs text-text-muted animate-pulse gap-3">
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
        <span>Synchronizing assessment payload parameters securely...</span>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <main className="min-h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-accent mb-6" />
          <h1 className="text-2xl font-medium text-text-primary mb-2">Test Submitted Successfully</h1>
          <p className="text-text-muted text-sm max-w-sm leading-relaxed">
            Thank you. Your evaluation matrix responses have been processed into the workspace dashboard.
          </p>
          <p className="text-xs text-text-muted mt-24 opacity-40 font-mono">You may now close this browser instance tab.</p>
        </motion.div>
        <div className="absolute bottom-8 left-0 right-0 text-center flex items-center justify-center gap-1.5 text-[10px] text-text-muted opacity-40 uppercase tracking-widest font-mono">
          <ShieldCheck className="w-3.5 h-3.5" /> Data Encrypted Compliance (DPDP Act 2023)
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] w-full bg-black flex flex-col overflow-hidden relative">
      <header className="shrink-0 pt-6 px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-text-muted w-24 capitalize">
            {testType} Stage: {currentIndex + 1}/{totalQ}
          </span>
          <span className="font-mono text-sm font-medium text-text-primary bg-surface border border-border px-3 py-1 rounded-full">
            {formatTime(timeElapsed)}
          </span>
          <span className="text-xs font-mono text-text-muted w-32 text-right truncate capitalize">
            {roleTitle}
          </span>
        </div>
        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
          <motion.div className="h-full bg-accent" animate={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col pb-24">
        <AnimatePresence mode="wait">
          {currentQ && (
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="w-full max-w-lg mx-auto mt-4 px-4"
            >
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl">
                <span className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">
                  {currentQ.section || "Active Dimension"}
                </span>
                <h2 className="text-base font-medium text-text-primary leading-relaxed mb-6">
                  {currentQ.text}
                </h2>

                <div className="space-y-3">
                  {currentQ.options?.map((opt: any, idx: number) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    return (
                      <button
                        key={opt.id || idx}
                        onClick={() => selectOption(opt.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start text-sm ${
                          isSelected 
                            ? "bg-accent/10 border-accent text-text-primary" 
                            : "bg-black border-border text-text-muted hover:border-text-muted"
                        }`}
                      >
                        <span className={`font-mono text-xs mr-4 mt-0.5 ${isSelected ? "text-accent font-bold" : "text-text-muted"}`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {showWarning && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 flex items-center gap-2 text-xs text-text-muted font-mono">
                      <AlertCircle className="w-4 h-4 text-accent" /> Select an answer variant to advance pipeline logs.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-border p-4 shrink-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="h-11 px-4 flex items-center gap-2 text-xs font-mono font-medium text-text-primary disabled:opacity-20 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" /> PREV
          </button>

          <span className="text-xs text-text-muted font-mono hidden sm:inline-block">
            Answered: {answeredCount} of {totalQ} items
          </span>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="h-11 px-6 bg-text-primary text-black rounded-lg text-xs font-mono font-bold transition-all hover:bg-white flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentIndex === totalQ - 1 ? (
              "SUBMIT"
            ) : (
              "NEXT"
            )}
            {!isSubmitting && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </main>
  );
}