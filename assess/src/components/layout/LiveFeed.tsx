"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CandidateEvent {
  id: string;
  name: string;
  action: string;
  time: string;
  type: "scored" | "completed" | "started";
}

export default function LiveFeed() {
  const [events, setEvents] = useState<CandidateEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/tasks/list");
        if (response.ok) {
          const data = await response.json();
          const allEvents: CandidateEvent[] = [];

          for (const task of data.tasks || []) {
            for (const candidate of task.candidates || []) {
              const hasScores =
                candidate.aptScore || candidate.domScore || candidate.intScore;
              if (hasScores) {
                const scoreFields = [
                  { field: "aptScore", label: "aptitude" },
                  { field: "domScore", label: "domain" },
                  { field: "intScore", label: "interview" },
                ];
                for (const sf of scoreFields) {
                  if (candidate[sf.field]) {
                    allEvents.push({
                      id: `${candidate.id}-${sf.field}`,
                      name: candidate.name,
                      action: `scored ${candidate[sf.field]}% on ${sf.label}`,
                      time: "recent",
                      type: "scored",
                    });
                  }
                }
              }
            }
          }

          setEvents(allEvents.slice(0, 10));
        }
      } catch {
        console.error("Error fetching live feed");
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-[300px] h-screen fixed right-0 top-0 bg-[#0A0A0A] border-l border-border flex flex-col z-20">
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <h2 className="text-sm font-medium text-text-primary">Live Feed</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {events.length > 0 ? "Active" : "Waiting"}
          </span>
          <div
            className={`w-2 h-2 rounded-full ${
              events.length > 0 ? "bg-success animate-pulse" : "bg-border"
            }`}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {events.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">
              No recent activity. Share test links to see candidate results here.
            </p>
          ) : (
            <AnimatePresence>
              {events.map((event) => (
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
                      {event.name}{" "}
                      <span
                        className={
                          event.type === "scored"
                            ? "text-accent"
                            : event.type === "completed"
                            ? "text-success"
                            : "text-text-primary"
                        }
                      >
                        {event.action}
                      </span>
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{event.time}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </aside>
  );
}
