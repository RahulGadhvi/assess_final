"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Building2, MapPin, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Form State
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("Onsite");
  const [jd, setJd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generatedTaskId, setGeneratedTaskId] = useState<string | null>(null);

  // Generation State (-1 = error, 0 = analyzing/aptitude, 1 = domain, 2 = interview, 3 = finalizing, 4 = done)
  const [genPhase, setGenPhase] = useState(0);

  // Trigger real OpenAI requests sequentially and commit directly to the database
  useEffect(() => {
    if (step === 3) {
      const executeHiringKitPipeline = async () => {
        try {
          setError(null);
          
          // Phase 0: Generate Aptitude Test
          setGenPhase(0);
          const aptResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "aptitude", roleTitle: title }),
          });
          if (!aptResponse.ok) throw new Error("Aptitude generation failed");
          const aptitudeData = await aptResponse.json();

          // Phase 1: Generate Domain Test
          setGenPhase(1);
          const domResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "domain", roleTitle: title }),
          });
          if (!domResponse.ok) throw new Error("Domain Assessment generation failed");
          const domainData = await domResponse.json();

          // Phase 2: Generate Interview Script
          setGenPhase(2);
          const intResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "interview", roleTitle: title }),
          });
          if (!intResponse.ok) throw new Error("Interview script generation failed");
          const interviewData = await intResponse.json();

          // Phase 3: Push all fragments to permanent relational database tables
          setGenPhase(3);
          const dbResponse = await fetch("/api/tasks/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              location,
              workType,
              jdText: jd,
              aptitudeQuestions: aptitudeData.questions,
              domainQuestions: domainData.questions,
              interviewContent: interviewData.questions,
            }),
          });

          if (!dbResponse.ok) throw new Error("Cloud database commit failed");
          const dbData = await dbResponse.json();

          // Cache task parameters for dynamic frontend hydration mapping
          localStorage.setItem("active_task_title", title);
          localStorage.setItem("active_task_location", location);
          localStorage.setItem("active_task_worktype", workType);
          localStorage.setItem("active_task_jd", jd);

          localStorage.setItem("latest_generated_aptitude", JSON.stringify(aptitudeData));
          localStorage.setItem("latest_generated_domain", JSON.stringify(domainData));
          localStorage.setItem("latest_generated_interview", JSON.stringify(interviewData));
          setGeneratedTaskId(dbData.taskId);
          
          // Phase 4: Pipeline Complete
          setGenPhase(4);
        } catch (err: any) {
          console.error(err);
          setError(err.message || "An unexpected error occurred during execution pipeline.");
          setGenPhase(-1);
        }
      };

      executeHiringKitPipeline();
    }
  }, [step, jd, title, location, workType]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const sampleJD = `Role: Senior Frontend Engineer
Experience: 4+ years
Skills: React, Next.js, TypeScript, Tailwind CSS, Framer Motion
Responsibilities:
- Architect scalable frontend solutions using Next.js App Router
- Build highly accessible, interactive UI components
- Collaborate with AI engineers to stream complex data flows
- Optimize Core Web Vitals and rendering performance`;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 relative overflow-hidden">
      
      {/* Background Glow for Step 3 Hero Moment */}
      <AnimatePresence>
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(94,106,210,0.08)_0%,transparent_60%)] rounded-full blur-3xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl z-10">
        
        {/* Header & Progress Indicator */}
        <div className="mb-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                  step >= i ? "bg-accent border-accent text-white" : "bg-surface border-border text-text-muted"
                }`}>
                  {i}
                </div>
                {i < 3 && (
                  <div className={`w-16 h-px mx-2 transition-colors ${step > i ? "bg-accent" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-[#0A0A0A] border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <h2 className="text-xl font-medium text-text-primary mb-6">Job Details</h2>
                
                <div className="space-y-5 flex-1">
                  <div>
                    <label className="block text-sm text-text-muted mb-2">Job Title</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior Frontend Engineer"
                        className="w-full h-12 bg-black border border-border rounded-xl pl-10 pr-4 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Bengaluru, India"
                        className="w-full h-12 bg-black border border-border rounded-xl pl-10 pr-4 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-2">Work Type</label>
                    <div className="flex p-1 bg-surface border border-border rounded-xl">
                      {["Onsite", "Hybrid", "Remote"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setWorkType(type)}
                          className={`flex-1 h-10 text-sm font-medium rounded-lg transition-all ${
                            workType === type 
                              ? "bg-accent text-white shadow-md" 
                              : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Job Description */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium text-text-primary">Job Description</h2>
                  <button 
                    onClick={() => setJd(sampleJD)}
                    className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                  >
                    Use sample JD
                  </button>
                </div>
                
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full min-h-[240px] bg-black border border-border rounded-xl p-4 font-mono text-sm text-text-primary placeholder:text-[#525252] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none custom-scrollbar"
                />
                <div className="text-right mt-2 text-xs font-mono text-text-muted">
                  {jd.length} characters
                </div>
              </motion.div>
            )}

            {/* STEP 3: Real OpenAI Generation + Database Save Response */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full items-center justify-center text-center py-6"
              >
                <div className="mb-8 relative">
                  <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center">
                    {genPhase === -1 ? (
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    ) : genPhase < 4 ? (
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    )}
                  </div>
                </div>

                {/* Status Cards */}
                <div className="w-full max-w-sm space-y-3">
                  {[
                    { id: 0, label: "Aptitude Test", desc: "Generating cognitive criteria" },
                    { id: 1, label: "Domain Assessment", desc: "Extracting specialized parameters" },
                    { id: 2, label: "Interview Script", desc: "Drafting precision technical prompts" },
                    { id: 3, label: "Database Sync", desc: "Syncing records to Supabase instance" },
                  ].map((card) => (
                    <div 
                      key={card.id}
                      className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">{card.label}</p>
                        <p className="text-xs text-text-muted font-mono mt-0.5">
                          {genPhase > card.id ? "Complete" : genPhase === card.id ? "Processing pipeline..." : "Queued"}
                        </p>
                      </div>
                      <div>
                        {genPhase > card.id ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : genPhase === card.id ? (
                          <div className="w-5 h-5 flex items-center justify-center">
                            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-border rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Error Reporting */}
                {error && (
                  <div className="mt-6 flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <p className="mt-8 text-sm font-mono text-text-muted">
                  {genPhase === 0 && "Analyzing JD structure with OpenAI..."}
                  {genPhase === 1 && "Formulating technical questions..."}
                  {genPhase === 2 && "Compiling human evaluator scripts..."}
                  {genPhase === 3 && "Committing atomic database transactions to PostgreSQL..."}
                  {genPhase === 4 && "All hiring kits successfully synchronized."}
                  {genPhase === -1 && "Pipeline halted due to processing exception."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-between">
          {step > 1 && step < 3 ? (
            <button
              onClick={handleBack}
              className="h-12 px-6 rounded-lg font-medium text-sm text-text-primary border border-border hover:bg-surface transition-colors"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              disabled={step === 1 && (!title || !location)}
              className="h-12 px-8 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium text-sm shadow-accent-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              Continue
            </motion.button>
          ) : (
            genPhase === 4 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/tasks/${generatedTaskId || "task-1"}`)}
                className="h-12 px-8 bg-text-primary hover:bg-white text-black rounded-lg font-medium text-sm transition-all ml-auto w-full max-w-[240px]"
              >
                View Task Dashboard
              </motion.button>
            )
          )}
        </div>

      </div>
    </div>
  );
}