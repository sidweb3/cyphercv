import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";

export type TxStep = {
  label: string;
  detail?: string;
};

interface TxProgressBarProps {
  steps: TxStep[];
  currentStep: number; // 0-based index of active step; -1 = not started; >= steps.length = done
  error?: string | null;
  className?: string;
}

/**
 * Animated transaction progress bar.
 * Shows step-by-step status for wallet approval and on-chain submission.
 * currentStep: 0 = first step active, steps.length = all done
 */
export function TxProgressBar({ steps, currentStep, error, className = "" }: TxProgressBarProps) {
  const progress = currentStep < 0 ? 0 : Math.min((currentStep / steps.length) * 100, 100);
  const isDone = currentStep >= steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`border border-border bg-card p-4 space-y-3 ${className}`}
    >
      {/* Progress bar track */}
      <div className="relative h-1 bg-border overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 ${error ? "bg-destructive" : isDone ? "bg-primary" : "bg-primary"}`}
          initial={{ width: "0%" }}
          animate={{ width: `${error ? 100 : progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {/* Shimmer effect while in progress */}
        {!isDone && !error && (
          <motion.div
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            animate={{ x: ["-64px", "100vw"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isDoneStep = i < currentStep || isDone;
          const isPending = i > currentStep && !isDone;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: isPending ? 0.35 : 1 }}
              className="flex items-start gap-2.5"
            >
              <div className="shrink-0 mt-0.5">
                {isDoneStep ? (
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 border border-border rounded-full" />
                )}
              </div>
              <div className="min-w-0">
                <div className={`font-mono-cipher text-xs ${isDoneStep ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </div>
                {step.detail && isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="font-mono-cipher text-muted-foreground mt-0.5"
                    style={{ fontSize: "10px" }}
                  >
                    {step.detail}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="font-mono-cipher text-xs text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done state */}
      <AnimatePresence>
        {isDone && !error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="font-mono-cipher text-xs text-primary flex items-center gap-2"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Transaction confirmed
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient message */}
      {!isDone && !error && (
        <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
          Please wait — wallet approval and on-chain confirmation may take 15–60 seconds
        </div>
      )}
    </motion.div>
  );
}
