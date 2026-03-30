import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateHash } from "@/lib/demoData";

interface MatchingEngineProps {
  isRunning: boolean;
  result: {
    compatible: boolean;
    score: number;
    suggestedSalary?: number;
  } | null;
  onComplete: () => void;
}

const COMPUTATION_STEPS = [
  "Encrypting candidate utility curve...",
  "Encrypting employer constraint set...",
  "Initializing FHE circuit...",
  "Computing encrypted intersection...",
  "Evaluating homomorphic comparison...",
  "Resolving encrypted salary range...",
  "Finalizing blind match result...",
];

export function MatchingEngine({ isRunning, result, onComplete }: MatchingEngineProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hashes, setHashes] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      setStep(0);
      setProgress(0);
      setHashes([]);
      setRevealed(false);
      return;
    }

    setRevealed(false);
    let currentStep = 0;
    let currentProgress = 0;

    const hashInterval = setInterval(() => {
      setHashes(prev => [...prev.slice(-4), generateHash()]);
    }, 150);

    const progressInterval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);

      if (currentProgress % 15 === 0 && currentStep < COMPUTATION_STEPS.length - 1) {
        currentStep++;
        setStep(currentStep);
      }

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        clearInterval(hashInterval);
        setTimeout(() => {
          setRevealed(true);
          onComplete();
        }, 400);
      }
    }, 40);

    return () => {
      clearInterval(progressInterval);
      clearInterval(hashInterval);
    };
  }, [isRunning, onComplete]);

  if (!isRunning && !result) return null;

  return (
    <div className="brutalist-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">FHE Engine</span>
        <span className="font-mono-cipher text-xs text-primary">
          {isRunning ? "COMPUTING" : revealed ? "COMPLETE" : "IDLE"}
        </span>
      </div>

      {isRunning && (
        <div className="space-y-3">
          <div className="font-mono-cipher text-xs text-muted-foreground">
            {COMPUTATION_STEPS[step]}
          </div>
          <div className="h-px bg-secondary relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="space-y-1">
            {hashes.slice(-3).map((h, i) => (
              <motion.div
                key={h}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1 - i * 0.3, x: 0 }}
                className="font-mono-cipher text-xs text-muted-foreground"
              >
                {h} ⊕ {generateHash()} → <span className="text-primary">[COMPUTING]</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {revealed && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-2"
          >
            {result.compatible ? (
              <>
                <div className="border border-primary p-4 space-y-3">
                  <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
                    ✓ MATCH FOUND — ENCRYPTED INTERSECTION DETECTED
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                      {result.score}%
                    </span>
                    <span className="font-mono-cipher text-xs text-muted-foreground">COMPATIBILITY</span>
                  </div>
                  {result.suggestedSalary && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-1"
                    >
                      <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                        Suggested Compensation
                      </div>
                      <motion.div
                        initial={{ filter: "blur(8px)" }}
                        animate={{ filter: "blur(0px)" }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="text-2xl font-semibold text-foreground"
                        style={{ fontFamily: 'Space Grotesk' }}
                      >
                        ${result.suggestedSalary.toLocaleString()}
                      </motion.div>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {["Identity Hidden", "Requirements Hidden", "Negotiation Optimized"].map(item => (
                      <div key={item} className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-primary">✓</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-secondary p-4 space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                  ✗ ENCRYPTED REJECTION
                </div>
                <div className="font-mono-cipher text-sm text-foreground">
                  No overlap detected in encrypted utility space.
                </div>
                <div className="font-mono-cipher text-xs text-muted-foreground">
                  Neither party's constraints have been revealed.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
