"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Building2, MapPin, AlertCircle, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Form Core State
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("Onsite");
  const [jd, setJd] = useState("");

  // AI JD Generator Assist State
  const [jdPrompt, setJdPrompt] = useState("");
  const [isJdGenerating, setIsJdGenerating] = useState(false);

  // Overall Generation Pipeline State
  const [error, setError] = useState<string | null>(null);
  const [generatedTaskId, setGeneratedTaskId] = useState<string | null>(null);
  const [genPhase, setGenPhase] = useState(0); // -1 = error, 0 = aptitude, 1 = domain, 2 = interview, 3 = sync, 4 = done

  // Sequential generation and database persistence execution block
  useEffect(() => {
    if (step === 3) {
      const executeHiringKitPipeline = async () => {
        try {
          setError(null);
          
          // Phase 0: Generate Aptitude MCQ Test
          setGenPhase(0);
          const aptResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "aptitude", roleTitle: title }),
          });
          if (!aptResponse.ok) throw new Error("Cognitive aptitude generation failed");
          const aptitudeData = await aptResponse.json();

          // Phase 1: Generate Domain MCQ Test
          setGenPhase(1);
          const domResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "domain", roleTitle: title }),
          });
          if (!domResponse.ok) throw new Error("Domain skill assessment generation failed");
          const domainData = await domResponse.json();

          // Phase 2: Generate Interview Script
          setGenPhase(2);
          const intResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "interview", roleTitle: title }),
          });
          if (!intResponse.ok) throw new Error("Live interviewer script generation failed");
          const interviewData = await intResponse.json();

          // Phase 3: Push all generated elements to the Server Database Store
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

          if (!dbResponse.ok) throw new Error("Relational server storage sync failed");
          const dbData = await dbResponse.json();

          // Seed dynamic storage keys to complete the client views
          localStorage.setItem("active_task_title", title);
          localStorage.setItem("active_task_location", location);
          localStorage.setItem("active_task_worktype", workType);
          localStorage.setItem("active_task_jd", jd);

          localStorage.setItem("latest_generated_aptitude", JSON.stringify(aptitudeData));
          localStorage.setItem("latest_generated_domain", JSON.stringify(domainData));
          localStorage.setItem("latest_generated_interview", JSON.stringify(interviewData));
          setGeneratedTaskId(dbData.taskId);
          
          setGenPhase(4);
        } catch (err: any) {
          console.error(err);
          setError(err.message || "An error occurred during assessment compilation.");
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

  // Structured JD AI Trigger Pipeline Call
  const handleGenerateStructuredJD = async () => {
    if (!jdPrompt.trim()) return;
    setError(null);
    setIsJdGenerating(true);

    try {
      const res = await fetch("/api/ai/generate-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: jdPrompt }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate job template.");

      setJd(data.jd);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJdGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 relative overflow-hidden">
      
      {/* Background radial highlight glow */}
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
        
        {/* Navigation Breadcrumb & Connected Progress Dots */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-5">
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

        {/* Primary Interactive Creation Container Box */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-2xl relative overflow-hidden min-h-[420px]">
          
          {/* STEP 1: Core Job Parameters */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-text-primary">Job Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Job Title</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setJdPrompt(`${e.target.value} with 1 year experience`); // Auto-populate JD prompt to save typing friction
                      }}
                      placeholder="e.g. Sales Executive"
                      className="w-full h-11 bg-black border border-border rounded-lg pl-10 pr-4 text-text-primary text-sm focus:border-accent outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Mumbai, India"
                      className="w-full h-11 bg-black border border-border rounded-lg pl-10 pr-4 text-text-primary text-sm focus:border-accent outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Work Type</label>
                  <div className="flex p-1 bg-black border border-border rounded-lg">
                    {["Onsite", "Hybrid", "Remote"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setWorkType(type)}
                        className={`flex-1 h-9 text-xs font-medium rounded transition-all ${
                          workType === type 
                            ? "bg-accent text-white" 
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI-Assisted Job Description (JD) Template Generator */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Job Description</h2>
                <span className="text-xs font-mono text-text-muted">{jd.length} characters</span>
              </div>

              {/* AI Structured Generator Search Inputs Area */}
              <div className="bg-black border border-border rounded-xl p-4 space-y-3">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  AI Job Description Template Generator
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={jdPrompt}
                    onChange={(e) => setJdPrompt(e.target.value)}
                    placeholder="e.g. Sales Executive with 1 year experience"
                    className="flex-1 h-10 bg-surface border border-border rounded-lg px-3 text-text-primary text-xs outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateStructuredJD}
                    disabled={isJdGenerating || !jdPrompt.trim()}
                    className="h-10 px-4 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isJdGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    <span>Generate JD</span>
                  </button>
                </div>
              </div>

              {/* Main JD Textarea block */}
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste your existing Job Description, or use the generator block above to build a standard template optimized for MCQ assessment generation."
                className="w-full min-h-[180px] bg-black border border-border rounded-xl p-4 font-mono text-xs text-text-primary placeholder:text-[#525252] focus:border-accent outline-none resize-none custom-scrollbar leading-relaxed"
              />
            </div>
          )}

          {/* STEP 3: Real sequential OpenAI processing sequence */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="mb-6 relative">
                <div className="w-14 h-14 bg-black border border-border rounded-2xl flex items-center justify-center">
                  {genPhase === -1 ? (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  ) : genPhase < 4 ? (
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  )}
                </div>
              </div>

              {/* Visual checklist status card list */}
              <div className="w-full max-w-sm space-y-2">
                {[
                  { id: 0, label: "Aptitude Test", desc: "Generating cognitive logic" },
                  { id: 1, label: "Domain Assessment", desc: "Extracting structural technical criteria" },
                  { id: 2, label: "Interview Script", desc: "Drafting human evaluator cues" },
                  { id: 3, label: "Database Sync", desc: "Saving assets to server store" },
                ].map((card) => (
                  <div 
                    key={card.id}
                    className="bg-black/50 border border-border rounded-xl p-3.5 flex items-center justify-between"
                  >
                    <div className="text-left">
                      <p className="text-xs font-medium text-text-primary">{card.label}</p>
                      <p className="text-[10px] text-text-muted font-mono mt-0.5">
                        {genPhase > card.id ? "Done" : genPhase === card.id ? "Generating via GPT-4o..." : "Queued"}
                      </p>
                    </div>
                    <div>
                      {genPhase > card.id ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : genPhase === card.id ? (
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3.5 h-3.5 border border-border rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="mt-6 text-xs font-mono text-text-muted">
                {genPhase === 0 && "Parsing Structured JD fields..."}
                {genPhase === 1 && "Optimizing technical MCQs against specified competencies..."}
                {genPhase === 2 && "Formulating specific, measurable technical probes..."}
                {genPhase === 3 && "Saving structured task records to memory registry..."}
                {genPhase === 4 && "All hiring kits successfully synchronized and live."}
                {genPhase === -1 && "Hiring kit generation sequence interrupted."}
              </p>
            </div>
          )}

        </div>

        {/* Step Progression Action Row */}
        <div className="mt-6 flex justify-between">
          {step > 1 && step < 3 ? (
            <button
              onClick={handleBack}
              className="h-11 px-5 rounded-lg text-sm text-text-primary border border-border hover:bg-surface transition-colors"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={(step === 1 && (!title || !location)) || (step === 2 && !jd.trim())}
              className="h-11 px-6 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium shadow-accent-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              Continue
            </motion.button>
          ) : (
            genPhase === 4 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/tasks/${generatedTaskId || "task-1"}`)}
                className="h-11 px-6 bg-text-primary hover:bg-white text-black rounded-lg text-sm font-medium transition-colors ml-auto w-full max-w-[200px]"
              >
                Go to Position Dashboard
              </motion.button>
            )
          )}
        </div>

      </div>
    </div>
  );
}