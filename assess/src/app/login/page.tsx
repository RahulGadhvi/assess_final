"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const targetEndpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegistering ? { email, password, companyName } : { email, password };

    try {
      const res = await fetch(targetEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      if (isRegistering) {
        setIsRegistering(false);
        setErrorMessage("Account created successfully! Please sign in below.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerDemoMode = async () => {
    setErrorMessage(null);
    setIsDemoLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDemoMode: true }),
      });
      
      if (res.ok) {
        router.push("/dashboard");
      } else {
        throw new Error("Demo workspace environment failed to load.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Demo workspace environment failed to load.");
      setIsDemoLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-surface border border-border rounded-xl p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <h1 className="font-mono font-bold text-3xl text-text-primary tracking-tight mb-1">assess.</h1>
          <p className="text-text-muted text-sm">
            {isRegistering ? "Create your organization workspace" : "Sign in to your hiring command center"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 mb-4 ${
                errorMessage.includes("successfully")
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Company Name"
                className="w-full h-11 bg-black border border-border rounded-lg px-4 text-text-primary text-sm outline-none transition-colors focus:border-accent"
              />
            </div>
          )}

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
              className="w-full h-11 bg-black border border-border rounded-lg px-4 text-text-primary text-sm outline-none transition-colors focus:border-accent"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full h-11 bg-black border border-border rounded-lg px-4 pr-10 text-text-primary text-sm outline-none transition-colors focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || isDemoLoading}
            className="w-full h-11 bg-text-primary hover:bg-white text-black font-medium rounded-lg text-sm transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegistering ? "Register Workspace" : "Sign In"}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-3 text-text-muted font-mono">Or Presentation Box</span></div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleTriggerDemoMode}
          disabled={isLoading || isDemoLoading}
          className="w-full h-11 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-accent-glow"
        >
          {isDemoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Explore Live Demo Mode</span>
        </motion.button>

        <div className="mt-6 text-center text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMessage(null);
            }}
            className="text-text-muted hover:text-text-primary transition-colors underline"
          >
            {isRegistering ? "Already have an account? Sign in" : "Need multi-user tracking? Register your company"}
          </button>
        </div>
      </motion.div>
    </main>
  );
}