"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

// Mock Data
const candidateName = "Rahul Gadhvi";
const mockQuestions = [
  {
    id: "q1",
    section: "General Reasoning",
    text: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?",
    options: [
      { id: "o1", label: "A", text: "Yes, definitely" },
      { id: "o2", label: "B", text: "No, definitely not" },
      { id: "o3", label: "C", text: "Cannot be determined" },
      { id: "o4", label: "D", text: "Only if Lazzies are Bloops" },
    ],
  },
  {
    id: "q2",
    section: "Math & Data",
    text: "A project team of 5 people completes a task in 14 days. How many days would it take 7 people to complete the same task?",
    options: [
      { id: "o1", label: "A", text: "12 days" },
      { id: "o2", label: "B", text: "10 days" },
      { id: "o3", label: "C", text: "9.8 days" },
      { id: "o4", label: "D", text: "19.6 days" },
    ],
  },
  {
    id: "q3",
    section: "Communication",
    text: "Which of the following is the most effective way to communicate a critical project delay to a client?",
    options: [
      { id: "o1", label: "A", text: "Wait until the original deadline to inform them." },
      { id: "o2", label: "B", text: "Send a quick text message to keep it casual." },
      { id: "o3", label: "C", text: "Notify them immediately with proposed mitigation steps." },
      { id: "o4", label: "D", text: "Focus only on the reasons why it's not the team's fault." },
    ],
  }
];

export default function CandidateTestPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showWarning, setShowWarning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const currentQ = mockQuestions[currentIndex];
  const totalQ = mockQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / totalQ) * 100;

  // Timer Logic
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (!answers[currentQ.id]) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    
    if (currentIndex < totalQ - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsSubmitted(true);
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

  // The Completion Screen
  if (isSubmitted) {
    return (
      <main className="min-h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex flex-col items-center"
        >
          <CheckCircle2 className="w-16 h-16 text-accent mb-6" />
          <h1 className="text-2xl font-medium text-text-primary mb-2">Test Submitted</h1>
          <p className="text-text-muted text-sm max-w-xs leading-relaxed">
            Thank you, {candidateName}. Your responses have been recorded and sent to the hiring team.
          </p>
          <p className="text-xs text-text-muted mt-24 opacity-60">
            You may now close this tab.
          </p>
        </motion.div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-[10px] text-text-muted opacity-50 uppercase tracking-widest">
            Data protected under DPDP Act 2023
          </p>
        </div>
      </main>
    );
  }

  // The Active Test UI
  return (
    <main className="min-h-[100dvh] w-full bg-black flex flex-col overflow-hidden relative selection:bg-accent/30 selection:text-text-primary">
      
      {/* Top Chrome */}
      <header className="shrink-0 pt-6 px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-muted w-24">
            {currentIndex + 1} of {totalQ}
          </span>
          <span className={`font-mono text-sm font-medium ${timeElapsed > 1500 ? "text-destructive" : "text-text-primary"}`}>
            {formatTime(timeElapsed)}
          </span>
          <span className="text-sm text-text-muted w-24 text-right truncate">
            {candidateName}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </header>

      {/* Main Question Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-lg mx-auto mt-2 px-4"
          >
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl">
              <span className="block text-xs font-semibold text-accent uppercase tracking-wider mb-3">
                {currentQ.section}
              </span>
              <h2 className="text-lg font-medium text-text-primary leading-relaxed mb-8">
                {currentQ.text}
              </h2>

              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectOption(opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start ${
                        isSelected 
                          ? "bg-accent/10 border-accent text-text-primary" 
                          : "bg-[#0A0A0A] border-border text-text-muted hover:border-text-muted"
                      }`}
                    >
                      <span className={`font-mono text-xs mt-0.5 mr-4 ${isSelected ? "text-accent" : "text-text-muted"}`}>
                        {opt.label}
                      </span>
                      <span className="flex-1 text-sm leading-relaxed">
                        {opt.text}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showWarning && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex items-center gap-2 text-xs text-text-muted"
                  >
                    <AlertCircle className="w-4 h-4 text-accent" />
                    Please select an option to continue.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-border p-4 pb-safe shrink-0">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="h-12 px-4 flex items-center gap-2 text-sm font-medium text-text-primary disabled:opacity-30 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>

          <span className="text-xs text-text-muted font-mono hidden md:inline-block">
            {answeredCount} of {totalQ} answered
          </span>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="h-12 px-6 bg-text-primary text-black rounded-lg text-sm font-medium transition-all hover:bg-white flex items-center gap-2"
          >
            {currentIndex === totalQ - 1 ? "Submit" : "Next"} <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </footer>
    </main>
  );
}