"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Briefcase, Users, CheckCircle, ArrowRight, Settings } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks/list");
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Hiring Dashboard</h1>
            <p className="text-sm text-text-muted font-mono mt-0.5">Account: Workspace Admin</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/settings">
              <button className="h-11 px-4 border border-border hover:bg-surface text-text-primary rounded-lg text-sm flex items-center gap-2 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </button>
            </Link>
            <Link href="/tasks/new">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="h-11 px-5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Hiring Task
              </motion.button>
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Active Roles", value: isLoading ? "..." : tasks.length, icon: Briefcase },
            { label: "Total Candidates", value: isLoading ? "..." : tasks.reduce((acc, t) => acc + (t.candidates?.length || 0), 0), icon: Users },
            { label: "Assessments Finished", value: "3", icon: CheckCircle },
          ].map((stat, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-text-muted">{stat.label}</p>
                <p className="text-xl font-medium mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-5 h-5 text-text-muted opacity-50" />
            </div>
          ))}
        </section>

        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono px-1">
            Active Positions ({tasks.length})
          </h2>
          
          <div className="space-y-3">
            {isLoading ? (
              <div className="h-24 w-full bg-surface border border-border rounded-xl animate-pulse" />
            ) : (
              tasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="block">
                  <div className="bg-surface border border-border hover:border-text-muted rounded-xl p-5 transition-all flex items-center justify-between group">
                    <div>
                      <h3 className="font-medium text-text-primary text-base group-hover:text-accent transition-colors capitalize">
                        {task.title}
                      </h3>
                      <p className="text-xs text-text-muted mt-1 font-mono">
                        {task.location} · {task.workType}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono bg-black border border-border px-3 py-1 rounded text-text-muted uppercase">
                        ID: {task.id}
                      </span>
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}