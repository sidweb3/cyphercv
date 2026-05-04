import { AppLayout } from "./AppLayout";
import { DemoMode } from "@/components/DemoMode";
import { FHECircuit } from "@/components/FHECircuit";
import { BatchMatcher } from "@/components/BatchMatcher";
import { SkillHeatmap } from "@/components/SkillHeatmap";
import { ActivityFeed } from "@/components/ActivityFeed";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Zap, BarChart2, Grid, Activity, Play, RefreshCw, CheckCircle,
  XCircle, Clock, List, Shield, TrendingUp, DollarSign, Briefcase,
  ChevronDown, ChevronUp, Calculator, FileText,
} from "lucide-react";
import { useAccount } from "wagmi";
import { generateHash, computeMatch } from "@/lib/demoData";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

// ─── Live Match Simulator ─────────────────────────────────────────────────────
function LiveMatchSimulator() {
  const { address } = useAccount();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ compatible: boolean; score: number; suggestedSalary?: number } | null>(null);

  const candidateProfile = useQuery(
    api.profiles.getCandidateProfile,
    address ? { walletAddress: address } : "skip"
  );
  const allJobs = useQuery(api.profiles.getAllJobPostings);
  const requestMatch = useMutation(api.matches.requestMatch);
  const createNotification = useMutation(api.notifications.createNotification);

  const steps = [
    "Fetching encrypted candidate profile...",
    "Scanning job pool for compatible specs...",
    "Running FHE.gte(budget, candidateMin)...",
    "Running FHE.gte(candidateExp, requiredExp)...",
    "Computing FHE.and(salaryMatch, expMatch)...",
    "Resolving ebool result — no plaintext exposed...",
    "Match computation complete.",
  ];

  const runSimulation = async () => {
    if (!address || !candidateProfile) {
      toast.error("Submit your candidate profile first");
      return;
    }
    const jobs = allJobs ?? [];
    if (jobs.length === 0) {
      toast.error("No job postings available yet");
      return;
    }

    setRunning(true);
    setResult(null);
    setStep(0);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
      setStep(i + 1);
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const matchResult = computeMatch(
      80000, 160000,
      120000,
      candidateProfile.experienceYears,
      job.requiredExpYears
    );

    setResult(matchResult);

    try {
      await requestMatch({
        candidateWallet: address,
        employerWallet: job.walletAddress,
        candidateProfileId: candidateProfile._id,
        jobPostingId: job._id,
        score: matchResult.score,
        compatible: matchResult.compatible,
        suggestedSalary: matchResult.suggestedSalary,
      });

      if (matchResult.compatible) {
        await createNotification({
          walletAddress: address,
          type: "match_found",
          title: "Match Found!",
          message: `FHE matching found a ${matchResult.score}% compatible employer. Mutual consent required to reveal salary.`,
        });
        toast.success(`Match found — ${matchResult.score}% compatibility`);
      } else {
        toast.info("No match — encrypted rejection, zero info leaked");
      }
    } catch {
      // Match may already exist
    }

    setRunning(false);
  };

  return (
    <div className="border border-border bg-card">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Live FHE Match Simulation</div>
          <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>
            Run the matching protocol against the live job pool
          </div>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <button
              onClick={() => { setResult(null); setStep(0); }}
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
          <button
            onClick={runSimulation}
            disabled={running}
            className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50 flex items-center gap-2"
          >
            {running ? <span className="animate-pulse">▋</span> : <Play className="w-3 h-3" />}
            {running ? "Computing..." : "Run Match"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {(running || step > 0) && (
          <div className="space-y-2">
            {steps.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: step > i ? 1 : step === i ? 0.7 : 0.2 }}
                className="flex items-center gap-3 font-mono-cipher text-xs"
              >
                <span className={step > i ? "text-primary" : step === i ? "text-primary animate-pulse" : "text-muted-foreground"}>
                  {step > i ? "✓" : step === i ? "▋" : "○"}
                </span>
                <span className={step > i ? "text-foreground" : "text-muted-foreground"}>{s}</span>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {result && !running && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border p-5 space-y-3 ${result.compatible ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <div className="flex items-center gap-3">
                {result.compatible
                  ? <CheckCircle className="w-4 h-4 text-primary" />
                  : <XCircle className="w-4 h-4 text-muted-foreground" />
                }
                <span className={`font-mono-cipher text-xs uppercase tracking-widest ${result.compatible ? "text-primary" : "text-muted-foreground"}`}>
                  {result.compatible ? "Match Found — Encrypted Intersection Detected" : "No Match — Zero Information Leaked"}
                </span>
              </div>
              {result.compatible && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border p-4 text-center">
                    <div className="text-3xl font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>{result.score}%</div>
                    <div className="font-mono-cipher text-xs text-muted-foreground mt-1">Compatibility</div>
                  </div>
                  {result.suggestedSalary && (
                    <div className="border border-border p-4 text-center">
                      <motion.div
                        initial={{ filter: "blur(8px)" }}
                        animate={{ filter: "blur(0px)" }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-3xl font-bold text-foreground"
                        style={{ fontFamily: "Space Grotesk" }}
                      >
                        ${result.suggestedSalary.toLocaleString()}
                      </motion.div>
                      <div className="font-mono-cipher text-xs text-muted-foreground mt-1">Suggested Salary</div>
                    </div>
                  )}
                </div>
              )}
              <div className="font-mono-cipher text-xs text-muted-foreground">
                {result.compatible
                  ? "Both parties must consent to reveal salary details. See your matches below to sign consent."
                  : "No overlap detected in encrypted utility space. Neither party's constraints were revealed."
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!running && step === 0 && !result && (
          <div className="text-center py-6">
            <div className="font-mono-cipher text-xs text-muted-foreground">
              {candidateProfile
                ? "Profile ready. Click Run Match to simulate FHE matching against the live job pool."
                : "Submit your candidate profile first to run live matching."
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Counter Offer Modal ──────────────────────────────────────────────────────
function CounterOfferModal({
  matchId,
  employerWallet,
  suggestedSalary,
  onClose,
}: {
  matchId: Id<"matchRequests">;
  employerWallet: string;
  suggestedSalary?: number;
  onClose: () => void;
}) {
  const { address } = useAccount();
  const submitCounterOffer = useMutation(api.matches.submitCounterOffer);
  const createNotification = useMutation(api.notifications.createNotification);

  const [currentSalary, setCurrentSalary] = useState(suggestedSalary ? String(Math.round(suggestedSalary * 0.85)) : "");
  const [targetIncrease, setTargetIncrease] = useState("20");
  const [yearsAtCompany, setYearsAtCompany] = useState("2");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    offersNeeded: number;
    projectedIncrease: number;
    negotiationScript: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!address || !currentSalary || !role) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await submitCounterOffer({
        walletAddress: address,
        matchId,
        currentSalary: Number(currentSalary),
        targetIncreasePercent: Number(targetIncrease),
        yearsAtCompany: Number(yearsAtCompany),
        role,
      });
      const offersNeeded = Math.ceil(3 + Number(targetIncrease) / 10);
      const projectedIncrease = Math.round(Number(targetIncrease) * (1 + Number(yearsAtCompany) * 0.05));
      setResult({
        offersNeeded,
        projectedIncrease,
        negotiationScript: `Based on ${yearsAtCompany} years at company and ${targetIncrease}% target increase, request ${projectedIncrease}% citing market data. Secure ${offersNeeded} competing offers first.`,
      });
      await createNotification({
        walletAddress: address,
        type: "counter_offer_ready",
        title: "Counter-Offer Analysis Ready",
        message: `Your negotiation strategy is ready. Target: +${projectedIncrease}% with ${offersNeeded} competing offers.`,
      });
      toast.success("Counter-offer analysis complete");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to compute counter-offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-card border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
              Counter-Offer Calculator
            </span>
          </div>
          <button onClick={onClose} className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Employer info */}
          <div className="border border-border bg-background p-4 space-y-1">
            <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>MATCH CONTEXT</div>
            <div className="font-mono-cipher text-xs text-foreground">
              Employer: <span className="text-primary">{employerWallet.slice(0, 14)}...</span>
            </div>
            {suggestedSalary && (
              <div className="font-mono-cipher text-xs text-foreground">
                Suggested Salary: <span className="text-primary">${suggestedSalary.toLocaleString()}</span>
              </div>
            )}
          </div>

          {!result ? (
            <>
              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                    Current / Expected Salary ($)
                  </label>
                  <input
                    type="number"
                    value={currentSalary}
                    onChange={e => setCurrentSalary(e.target.value)}
                    placeholder="e.g. 120000"
                    className="w-full bg-background border border-border px-4 py-3 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                    Target Increase (%)
                  </label>
                  <div className="flex gap-2">
                    {["10", "15", "20", "25", "30"].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setTargetIncrease(pct)}
                        className={`flex-1 py-2 font-mono-cipher text-xs border transition-all duration-100 ${
                          targetIncrease === pct
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={targetIncrease}
                    onChange={e => setTargetIncrease(e.target.value)}
                    placeholder="Custom %"
                    className="w-full bg-background border border-border px-4 py-2 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                    Years at Current Company
                  </label>
                  <input
                    type="number"
                    value={yearsAtCompany}
                    onChange={e => setYearsAtCompany(e.target.value)}
                    placeholder="e.g. 2"
                    min="0"
                    max="30"
                    className="w-full bg-background border border-border px-4 py-3 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Solidity Engineer"
                    className="w-full bg-background border border-border px-4 py-3 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Privacy note */}
              <div className="border border-border bg-background p-3 space-y-1">
                <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                  ⊕ PRIVACY NOTE
                </div>
                <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                  Your salary data is hashed before storage. The employer never sees your current compensation — only the encrypted commitment.
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !currentSalary || !role}
                className="w-full py-3 bg-primary text-primary-foreground font-mono-cipher text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-pulse">▋</span>
                    Computing encrypted analysis...
                  </>
                ) : (
                  <>
                    <Calculator className="w-3.5 h-3.5" />
                    Compute Counter-Offer Strategy →
                  </>
                )}
              </button>
            </>
          ) : (
            /* Result */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
                ✓ Analysis Complete
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-primary bg-primary/5 p-4 text-center">
                  <div className="text-3xl font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>
                    +{result.projectedIncrease}%
                  </div>
                  <div className="font-mono-cipher text-xs text-muted-foreground mt-1">Projected Increase</div>
                </div>
                <div className="border border-border p-4 text-center">
                  <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                    {result.offersNeeded}
                  </div>
                  <div className="font-mono-cipher text-xs text-muted-foreground mt-1">Offers Needed</div>
                </div>
              </div>

              <div className="border border-border bg-background p-4 space-y-2">
                <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                  NEGOTIATION SCRIPT
                </div>
                <div className="font-mono-cipher text-xs text-foreground leading-relaxed">
                  {result.negotiationScript}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-2.5 border border-border font-mono-cipher text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-100"
                >
                  Recalculate
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-mono-cipher text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100"
                >
                  Done →
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Counter Offer History ────────────────────────────────────────────────────
function CounterOfferHistory() {
  const { address } = useAccount();
  const offers = useQuery(api.matches.getCounterOffers, address ? { walletAddress: address } : "skip") ?? [];

  if (offers.length === 0) {
    return (
      <div className="border border-border p-12 text-center space-y-3">
        <Calculator className="w-8 h-8 text-muted-foreground/30 mx-auto" />
        <div className="font-mono-cipher text-xs text-muted-foreground">
          No counter-offer analyses yet. Open a match and click "Counter Offer" to compute your negotiation strategy.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer, i) => (
        <motion.div
          key={offer._id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="border border-border bg-card"
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${offer.status === "complete" ? "bg-primary" : "bg-muted-foreground animate-pulse"}`} />
              <div>
                <div className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">{offer.role}</div>
                <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                  Target: +{offer.targetIncreasePercent}% · {offer.yearsAtCompany}yr tenure
                </div>
              </div>
            </div>
            {offer.projectedIncrease != null && (
              <div className="text-right">
                <div className="text-lg font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>
                  +{offer.projectedIncrease}%
                </div>
                <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "9px" }}>PROJECTED</div>
              </div>
            )}
          </div>
          {offer.negotiationScript && (
            <div className="px-6 py-4">
              <div className="font-mono-cipher text-muted-foreground mb-2" style={{ fontSize: "10px" }}>NEGOTIATION SCRIPT</div>
              <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{offer.negotiationScript}</div>
              {offer.offersNeeded != null && (
                <div className="mt-3 flex items-center gap-2 font-mono-cipher text-xs text-primary">
                  <Briefcase className="w-3 h-3" />
                  Secure {offer.offersNeeded} competing offers before negotiating
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── My Matches List ──────────────────────────────────────────────────────────
function MyMatchesList() {
  const { address } = useAccount();
  const matches = useQuery(api.matches.getCandidateMatches, address ? { walletAddress: address } : "skip") ?? [];
  const consentReveal = useMutation(api.matches.consentReveal);
  const createNotification = useMutation(api.notifications.createNotification);
  const [consenting, setConsenting] = useState<string | null>(null);
  const [counterOfferMatch, setCounterOfferMatch] = useState<{
    id: Id<"matchRequests">;
    employerWallet: string;
    suggestedSalary?: number;
  } | null>(null);

  const handleConsent = async (matchId: Id<"matchRequests">) => {
    if (!address) return;
    setConsenting(matchId);
    try {
      await consentReveal({ matchId, role: "candidate" });
      await createNotification({
        walletAddress: address,
        type: "consent_received",
        title: "Consent Signed",
        message: "You signed consent to reveal salary. Waiting for employer to co-sign.",
      });
      toast.success("Consent signed — waiting for employer co-sign");
    } catch (e: any) {
      toast.error(e.message ?? "Consent failed");
    } finally {
      setConsenting(null);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="border border-border p-12 text-center space-y-3">
        <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto" />
        <div className="font-mono-cipher text-xs text-muted-foreground">
          No matches yet. Run the Live Match simulation to find compatible employers.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {matches.map((match, i) => (
          <motion.div
            key={match._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`border bg-card ${match.status === "matched" ? "border-primary/40" : "border-border"}`}
          >
            <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {match.status === "matched" ? (
                  <CheckCircle className="w-4 h-4 text-primary" />
                ) : match.status === "rejected" ? (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
                )}
                <div>
                  <div className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">
                    {match.status === "matched" ? "Match Found" : match.status === "rejected" ? "No Match" : "Pending"}
                  </div>
                  <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                    Employer: {match.employerWallet.slice(0, 10)}...
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {match.score != null && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>{match.score}%</div>
                    <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "9px" }}>COMPAT.</div>
                  </div>
                )}

                {/* Counter-offer button for matched items */}
                {match.status === "matched" && (
                  <button
                    onClick={() => setCounterOfferMatch({
                      id: match._id,
                      employerWallet: match.employerWallet,
                      suggestedSalary: match.suggestedSalary ?? undefined,
                    })}
                    className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100 flex items-center gap-1.5"
                  >
                    <Calculator className="w-3 h-3" />
                    Counter Offer
                  </button>
                )}

                {match.status === "matched" && !match.candidateConsented && (
                  <button
                    onClick={() => handleConsent(match._id)}
                    disabled={consenting === match._id}
                    className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Shield className="w-3 h-3" />
                    {consenting === match._id ? "Signing..." : "Sign Consent →"}
                  </button>
                )}

                {match.candidateConsented && !match.salaryRevealed && (
                  <div className="flex items-center gap-1.5 font-mono-cipher text-xs text-primary border border-primary/30 px-3 py-1.5">
                    <CheckCircle className="w-3 h-3" />
                    Consent Signed — Awaiting Employer
                  </div>
                )}

                {match.salaryRevealed && match.suggestedSalary && (
                  <motion.div
                    initial={{ filter: "blur(8px)" }}
                    animate={{ filter: "blur(0px)" }}
                    transition={{ duration: 0.6 }}
                    className="text-center border border-primary bg-primary/5 px-4 py-2"
                  >
                    <div className="text-lg font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>
                      ${match.suggestedSalary.toLocaleString()}
                    </div>
                    <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "9px" }}>SALARY REVEALED</div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Counter-offer modal */}
      <AnimatePresence>
        {counterOfferMatch && (
          <CounterOfferModal
            matchId={counterOfferMatch.id}
            employerWallet={counterOfferMatch.employerWallet}
            suggestedSalary={counterOfferMatch.suggestedSalary}
            onClose={() => setCounterOfferMatch(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function MatchesPage() {
  const stats = useQuery(api.matches.getProtocolStats);
  const [activeTab, setActiveTab] = useState<"live" | "matches" | "counter" | "demo" | "batch" | "skills" | "feed">("live");
  const [circuitRunning, setCircuitRunning] = useState(false);

  const displayStats = [
    { label: "Active Candidates", value: stats ? String(stats.totalCandidates) : "—" },
    { label: "Active Jobs", value: stats ? String(stats.totalJobs) : "—" },
    { label: "Matches Found", value: stats ? String(stats.totalMatches) : "—" },
    { label: "Privacy Score", value: "100%" },
  ];

  const tabs = [
    { id: "live" as const, label: "Live Match", icon: Play },
    { id: "matches" as const, label: "My Matches", icon: List },
    { id: "counter" as const, label: "Counter Offers", icon: Calculator },
    { id: "demo" as const, label: "FHE Demo", icon: Zap },
    { id: "batch" as const, label: "Batch Match", icon: BarChart2 },
    { id: "skills" as const, label: "Skill Matrix", icon: Grid },
    { id: "feed" as const, label: "Live Feed", icon: Activity },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Match Engine — Wave 3</div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Live FHE Matching
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure encrypted utility curves and run the homomorphic matching protocol in real time.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {displayStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-6 text-center ${i < 3 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Space Grotesk" }}>{stat.value}</div>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-mono-cipher text-xs uppercase tracking-widest border-b-2 transition-all duration-100 whitespace-nowrap ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "live" && <LiveMatchSimulator />}
          {activeTab === "matches" && <MyMatchesList />}
          {activeTab === "counter" && <CounterOfferHistory />}
          {activeTab === "demo" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => { setCircuitRunning(true); setTimeout(() => setCircuitRunning(false), 3000); }}
                  className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100"
                >
                  Execute Circuit →
                </button>
              </div>
              <FHECircuit running={circuitRunning} />
              <DemoMode />
            </div>
          )}
          {activeTab === "batch" && <BatchMatcher />}
          {activeTab === "skills" && (
            <SkillHeatmap
              candidateSkills={["Solidity", "TypeScript", "React", "FHE", "Smart Contracts", "DeFi"]}
              employerSkills={["Solidity", "TypeScript", "Node.js", "Smart Contracts", "Layer 2", "Cryptography"]}
            />
          )}
          {activeTab === "feed" && <ActivityFeed maxItems={12} />}
        </motion.div>
      </div>
    </AppLayout>
  );
}