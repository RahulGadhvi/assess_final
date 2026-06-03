"use client";

import { motion, AnimatePresence } from "framer-motion";

const mockEvents = [
  { id: "1", name: "Aisha Patel", action: "scored 85%", time: "Just now", type: "scored" },
  { id: "2", name: "Rahul Singh", action: "completed aptitude", time: "2m ago", type: "completed" },
  { id: "3", name: "Priya Sharma", action: "started domain test", time: "15m ago", type: "started" },
];

export default function LiveFeed() {
  return (
    <aside className="w-[300px] h-screen fixed right-0 top-0 bg-[#0A0A0A] border-l border-border flex flex-col z-20">
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <h2 className="text-sm font-medium text-text-primary">Live Feed</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Active</span>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {mockEvents.map((event) => {
              let actionColor = "text-text-primary";
              if (event.type === "scored") actionColor = "text-accent";
              if (event.type === "completed") actionColor = "text-success";

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-text-muted">
                      {event.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {event.name} <span className={actionColor}>{event.action}</span>
                    </p>
                    <p className="text-xs font-mono text-text-muted mt-0.5">
                      {event.time}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}