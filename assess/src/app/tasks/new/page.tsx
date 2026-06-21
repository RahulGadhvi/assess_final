"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Building2, MapPin, Wand2, Terminal, Cpu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  // Form Core State
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("Onsite");
  const [jd, setJd] = useState("");

  // AI JD Generator Assist State
  const [jdPrompt, setJdPrompt] = useState("");
  const [isJdGenerating, setIsJdGenerating] = useState(false);

  // Overall Generation Pipeline State
  const [, setError] = useState<string | null>(null);
  const [generatedTaskId, setGeneratedTaskId] = useState<string | null>(null);
  const [genPhase, setGenPhase] = useState(0); // -1 = error, 0 = aptitude, 1 = domain, 2 = interview, 3 = sync, 4 = done
  const [logs, setLogs] = useState<string[]>([]);

  // Telemetry Log Ticker Stream
  useEffect(() => {
    if (step !== 3) return;
    
    const timestamp = () => new Date().toLocaleTimeString();
    
    if (genPhase === 0) {
      setLogs([
        `[${timestamp()}] [SYSTEM] Initializing core pipeline deployment cluster...`,
        `[${timestamp()}] [AI_PARSE] Analyzing raw Job Description tokens for target title: "${title}"...`,
        `[${timestamp()}] [GPT-4o] Formulating 20 cognitive logic parameters (30% Reason, 50% Math, 20% Comm)...`
      ]);
    } else if (genPhase === 1) {
      setLogs(prev => [
        ...prev,
        `[${timestamp()}] [SUCCESS] Cognitive Logic Profile matrices mapped successfully.`,
        `[${timestamp()}] [AI_PARSE] Scanning technical stack keywords and structural compliance directives...`,
        `[${timestamp()}] [GPT-4o] Synthesizing role-specific domain MCQs against real-world challenge models...`
      ]);
    } else if (genPhase === 2) {
      setLogs(prev => [
        ...prev,
        `[${timestamp()}] [SUCCESS] Technical challenge stack definitions built and compiled.`,
        `[${timestamp()}] [AI_PARSE] Mapping soft skills constraints to behavioral diagnostic questions...`,
        `[${timestamp()}] [GPT-4o] Engineering 10 strategic follow-up probes for human evaluator panel script...`
      ]);
    } else if (genPhase === 3) {
      setLogs(prev => [
        ...prev,
        `[${timestamp()}] [SUCCESS] Behavioral deepen cues and evaluation signals finalized.`,
        `[${timestamp()}] [DATABASE] Opening atomic atomic secure pool cluster transaction layer...`,
        `[${timestamp()}] [DATABASE] Transmitting records directly onto linked Supabase PostgreSQL tables...`
      ]);
    } else if (genPhase === 4) {
      setLogs(prev => [
        ...prev,
        `[${timestamp()}] [CORE] Overwrite sequences committed successfully. Row pointers synced.`,
        `[${timestamp()}] [READY] Platform tracking hex allocation token fully active. Environment verified.`,
        `>>> PIPELINE COMPLETED SUCCESSFULLY. DISPATCHING COMMAND DISK ENTRY.`
      ]);
    }
  }, [genPhase, step, title]);

  // Auto-scroll the terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
            body: JSON.stringify({ jd, type: "aptitude", roleTitle: title, location }),
          });
          if (!aptResponse.ok) throw new Error("Cognitive aptitude generation failed");
          const aptitudeData = await aptResponse.json();

          // Phase 1: Generate Domain MCQ Test
          setGenPhase(1);
          const domResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "domain", roleTitle: title, location }),
          });
          if (!domResponse.ok) throw new Error("Domain skill assessment generation failed");
          const domainData = await domResponse.json();

          // Phase 2: Generate Interview Script
          setGenPhase(2);
          const intResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "interview", roleTitle: title, location }),
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
              companyName: typeof window !== "undefined" ? localStorage.getItem("employer_company") || undefined : undefined,
            }),
          });

          if (!dbResponse.ok) throw new Error("Relational server storage sync failed");
          const dbData = await dbResponse.json();

          localStorage.setItem("active_task_title", title);
          localStorage.setItem("active_task_location", location);
          localStorage.setItem("active_task_worktype", workType);
          localStorage.setItem("active_task_jd", jd);

          localStorage.setItem("latest_generated_aptitude", JSON.stringify(aptitudeData));
          localStorage.setItem("latest_generated_domain", JSON.stringify(domainData));
          localStorage.setItem("latest_generated_interview", JSON.stringify(interviewData));
          setGeneratedTaskId(dbData.taskId);
          
          setGenPhase(4);
        } catch (err) {
          const message = err instanceof Error ? err.message : "An error occurred during assessment compilation.";
          console.error(err);
          setError(message);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate job template.");
    } finally {
      setIsJdGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 relative overflow-hidden font-sans select-none">
      <div className="absolute top-0 inset-x-0 h-48 bg-[radial-gradient(circle_at_top,rgba(94,106,210,0.03)_0%,transparent_85%)] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        
        {/* Navigation Breadcrumbs */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-mono text-text-muted hover:text-text-primary transition-colors mb-5">
            <ArrowLeft className="w-4 h-4" /> BACK_TO_DASHBOARD
          </Link>
          
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold border transition-colors ${
                  step >= i ? "bg-accent border-accent text-white" : "bg-[#0A0A0A] border-border text-text-muted"
                }`}>
                  {i}
                </div>
                {i < 3 && (
                  <div className={`w-12 h-px mx-1 transition-colors ${step > i ? "bg-accent" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Primary Pipeline Wrapper Canvas Container */}
        <div className="bg-[#0A0A0A] border border-border rounded-xl p-6 md:p-8 shadow-2xl relative min-h-[440px] flex flex-col justify-between">
          
          {/* STEP 1: Position Attributes Configuration Panel */}
          {step === 1 && (
            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-xl font-semibold text-text-primary tracking-tight">Deploy New Evaluation Kit</h2>
                <p className="text-xs text-text-muted font-mono mt-0.5">Initialize parameters for target dashboard slot</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2">Job Title</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setJdPrompt(`${e.target.value} with 1 year experience`);
                      }}
                      placeholder="e.g. Sales Executive"
                      className="w-full h-11 bg-black border border-border rounded-lg pl-10 pr-4 text-text-primary text-sm focus:border-accent outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Ahmedabad, Gujarat"
                      className="w-full h-11 bg-black border border-border rounded-lg pl-10 pr-4 text-text-primary text-sm focus:border-accent outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2">Work Structure Type</label>
                  <div className="grid grid-cols-3 p-1 bg-black border border-border rounded-lg text-xs font-mono">
                    {["Onsite", "Hybrid", "Remote"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setWorkType(type)}
                        className={`h-9 font-medium rounded transition-all ${workType === type ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"}`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Job Description Ingestion Area */}
          {step === 2 && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <h2 className="text-xl font-semibold text-text-primary tracking-tight">Job Matrix Context</h2>
                <p className="text-xs text-text-muted font-mono mt-0.5">Input text fields or use prompt helper framework mapping</p>
              </div>

              <div className="bg-black border border-border rounded-xl p-4 space-y-3">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted">AI Job Description Helper</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={jdPrompt}
                    onChange={(e) => setJdPrompt(e.target.value)}
                    placeholder="e.g. Sales Executive with 1 year experience"
                    className="flex-1 h-10 bg-surface border border-border rounded-lg px-3 text-text-primary text-xs outline-none focus:border-accent font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateStructuredJD}
                    disabled={isJdGenerating || !jdPrompt.trim()}
                    className="h-10 px-4 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 disabled:opacity-40 shrink-0"
                  >
                    {isJdGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    BUILD_JD
                  </button>
                </div>
              </div>

              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste your raw requirements strings here directly to guide evaluation matrix extraction models..."
                className="w-full flex-1 min-h-[160px] bg-black border border-border rounded-xl p-4 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent outline-none resize-none leading-relaxed custom-scrollbar"
              />
            </div>
          )}

          {/* STEP 3: High-Fidelity Monospace Telemetry Pipeline Stream View */}
          {step === 3 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent animate-pulse" />
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary font-mono uppercase tracking-tight">Hiring Kit Synthesis Pipeline</h2>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">Model Cluster Threads Engagement Active</p>
                  </div>
                </div>
                
                {genPhase < 4 && genPhase > -1 ? (
                  <span className="text-[10px] font-mono bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded animate-pulse">PROCESSING_GPT4o</span>
                ) : genPhase === 4 ? (
                  <span className="text-[10px] font-mono bg-success/10 border border-success/20 text-success px-2 py-0.5 rounded">CLUSTER_READY</span>
                ) : (
                  <span className="text-[10px] font-mono bg-destructive/10 border border-destructive/20 text-destructive px-2 py-0.5 rounded">FAIL_INTERRUPT</span>
                )}
              </div>

              {/* Status Pipeline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { phase: 0, label: "Aptitude MCQs" },
                  { phase: 1, label: "Domain Matrix" },
                  { phase: 2, label: "Interview Script" },
                  { phase: 3, label: "Database Sync" }
                ].map((block) => {
                  const isDone = genPhase > block.phase;
                  const isActive = genPhase === block.phase;
                  
                  let borderClass = "border-border bg-black/40";
                  let textClass = "text-text-muted";
                  let statusLabel = "QUEUED";

                  if (isDone) {
                    borderClass = "border-success/30 bg-success/5";
                    textClass = "text-success";
                    statusLabel = "DONE";
                  } else if (isActive) {
                    borderClass = "border-accent/40 bg-accent/5 shadow-accent-glow";
                    textClass = "text-text-primary";
                    statusLabel = "BUILDING";
                  } else if (genPhase === -1) {
                    borderClass = "border-destructive/20 bg-destructive/5";
                    textClass = "text-destructive";
                    statusLabel = "HALTED";
                  }

                  return (
                    <div key={block.phase} className={`border rounded-xl p-3.5 transition-all text-left flex flex-col justify-between min-h-[76px] ${borderClass}`}>
                      <p className={`text-xs font-medium ${textClass}`}>{block.label}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] font-mono uppercase opacity-60 tracking-wider">{statusLabel}</span>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        ) : isActive ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-border" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scrolling Telemetry Terminal Console */}
              <div className="bg-black border border-border/80 rounded-xl p-4 font-mono text-[11px] text-text-muted h-32 overflow-y-auto flex flex-col gap-1.5 custom-scrollbar select-text">
                <div className="flex items-center gap-1.5 text-text-primary text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1 shrink-0">
                  <Terminal className="w-3.5 h-3.5 text-accent" /> Real-time Execution Stream Ticker
                </div>
                {logs.map((log, index) => (
                  <div key={index} className={`leading-relaxed whitespace-pre-wrap ${log.includes("SUCCESS") || log.includes("READY") ? "text-success" : log.includes("GPT") ? "text-accent" : ""}`}>
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}

          {/* Step Progression Buttons Action Bar Footer Row */}
          <div className="mt-8 pt-4 border-t border-border flex justify-between items-center shrink-0">
            {step > 1 && step < 3 ? (
              <button
                type="button"
                onClick={handleBack}
                className="h-10 px-4 rounded-lg text-xs font-mono text-text-muted border border-border hover:bg-surface hover:text-text-primary transition-all"
              >
                BACK
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={(step === 1 && (!title || !location)) || (step === 2 && !jd.trim())}
                className="h-10 px-5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto shadow-accent-glow"
              >
                CONTINUE_PIPELINE →
              </button>
            ) : (
              genPhase === 4 && (
                <button
                  type="button"
                  onClick={() => router.push(`/tasks/${generatedTaskId}`)}
                  className="h-10 px-6 bg-text-primary hover:bg-white text-black font-mono font-bold rounded-lg text-xs transition-colors ml-auto w-full sm:max-w-[240px]"
                >
                  LAUNCH_WORKSPACE →
                </button>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
}