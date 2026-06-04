"use client";

import { useState } from "react";
import { ArrowLeft, Save, Check } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("ACME Enterprise Hub");
  const [apiKey, setApiKey] = useState("");
  const [retentionDays, setRetentionDays] = useState("60");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Settings</h1>
          <p className="text-sm text-text-muted mt-0.5">Configure your company workspace and compliance criteria</p>
        </div>

        <form onSubmit={handleSave} className="bg-surface border border-border rounded-xl p-6 space-y-6">
          
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-text-muted">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full h-11 bg-black border border-border rounded-lg px-4 text-text-primary text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-text-muted">Custom OpenAI API Key (Optional)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Leave empty to use system defaults (sk-...)"
              className="w-full h-11 bg-black border border-border rounded-lg px-4 text-text-primary text-sm outline-none focus:border-accent"
            />
            <p className="text-[11px] text-text-muted leading-normal">
              Provide your own API key to bypass default system allocation limits and route billing directly to your organization.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-text-muted">Data Retention Window (DPDP Act 2023)</label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-full h-11 bg-black border border-border rounded-lg px-4 text-text-primary text-sm outline-none focus:border-accent"
            >
              <option value="30">30 Days (Standard Evaluation Cycle)</option>
              <option value="60">60 Days (Extended Pipeline Buffer)</option>
              <option value="90">90 Days (Maximum Legal Hold Retention)</option>
            </select>
            <p className="text-[11px] text-text-muted leading-normal">
              Candidate test records, personal information identifiers, and interview score matrices will be permanently purged automatically following this threshold.
            </p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              className="h-11 px-6 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isSaved ? "Settings Saved" : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}