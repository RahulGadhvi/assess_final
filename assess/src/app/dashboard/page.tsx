"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Briefcase, Users, CheckCircle, ArrowRight, Trash2, Save, Check, LayoutDashboard, Settings, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface TaskSummary {
  id: string;
  title: string;
  location: string;
  workType: string;
  candidates?: Array<{ id: string }>;
  completionRate?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [activeTab, setActiveTab] = useState<"tasks" | "settings">("tasks");
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setCompanyName((session.user as any).companyName || "");
    }
    fetchTasks();
  }, [session]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks/list");
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch {
      console.error("Error fetching tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this position permanently?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch {
      console.error("Error deleting task");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      if (response.ok) {
        await update({ companyName });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || "Failed to save settings.");
      }
    } catch {
      console.error("Error saving settings");
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const initials = userName.substring(0, 2).toUpperCase();
  const displayCompany = companyName || "Workspace";

  return (
    <div className="min-h-screen bg-background flex text-text-primary">
      <aside className="w-[220px] h-screen fixed left-0 top-0 bg-[#0A0A0A] border-r border-border flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-bold text-xl tracking-tighter">assess.</span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left w-full ${
              activeTab === "tasks"
                ? "bg-surface border-l-2 border-accent text-text-primary"
                : "text-text-muted hover:text-text-primary hover:bg-surface/50 border-l-2 border-transparent"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Hiring Tasks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left w-full ${
              activeTab === "settings"
                ? "bg-surface border-l-2 border-accent text-text-primary"
                : "text-text-muted hover:text-text-primary hover:bg-surface/50 border-l-2 border-transparent"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-border flex items-center gap-3 mt-auto">
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-text-muted truncate">{displayCompany}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-text-muted hover:text-destructive transition-colors p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[220px] p-6 md:p-12 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          {activeTab === "tasks" ? (
            <>
              <header className="flex items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{displayCompany}</h1>
                  <p className="text-xs text-text-muted mt-0.5">
                    {tasks.length} active position{tasks.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <Link href="/tasks/new">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="h-11 px-5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> New Task
                  </motion.button>
                </Link>
              </header>

              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Active Roles", value: tasks.length, icon: Briefcase },
                  { label: "Total Candidates", value: tasks.reduce((acc, t) => acc + (t.candidates?.length || 0), 0), icon: Users },
                  { label: "Assessments Finished", value: tasks.reduce((acc, t) => acc + ((t.completionRate ?? 0) > 0 ? 1 : 0), 0), icon: CheckCircle },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted">{stat.label}</p>
                      <p className="text-xl font-medium mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className="w-5 h-5 text-text-muted opacity-50" />
                  </div>
                ))}
              </section>

              <div className="space-y-4">
                <h2 className="text-xs text-text-muted px-1">
                  Positions
                </h2>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="bg-surface border border-border border-dashed text-center p-12 rounded-xl text-sm text-text-muted">
                      No positions yet. Create your first hiring task.
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="relative group">
                        <Link href={`/tasks/${task.id}`} className="block">
                          <div className="bg-surface border border-border group-hover:border-text-muted rounded-xl p-5 pr-24 transition-all flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-base group-hover:text-accent transition-colors capitalize">
                                {task.title}
                              </h3>
                              <p className="text-xs text-text-muted mt-1 capitalize">
                                {task.location} &middot; {task.workType}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-xs bg-black border border-border px-2.5 py-1 rounded text-text-muted">
                                {task.id.substring(0, 8)}...
                              </span>
                              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                            </div>
                          </div>
                        </Link>

                        <button
                          onClick={(e) => handleDeleteTask(e, task.id)}
                          className="absolute right-14 top-1/2 -translate-y-1/2 p-2.5 rounded-lg border border-border bg-black text-text-muted hover:text-destructive hover:border-destructive/30 opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <header className="border-b border-border pb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="text-xs text-text-muted mt-0.5">Manage your workspace settings</p>
              </header>

              <form onSubmit={handleSaveSettings} className="bg-surface border border-border rounded-xl p-6 space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="block text-xs text-text-muted">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full h-11 bg-black border border-border rounded-lg px-4 text-text-primary text-sm outline-none focus:border-accent"
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <button
                    type="submit"
                    className="h-11 px-6 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaved ? "Saved" : "Save Changes"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
