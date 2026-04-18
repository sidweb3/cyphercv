import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateHash } from "@/lib/demoData";

interface FeedEvent {
  id: string;
  type: "match" | "encrypt" | "reject" | "reveal" | "commit";
  message: string;
  hash: string;
  timestamp: number;
}

const EVENT_TEMPLATES = [
  { type: "encrypt" as const, message: "Profile encrypted and committed" },
  { type: "match" as const, message: "Encrypted intersection detected" },
  { type: "reject" as const, message: "No overlap in utility space" },
  { type: "commit" as const, message: "Job spec committed to Fhenix" },
  { type: "encrypt" as const, message: "Salary range encrypted" },
  { type: "match" as const, message: "FHE match confirmed — 94% score" },
  { type: "reveal" as const, message: "Mutual consent — salary revealed" },
  { type: "commit" as const, message: "Candidate profile on-chain" },
  { type: "reject" as const, message: "Budget mismatch — zero info leaked" },
  { type: "match" as const, message: "Skill vector intersection found" },
];

const TYPE_COLORS = {
  match: "text-primary",
  encrypt: "text-foreground",
  reject: "text-muted-foreground",
  reveal: "text-primary",
  commit: "text-muted-foreground",
};

const TYPE_PREFIX = {
  match: "MATCH",
  encrypt: "ENCRYPT",
  reject: "REJECT",
  reveal: "REVEAL",
  commit: "COMMIT",
};

export function ActivityFeed({ maxItems = 8 }: { maxItems?: number }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    // Seed with initial events
    const initial: FeedEvent[] = Array.from({ length: 4 }, (_, i) => {
      const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
      return {
        id: `init-${i}`,
        type: template.type,
        message: template.message,
        hash: generateHash(),
        timestamp: Date.now() - (4 - i) * 3000,
      };
    });
    setEvents(initial);

    // Add new events periodically
    const interval = setInterval(() => {
      const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      const newEvent: FeedEvent = {
        id: `${Date.now()}-${Math.random()}`,
        type: template.type,
        message: template.message,
        hash: generateHash(),
        timestamp: Date.now(),
      };
      setEvents(prev => [newEvent, ...prev].slice(0, maxItems));
    }, 2800);

    return () => clearInterval(interval);
  }, [maxItems]);

  return (
    <div className="border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
          Protocol Activity
        </span>
        <span className="flex items-center gap-1.5 font-mono-cipher text-xs text-primary">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          LIVE
        </span>
      </div>
      <div className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-3 flex items-center gap-3"
            >
              <span
                className={`font-mono-cipher shrink-0 border px-1.5 py-0.5 ${
                  event.type === "match" || event.type === "reveal"
                    ? "border-primary text-primary"
                    : event.type === "reject"
                    ? "border-border text-muted-foreground"
                    : "border-border text-muted-foreground"
                }`}
                style={{ fontSize: "9px" }}
              >
                {TYPE_PREFIX[event.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`font-mono-cipher text-xs truncate ${TYPE_COLORS[event.type]}`}>
                  {event.message}
                </div>
                <div className="font-mono-cipher text-muted-foreground truncate" style={{ fontSize: "10px" }}>
                  {event.hash}
                </div>
              </div>
              <div className="font-mono-cipher text-muted-foreground shrink-0" style={{ fontSize: "10px" }}>
                {new Date(event.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
