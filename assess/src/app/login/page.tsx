"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-surface border border-border rounded-xl p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <h1 className="font-mono font-bold text-3xl text-text-primary tracking-tight mb-1">
            assess.
          </h1>
          <p className="text-text-muted text-sm">
            Sign in to your hiring dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
              className="w-full h-11 bg-black border border-border rounded-lg px-4 text-text-primary text-sm outline-none transition-all focus:border-accent"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full h-11 bg-black border border-border rounded-lg px-4 pr-10 text-text-primary text-sm outline-none transition-all focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-6 bg-black border border-border rounded-lg p-3 text-center">
          <p className="font-mono text-xs text-text-muted">
            Demo: admin@assess.com / admin123
          </p>
        </div>
      </motion.div>
    </main>
  );
}