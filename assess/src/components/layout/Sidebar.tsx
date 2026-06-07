"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";

interface SidebarProps {
  activeTab?: "tasks" | "settings";
  setActiveTab?: (tab: "tasks" | "settings") => void;
}

export default function Sidebar({ activeTab = "tasks", setActiveTab }: SidebarProps) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Assess Workspace");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCompany = localStorage.getItem("employer_company");
      if (storedCompany) setCompanyName(storedCompany);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("employer_company");
    router.push("/");
  };

  const navigateToTab = (tab: "tasks" | "settings") => {
    if (setActiveTab) {
      setActiveTab(tab);
      // Ensure user lands safely on core workspace grid canvas
      router.push("/dashboard");
    }
  };

  return (
    <aside className="w-[220px] h-screen fixed left-0 top-0 bg-[#0A0A0A] border-r border-border flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <span className="font-mono font-bold text-xl tracking-tighter text-text-primary">
          assess.
        </span>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
        <button
          onClick={() => navigateToTab("tasks")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
            activeTab === "tasks"
              ? "bg-surface border-l-2 border-accent text-text-primary"
              : "text-text-muted hover:text-text-primary hover:bg-surface/50 border-l-2 border-transparent"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Hiring Tasks
        </button>

        <button
          onClick={() => navigateToTab("settings")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
            activeTab === "settings"
              ? "bg-surface border-l-2 border-accent text-text-primary"
              : "text-text-muted hover:text-text-primary hover:bg-surface/50 border-l-2 border-transparent"
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </nav>

      <div className="p-4 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
          RG
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">Rahul Gadhvi</p>
          <p className="text-xs text-text-muted truncate font-mono uppercase tracking-tight">{companyName}</p>
        </div>
        <button 
          onClick={handleLogout}
          title="Sign Out"
          className="text-text-muted hover:text-destructive transition-colors p-1"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}