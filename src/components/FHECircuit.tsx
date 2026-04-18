import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateHash } from "@/lib/demoData";

interface Gate {
  id: string;
  type: "AND" | "OR" | "GTE" | "LTE" | "ADD" | "DIV" | "NOT";
  x: number;
  y: number;
  active: boolean;
  output?: string;
}

const GATE_COLORS = {
  AND: "#ff4d00",
  OR: "#a8a49e",
  GTE: "#ff4d00",
  LTE: "#a8a49e",
  ADD: "#f0ede8",
  DIV: "#a8a49e",
  NOT: "#383838",
};

export function FHECircuit({ running = false }: { running?: boolean }) {
  const [activeGates, setActiveGates] = useState<Set<string>>(new Set());
  const [pulseIndex, setPulseIndex] = useState(0);
  const [outputHash, setOutputHash] = useState(generateHash());

  const gates: Gate[] = [
    { id: "g1", type: "GTE", x: 15, y: 20, active: false },
    { id: "g2", type: "LTE", x: 15, y: 60, active: false },
    { id: "g3", type: "AND", x: 45, y: 40, active: false },
    { id: "g4", type: "GTE", x: 15, y: 80, active: false },
    { id: "g5", type: "AND", x: 70, y: 50, active: false },
    { id: "g6", type: "ADD", x: 45, y: 75, active: false },
    { id: "g7", type: "DIV", x: 70, y: 80, active: false },
  ];

  const sequence = ["g1", "g2", "g4", "g3", "g6", "g5", "g7"];

  useEffect(() => {
    if (!running) {
      setActiveGates(new Set());
      setPulseIndex(0);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setActiveGates(prev => new Set([...prev, sequence[i]]));
        i++;
      } else {
        setOutputHash(generateHash());
        clearInterval(interval);
      }
    }, 280);

    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">FHE Circuit</span>
        <span className={`font-mono-cipher text-xs ${running ? "text-primary animate-pulse" : "text-muted-foreground"}`}>
          {running ? "EXECUTING" : "STANDBY"}
        </span>
      </div>

      <div className="relative h-32 bg-background border border-border overflow-hidden">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#383838" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Wires */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Input wires */}
          <line x1="0%" y1="20%" x2="15%" y2="20%" stroke="#383838" strokeWidth="1" />
          <line x1="0%" y1="60%" x2="15%" y2="60%" stroke="#383838" strokeWidth="1" />
          <line x1="0%" y1="80%" x2="15%" y2="80%" stroke="#383838" strokeWidth="1" />
          {/* Gate connections */}
          <line x1="22%" y1="20%" x2="45%" y2="38%" stroke={activeGates.has("g1") ? "#ff4d00" : "#383838"} strokeWidth="1" />
          <line x1="22%" y1="60%" x2="45%" y2="42%" stroke={activeGates.has("g2") ? "#ff4d00" : "#383838"} strokeWidth="1" />
          <line x1="22%" y1="80%" x2="45%" y2="75%" stroke={activeGates.has("g4") ? "#ff4d00" : "#383838"} strokeWidth="1" />
          <line x1="52%" y1="40%" x2="70%" y2="48%" stroke={activeGates.has("g3") ? "#ff4d00" : "#383838"} strokeWidth="1" />
          <line x1="52%" y1="75%" x2="70%" y2="78%" stroke={activeGates.has("g6") ? "#ff4d00" : "#383838"} strokeWidth="1" />
          <line x1="77%" y1="50%" x2="100%" y2="50%" stroke={activeGates.has("g5") ? "#ff4d00" : "#383838"} strokeWidth="1.5" />
          <line x1="77%" y1="80%" x2="100%" y2="80%" stroke={activeGates.has("g7") ? "#ff4d00" : "#383838"} strokeWidth="1" />
        </svg>

        {/* Gates */}
        {gates.map(gate => (
          <motion.div
            key={gate.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${gate.x}%`, top: `${gate.y}%` }}
            animate={activeGates.has(gate.id) ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="font-mono-cipher text-xs px-1.5 py-0.5 border"
              style={{
                borderColor: activeGates.has(gate.id) ? GATE_COLORS[gate.type] : "#383838",
                color: activeGates.has(gate.id) ? GATE_COLORS[gate.type] : "#a8a49e",
                backgroundColor: activeGates.has(gate.id) ? `${GATE_COLORS[gate.type]}15` : "#161616",
                fontSize: "9px",
              }}
            >
              {gate.type}
            </div>
          </motion.div>
        ))}

        {/* Input labels */}
        <div className="absolute left-1 top-[16%] font-mono-cipher text-muted-foreground" style={{ fontSize: "8px" }}>
          euint256
        </div>
        <div className="absolute left-1 top-[56%] font-mono-cipher text-muted-foreground" style={{ fontSize: "8px" }}>
          euint256
        </div>
        <div className="absolute left-1 top-[76%] font-mono-cipher text-muted-foreground" style={{ fontSize: "8px" }}>
          euint256
        </div>

        {/* Output */}
        <AnimatePresence>
          {activeGates.has("g5") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-1 top-[44%] font-mono-cipher text-primary"
              style={{ fontSize: "8px" }}
            >
              ebool
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Output hash */}
      <AnimatePresence>
        {activeGates.has("g5") && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono-cipher text-xs text-primary border border-primary/30 px-3 py-2 bg-primary/5"
          >
            OUTPUT: {outputHash} → <span className="text-foreground">ebool(true)</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
