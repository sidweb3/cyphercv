import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, CheckCircle, Clock } from "lucide-react";
import { generateHash } from "@/lib/demoData";

interface ConsentRevealProps {
  matchId: string;
  candidateConsented: boolean;
  employerConsented: boolean;
  salaryRevealed: boolean;
  suggestedSalary?: number;
  score?: number;
  onCandidateConsent: () => void;
  onEmployerConsent: () => void;
  role: "candidate" | "employer";
}

export function ConsentReveal({
  matchId,
  candidateConsented,
  employerConsented,
  salaryRevealed,
  suggestedSalary,
  score,
  onCandidateConsent,
  onEmployerConsent,
  role,
}: ConsentRevealProps) {
  const [signing, setSigning] = useState(false);
  const [signatureHash, setSignatureHash] = useState("");
  const [decryptStep, setDecryptStep] = useState(0);

  const bothConsented = candidateConsented && employerConsented;

  useEffect(() => {
    if (bothConsented && !salaryRevealed) {
      // Simulate decryption sequence
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setDecryptStep(step);
        if (step >= 4) clearInterval(interval);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [bothConsented, salaryRevealed]);

  const handleConsent = async () => {
    setSigning(true);
    setSignatureHash(generateHash());
    await new Promise(r => setTimeout(r, 1200));
    if (role === "candidate") onCandidateConsent();
    else onEmployerConsent();
    setSigning(false);
  };

  const myConsented = role === "candidate" ? candidateConsented : employerConsented;
  const otherConsented = role === "candidate" ? employerConsented : candidateConsented;

  return (
    <div className="border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
          Mutual Consent Reveal
        </span>
        <span className="font-mono-cipher text-xs text-muted-foreground">
          {matchId.slice(0, 10)}...
        </span>
      </div>

      {/* Consent status */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`border p-3 space-y-1 ${candidateConsented ? "border-primary" : "border-border"}`}>
          <div className="flex items-center gap-2">
            {candidateConsented
              ? <CheckCircle className="w-3 h-3 text-primary" />
              : <Clock className="w-3 h-3 text-muted-foreground" />
            }
            <span className="font-mono-cipher text-xs text-muted-foreground">Candidate</span>
          </div>
          <div className={`font-mono-cipher text-xs ${candidateConsented ? "text-primary" : "text-muted-foreground"}`}>
            {candidateConsented ? "SIGNED" : "AWAITING"}
          </div>
        </div>
        <div className={`border p-3 space-y-1 ${employerConsented ? "border-primary" : "border-border"}`}>
          <div className="flex items-center gap-2">
            {employerConsented
              ? <CheckCircle className="w-3 h-3 text-primary" />
              : <Clock className="w-3 h-3 text-muted-foreground" />
            }
            <span className="font-mono-cipher text-xs text-muted-foreground">Employer</span>
          </div>
          <div className={`font-mono-cipher text-xs ${employerConsented ? "text-primary" : "text-muted-foreground"}`}>
            {employerConsented ? "SIGNED" : "AWAITING"}
          </div>
        </div>
      </div>

      {/* Sign button */}
      {!myConsented && (
        <motion.button
          onClick={handleConsent}
          disabled={signing}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 border border-primary text-primary font-mono-cipher text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-100 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {signing ? (
            <>
              <span className="animate-pulse">▋</span>
              Signing with wallet...
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              Sign Consent ({role})
            </>
          )}
        </motion.button>
      )}

      {signing && signatureHash && (
        <div className="font-mono-cipher text-xs text-muted-foreground">
          sig: {signatureHash}
        </div>
      )}

      {/* Decryption sequence */}
      <AnimatePresence>
        {bothConsented && !salaryRevealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2 border border-primary/30 p-3 bg-primary/5"
          >
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
              Decrypting via @cofhe/sdk...
            </div>
            {[
              "client.decryptForTx(ctHash).withoutPermit()",
              "Threshold Network signature received",
              "FHE.publishDecryptResult(ctHash, value, sig)",
              "Salary midpoint revealed on-chain",
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0 }}
                animate={decryptStep > i ? { opacity: 1 } : { opacity: 0.3 }}
                className={`font-mono-cipher flex items-center gap-2 ${decryptStep > i ? "text-foreground" : "text-muted-foreground"}`}
                style={{ fontSize: "11px" }}
              >
                <span className={decryptStep > i ? "text-primary" : "text-muted-foreground"}>
                  {decryptStep > i ? "✓" : "○"}
                </span>
                {step}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed salary */}
      <AnimatePresence>
        {salaryRevealed && suggestedSalary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-primary p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Unlock className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
                Salary Revealed
              </span>
            </div>
            <motion.div
              initial={{ filter: "blur(12px)" }}
              animate={{ filter: "blur(0px)" }}
              transition={{ duration: 0.8 }}
              className="text-3xl font-bold text-foreground"
              style={{ fontFamily: "Space Grotesk" }}
            >
              ${suggestedSalary.toLocaleString()}
            </motion.div>
            {score && (
              <div className="font-mono-cipher text-xs text-muted-foreground">
                Match score: <span className="text-primary">{score}%</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
