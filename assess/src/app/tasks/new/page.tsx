"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Building2, MapPin, Wand2, Cpu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("Onsite");
  const [jd, setJd] = useState("");

  const [jdPrompt, setJdPrompt] = useState("");
  const [isJdGenerating, setIsJdGenerating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [generatedTaskId, setGeneratedTaskId] = useState<string | null>(null);
  const [genPhase, setGenPhase] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (step !== 3) return;
    const timestamp = () => new Date().toLocaleTimeString();

    if (genPhase === 0) {
      setLogs([`[${timestamp()}] Generating aptitude questions...`]);
    } else if (genPhase === 1) {
      setLogs(prev => [...prev, `[${timestamp()}] Aptitude questions ready. Generating domain questions...`]);
    } else if (genPhase === 2) {
      setLogs(prev => [...prev, `[${timestamp()}] Domain questions ready. Generating interview script...`]);
    } else if (genPhase === 3) {
      setLogs(prev => [...prev, `[${timestamp()}] Interview script ready. Saving to database...`]);
    } else if (genPhase === 4) {
      setLogs(prev => [...prev, `[${timestamp()}] Complete.`]);
    }
  }, [genPhase, step]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (step === 3) {
      const executePipeline = async () => {
        try {
          setError(null);

          setGenPhase(0);
          const aptResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "aptitude", roleTitle: title, location }),
          });
          if (!aptResponse.ok) throw new Error("Aptitude generation failed");
          const aptitudeData = await aptResponse.json();

          setGenPhase(1);
          const domResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "domain", roleTitle: title, location }),
          });
          if (!domResponse.ok) throw new Error("Domain assessment generation failed");
          const domainData = await domResponse.json();

          setGenPhase(2);
          const intResponse = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jd, type: "interview", roleTitle: title, location }),
          });
          if (!intResponse.ok) throw new Error("Interview script generation failed");
          const interviewData = await intResponse.json();

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

          if (!dbResponse.ok) throw new Error("Failed to save task");
          const dbData = await dbResponse.json();

          setGeneratedTaskId(dbData.taskId);
          setGenPhase(4);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Generation failed.";
          console.error(err);
          setError(message);
          setGenPhase(-1);
        }
      };

      executePipeline();
    }
  }, [step, jd, title, location, workType]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleGenerateJD = async () => {
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
      if (!res.ok) throw new Error(data.error || "Failed to generate JD.");
      setJd(data.jd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate JD.");
    } finally {
      setIsJdGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors mb-5">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${
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

        <div className="bg-[#0A0A0A] border border-border rounded-xl p-6 md:p-8 min-h-[440px] flex flex-col justify-between">
          {step === 1 && (
            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">New Hiring Task</h2>
                <p className="text-xs text-text-muted mt-0.5">Enter the position details</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-muted mb-2">Job Title</label>
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
                      className="w-full h-11 bg-black border border-border rounded-lg pl-10 pr-4 text-text-primary text-sm focus:border-accent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Ahmedabad, Gujarat"
                      className="w-full h-11 bg-black border border-border rounded-lg pl-10 pr-4 text-text-primary text-sm focus:border-accent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-2">Work Type</label>
                  <div className="grid grid-cols-3 p-1 bg-black border border-border rounded-lg text-xs">
                    {["Onsite", "Hybrid", "Remote"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setWorkType(type)}
                        className={`h-9 font-medium rounded transition-all ${workType === type ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Job Description</h2>
                <p className="text-xs text-text-muted mt-0.5">Paste the job description or generate one with AI</p>
              </div>

              <div className="bg-black border border-border rounded-xl p-4 space-y-3">
                <label className="block text-xs text-text-muted">AI Job Description Generator</label>
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
                    onClick={handleGenerateJD}
                    disabled={isJdGenerating || !jdPrompt.trim()}
                    className="h-10 px-4 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isJdGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    Generate
                  </button>
                </div>
              </div>

              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full flex-1 min-h-[160px] bg-black border border-border rounded-xl p-4 text-xs text-text-primary placeholder:text-text-muted focus:border-accent outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent" />
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">Generating Assessment Kit</h2>
                    <p className="text-xs text-text-muted mt-0.5">AI is creating questions for your position</p>
                  </div>
                </div>

                {genPhase < 4 && genPhase > -1 ? (
                  <span className="text-xs bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded">Processing</span>
                ) : genPhase === 4 ? (
                  <span className="text-xs bg-success/10 border border-success/20 text-success px-2 py-0.5 rounded">Complete</span>
                ) : (
                  <span className="text-xs bg-destructive/10 border border-destructive/20 text-destructive px-2 py-0.5 rounded">Failed</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { phase: 0, label: "Aptitude" },
                  { phase: 1, label: "Domain" },
                  { phase: 2, label: "Interview" },
                  { phase: 3, label: "Database" },
                ].map((block) => {
                  const isDone = genPhase > block.phase;
                  const isActive = genPhase === block.phase;

                  let borderClass = "border-border bg-black/40";
                  let textClass = "text-text-muted";
                  let statusLabel = "Pending";

                  if (isDone) {
                    borderClass = "border-success/30 bg-success/5";
                    textClass = "text-success";
                    statusLabel = "Done";
                  } else if (isActive) {
                    borderClass = "border-accent/40 bg-accent/5";
                    textClass = "text-accent";
                    statusLabel = "Generating";
                  } else if (genPhase === -1) {
                    borderClass = "border-destructive/20 bg-destructive/5";
                    textClass = "text-destructive";
                    statusLabel = "Failed";
                  }

                  return (
                    <div key={block.phase} className={`border rounded-xl p-3.5 transition-all flex flex-col justify-between min-h-[76px] ${borderClass}`}>
                      <p className={`text-xs font-medium ${textClass}`}>{block.label}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-text-muted">{statusLabel}</span>
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

              <div className="bg-black border border-border/80 rounded-xl p-4 text-xs text-text-muted h-28 overflow-y-auto flex flex-col gap-1.5">
                {logs.map((log, index) => (
                  <div key={index} className={`leading-relaxed ${
                    log.includes("ready") || log.includes("Complete") ? "text-success" : ""
                  }`}>
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-border flex justify-between items-center shrink-0">
            {step > 1 && step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="h-10 px-4 rounded-lg text-xs text-text-muted border border-border hover:bg-surface hover:text-text-primary transition-all"
              >
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={(step === 1 && (!title || !location)) || (step === 2 && !jd.trim())}
                className="h-10 px-5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
              >
                {step === 2 ? "Generate Assessment" : "Continue"}
              </button>
            ) : (
              genPhase === 4 && (
                <button
                  type="button"
                  onClick={() => router.push(`/tasks/${generatedTaskId}`)}
                  className="h-10 px-6 bg-text-primary hover:bg-white text-black font-medium rounded-lg text-xs transition-colors ml-auto"
                >
                  View Task
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
