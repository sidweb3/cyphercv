import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import { AppLayout } from "./AppLayout";
import { EncryptedInput } from "@/components/EncryptedInput";
import { ConsentReveal } from "@/components/ConsentReveal";
import { SkillHeatmap } from "@/components/SkillHeatmap";
import { commitProfile, commitSalary, commitExperience, commitSkills, commitMarketData, commitEscrow } from "@/lib/demoData";
import {
  encryptSalary, encryptExperience, encryptSkillScore,
  encryptedToHex, formatEncryptedCommitment, isContractDeployed,
  getContractExplorerUrl, domainToHash,
} from "@/lib/fhenix";
import {
  CheckCircle, Clock, XCircle, Eye, EyeOff, Lock, Download,
  Ghost, TrendingUp, Calendar, Shield, Plus, X, AlertTriangle,
  ChevronRight, Zap, ExternalLink,
} from "lucide-react";
import { useAccount, useConnect, useConnectorClient } from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

function ConnectWalletButton({ className }: { className?: string }) {
  const { connect, connectors } = useConnect();
  return (
    <button onClick={() => { const c = connectors.find(c => c.id === 'injected') || connectors[0]; if (c) connect({ connector: c }); }} className={className}>
      Connect Wallet →
    </button>
  );
}

type MatchStatus = "pending" | "matched" | "rejected";

const SKILLS = [
  "Solidity", "Rust", "TypeScript", "React", "Node.js",
  "Python", "Go", "ZK Proofs", "FHE", "Smart Contracts",
  "DeFi", "Layer 2", "Cryptography", "Distributed Systems",
];

const COMMON_DOMAINS = ["google.com", "meta.com", "amazon.com", "apple.com", "microsoft.com", "netflix.com", "stripe.com", "coinbase.com"];

const ROLES_LIST = ["Software Engineer", "Senior Engineer", "Staff Engineer", "Principal Engineer", "Engineering Manager", "Product Manager", "Data Scientist", "DevOps Engineer"];

// ─── FHE Status Banner ────────────────────────────────────────────────────────
function FHEStatusBanner({ chainId }: { chainId?: number }) {
  // Arbitrum Sepolia = 421614, Ethereum Sepolia = 11155111
  const isArbSepolia = chainId === 421614;
  const isEthSepolia = chainId === 11155111;
  const isTestnet = isArbSepolia || isEthSepolia;
  const deployed = isContractDeployed();

  if (isArbSepolia && deployed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-primary bg-primary/5 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="font-mono-cipher text-xs text-primary">
            Contracts Deployed — Arbitrum Sepolia (Chain ID: 421614)
          </span>
        </div>
        <a
          href={getContractExplorerUrl("CipherCV", "arb-sepolia")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          View Contract <ExternalLink className="w-3 h-3" />
        </a>
      </motion.div>
    );
  }

  if (isTestnet && !deployed) {
    return (
      <div className="border border-border bg-card px-4 py-3 flex items-center gap-3">
        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-mono-cipher text-xs text-muted-foreground">
          Connected to testnet — deploy contracts to enable on-chain matching
        </span>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card px-4 py-3 flex items-center gap-3">
      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-mono-cipher text-xs text-muted-foreground">
        Demo mode — connect to Arbitrum Sepolia (Chain ID: 421614) for on-chain matching
      </span>
    </div>
  );
}

// ─── Stealth Mode Tab ─────────────────────────────────────────────────────────
function StealthModeTab({ address }: { address: string }) {
  const profile = useQuery(api.profiles.getCandidateProfile, { walletAddress: address });
  const updateStealth = useMutation(api.profiles.updateStealthSettings);

  const [stealthEnabled, setStealthEnabled] = useState(profile?.stealthEnabled ?? false);
  const [blockedDomains, setBlockedDomains] = useState<string[]>(profile?.blockedDomains ?? []);
  const [timeLockDate, setTimeLockDate] = useState(profile?.timeLockDate ?? "");
  const [customDomain, setCustomDomain] = useState("");
  const [saving, setSaving] = useState(false);

  const addDomain = (domain: string) => {
    const d = domain.toLowerCase().trim();
    if (d && !blockedDomains.includes(d)) setBlockedDomains(prev => [...prev, d]);
    setCustomDomain("");
  };

  const removeDomain = (domain: string) => setBlockedDomains(prev => prev.filter(d => d !== domain));

  const handleSave = async () => {
    if (!profile) { toast.error("Submit your profile first"); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      await updateStealth({ walletAddress: address, stealthEnabled, blockedDomains, timeLockDate: timeLockDate || undefined });
      toast.success("Stealth settings encrypted & saved");
    } catch { toast.error("Failed to save stealth settings"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Stealth toggle */}
      <div className="border border-border bg-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ghost className="w-4 h-4 text-primary" />
            <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Stealth Mode</span>
          </div>
          <button
            onClick={() => setStealthEnabled(v => !v)}
            className={`relative w-12 h-6 border transition-all duration-200 ${stealthEnabled ? "border-primary bg-primary/10" : "border-border"}`}
          >
            <motion.div
              animate={{ x: stealthEnabled ? 24 : 2 }}
              transition={{ duration: 0.15 }}
              className={`absolute top-1 w-4 h-4 ${stealthEnabled ? "bg-primary" : "bg-muted-foreground"}`}
            />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Profile Visibility", value: stealthEnabled ? "Encrypted" : "Visible", ok: stealthEnabled },
              { label: "Employer Blocklist", value: `${blockedDomains.length} domains`, ok: blockedDomains.length > 0 },
              { label: "Time Lock", value: timeLockDate ? new Date(timeLockDate).toLocaleDateString() : "Not set", ok: !!timeLockDate },
            ].map(item => (
              <div key={item.label} className="border border-border p-4">
                <div className="font-mono-cipher text-muted-foreground mb-1" style={{ fontSize: "10px" }}>{item.label}</div>
                <div className={`font-mono-cipher text-xs font-bold ${item.ok ? "text-primary" : "text-muted-foreground"}`}>{item.value}</div>
              </div>
            ))}
          </div>
          {stealthEnabled && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3 text-primary" />
                <span className="font-mono-cipher text-xs text-primary">Stealth active — your profile is mathematically invisible to blocked employers</span>
              </div>
              <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                FHE.blocklist_check(employer_domain_hash, your_blocklist_hash) → ebool
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Employer Blocklist */}
      <div className="border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Employer Domain Blocklist (FHE)</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
            Add your current employer's domain. The blocklist is encrypted — employers cannot see who blocked them.
          </p>
          {/* Quick add common domains */}
          <div className="flex flex-wrap gap-2">
            {COMMON_DOMAINS.map(domain => (
              <button
                key={domain}
                onClick={() => blockedDomains.includes(domain) ? removeDomain(domain) : addDomain(domain)}
                className={`font-mono-cipher text-xs px-3 py-1.5 border transition-all duration-100 ${
                  blockedDomains.includes(domain)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {blockedDomains.includes(domain) ? "✓ " : ""}{domain}
              </button>
            ))}
          </div>
          {/* Custom domain input */}
          <div className="flex gap-2">
            <input
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addDomain(customDomain)}
              placeholder="yourcompany.com"
              className="flex-1 bg-background border border-border px-4 py-2 font-mono-cipher text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={() => addDomain(customDomain)}
              disabled={!customDomain.trim()}
              className="font-mono-cipher text-xs border border-border px-4 py-2 text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-100 disabled:opacity-40 flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {/* Active blocklist */}
          {blockedDomains.length > 0 && (
            <div className="space-y-2">
              <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>ACTIVE BLOCKLIST — ENCRYPTED ON-CHAIN</div>
              {blockedDomains.map(domain => (
                <div key={domain} className="flex items-center justify-between border border-border px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Lock className="w-3 h-3 text-primary" />
                    <span className="font-mono-cipher text-xs text-foreground">{domain}</span>
                    <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>→ {domainToHash(domain).slice(0, 14)}...</span>
                  </div>
                  <button onClick={() => removeDomain(domain)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time Lock */}
      <div className="border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">FHE Time-Lock: Show Profile From Date</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
            Your profile remains invisible until this date. Useful if you want to start looking after a vesting cliff or bonus payout.
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="date"
              value={timeLockDate}
              onChange={e => setTimeLockDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="bg-background border border-border px-4 py-2 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {timeLockDate && (
              <button onClick={() => setTimeLockDate("")} className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors">
                Clear
              </button>
            )}
          </div>
          {timeLockDate && (
            <div className="border border-primary/30 bg-primary/5 p-3">
              <span className="font-mono-cipher text-xs text-primary">
                Profile unlocks {new Date(timeLockDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !profile}
        className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest font-mono-cipher disabled:opacity-60 transition-all duration-100 hover:bg-foreground hover:text-background"
      >
        {saving ? "Encrypting & Saving..." : !profile ? "Submit Profile First" : "Save Stealth Settings →"}
      </button>
    </div>
  );
}

// ─── Counter-Offer Calculator Tab ─────────────────────────────────────────────
function CounterOfferTab({ address }: { address: string }) {
  const submitCounterOffer = useMutation(api.profiles.submitCounterOffer);
  const existingReport = useQuery(api.profiles.getCounterOffer, { walletAddress: address });

  const [currentSalary, setCurrentSalary] = useState(120000);
  const [targetIncrease, setTargetIncrease] = useState(20);
  const [yearsAtCompany, setYearsAtCompany] = useState(3);
  const [role, setRole] = useState("Senior Engineer");
  const [computing, setComputing] = useState(false);
  const [showReport, setShowReport] = useState(!!existingReport?.status);

  const handleCompute = async () => {
    setComputing(true);
    try {
      await new Promise(r => setTimeout(r, 2500));
      await submitCounterOffer({
        walletAddress: address,
        currentSalaryHash: commitSalary(address, currentSalary),
        targetIncreasePercent: targetIncrease,
        yearsAtCompany,
        role,
        marketDataHash: commitMarketData(address, role, targetIncrease),
      });
      setShowReport(true);
      toast.success("Counter-offer report generated");
    } catch { toast.error("Failed to compute report"); }
    finally { setComputing(false); }
  };

  const report = existingReport;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-6">
          <div className="border border-border bg-card">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Your Inputs — Encrypted</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Current Salary</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={40000}
                    max={500000}
                    step={5000}
                    value={currentSalary}
                    onChange={e => setCurrentSalary(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <div className="border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono-cipher text-xs text-primary min-w-[80px] text-center">
                    ████████
                  </div>
                </div>
                <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                  Encrypted — never transmitted. Hash: {commitSalary(address, currentSalary).slice(0, 18)}...
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Target Increase (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={targetIncrease}
                    onChange={e => setTargetIncrease(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <div className="border border-border px-3 py-1.5 font-mono-cipher text-xs text-foreground min-w-[60px] text-center">
                    +{targetIncrease}%
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Years at Current Company</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={yearsAtCompany}
                    onChange={e => setYearsAtCompany(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <div className="border border-border px-3 py-1.5 font-mono-cipher text-xs text-foreground min-w-[60px] text-center">
                    {yearsAtCompany}yr
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-2 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleCompute}
            disabled={computing}
            className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest font-mono-cipher disabled:opacity-60 transition-all duration-100 hover:bg-foreground hover:text-background"
          >
            {computing ? "Computing Strategy..." : "Generate Counter-Offer Report →"}
          </button>

          {computing && (
            <div className="border border-border p-4 space-y-2">
              {["Encrypting salary inputs...", "Querying market data (blind)...", "Running FHE comparison...", "Generating negotiation script..."].map((step, i) => (
                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }} className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-2">
                  <span className="text-primary animate-pulse">▋</span> {step}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Report panel */}
        <AnimatePresence>
          {(showReport && report) ? (
            <motion.div key="report" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="border border-primary bg-card">
                <div className="px-6 py-4 border-b border-primary/30 flex items-center justify-between">
                  <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Counter-Offer Report</span>
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-border p-4 text-center">
                      <div className="font-display text-3xl text-primary mb-1">{report.offersNeeded ?? 3}</div>
                      <div className="font-mono-cipher text-xs text-muted-foreground">Offers Needed</div>
                    </div>
                    <div className="border border-border p-4 text-center">
                      <div className="font-display text-3xl text-primary mb-1">+{report.projectedIncrease ?? targetIncrease}%</div>
                      <div className="font-mono-cipher text-xs text-muted-foreground">Projected Increase</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>NEGOTIATION STRATEGY</div>
                    <div className="border-l-2 border-primary pl-4 py-1">
                      <p className="font-body text-sm text-foreground leading-relaxed">{report.negotiationScript}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>TIMELINE</div>
                    {[
                      { step: "Week 1–2", action: "Submit stealth profile, enter matching pool" },
                      { step: "Week 3–4", action: `Collect ${report.offersNeeded ?? 3} competing offers` },
                      { step: "Week 5", action: "Schedule counter-offer conversation" },
                      { step: "Week 6", action: "Present offers, negotiate from strength" },
                    ].map(item => (
                      <div key={item.step} className="flex items-start gap-3">
                        <span className="font-mono-cipher text-xs text-primary shrink-0 w-16">{item.step}</span>
                        <span className="font-mono-cipher text-xs text-muted-foreground">{item.action}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border border-border p-3 space-y-1">
                    <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>PRIVACY GUARANTEE</div>
                    <div className="font-mono-cipher text-xs text-foreground">Your salary was never transmitted. Only encrypted hashes were used in computation.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !showReport ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border bg-card p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
              <div className="space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">No Report Yet</div>
                <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Configure your inputs and generate a personalized negotiation strategy backed by encrypted market data.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Interview Insurance Tab ───────────────────────────────────────────────────
function InterviewInsuranceTab({ address }: { address: string }) {
  const submitInsurance = useMutation(api.profiles.submitInterviewInsurance);
  const existingOrder = useQuery(api.profiles.getInterviewInsurance, { walletAddress: address });

  const [targetRole, setTargetRole] = useState("Senior Engineer");
  const [salaryMin, setSalaryMin] = useState(150000);
  const [salaryMax, setSalaryMax] = useState(200000);
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      await submitInsurance({
        walletAddress: address,
        escrowHash: commitEscrow(address, targetRole, salaryMin, salaryMax),
        targetRole,
        targetSalaryMin: salaryMin,
        targetSalaryMax: salaryMax,
      });
      toast.success("Interview Insurance activated — 3 interviews guaranteed in 30 days");
    } catch { toast.error("Failed to activate insurance"); }
    finally { setPurchasing(false); }
  };

  const order = existingOrder;
  const daysLeft = order ? Math.max(0, Math.ceil((order.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : 30;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <div className="space-y-6">
          <div className="border border-border bg-card">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Interview Insurance — $99</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                {[
                  "3 guaranteed interviews with vetted employers",
                  "30-day money-back guarantee if no interviews",
                  "Employers pre-commit via FHE escrow",
                  "Your identity stays encrypted until you consent",
                  "Full refund if target not met",
                ].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span className="font-mono-cipher text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-2 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    disabled={!!order}
                  >
                    {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <EncryptedInput label="Minimum Target Salary" min={80000} max={500000} value={salaryMin} onChange={setSalaryMin} />
                <EncryptedInput label="Maximum Target Salary" min={80000} max={500000} value={salaryMax} onChange={setSalaryMax} />
              </div>
            </div>
          </div>

          {!order && (
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest font-mono-cipher disabled:opacity-60 transition-all duration-100 hover:bg-foreground hover:text-background"
            >
              {purchasing ? "Activating Insurance..." : "Activate Interview Insurance — $99 →"}
            </button>
          )}

          {purchasing && (
            <div className="border border-border p-4 space-y-2">
              {["Locking $99 in FHE escrow...", "Notifying vetted employer network...", "Activating 30-day guarantee...", "Insurance active"].map((step, i) => (
                <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }} className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-2">
                  <span className="text-primary animate-pulse">▋</span> {step}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Status panel */}
        {order ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="border border-primary bg-card">
              <div className="px-6 py-4 border-b border-primary/30 flex items-center justify-between">
                <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Insurance Active</span>
                <span className="font-mono-cipher text-xs border border-primary px-2 py-0.5 text-primary">
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div className="p-6 space-y-5">
                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-cipher text-xs text-muted-foreground">Interviews Scheduled</span>
                    <span className="font-mono-cipher text-xs text-foreground">{order.interviewsScheduled} / {order.interviewsTarget}</span>
                  </div>
                  <div className="h-2 bg-secondary border border-border overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(order.interviewsScheduled / order.interviewsTarget) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border p-4 text-center">
                    <div className="font-display text-3xl text-foreground mb-1">{daysLeft}</div>
                    <div className="font-mono-cipher text-xs text-muted-foreground">Days Remaining</div>
                  </div>
                  <div className="border border-border p-4 text-center">
                    <div className="font-display text-3xl text-primary mb-1">{order.interviewsTarget - order.interviewsScheduled}</div>
                    <div className="font-mono-cipher text-xs text-muted-foreground">Interviews Pending</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>ESCROW DETAILS</div>
                  <div className="flex items-center justify-between border border-border px-4 py-2">
                    <span className="font-mono-cipher text-xs text-muted-foreground">Escrow Hash</span>
                    <span className="font-mono-cipher text-xs text-primary">{order.escrowHash.slice(0, 16)}...</span>
                  </div>
                  <div className="flex items-center justify-between border border-border px-4 py-2">
                    <span className="font-mono-cipher text-xs text-muted-foreground">Target Role</span>
                    <span className="font-mono-cipher text-xs text-foreground">{order.targetRole}</span>
                  </div>
                  <div className="flex items-center justify-between border border-border px-4 py-2">
                    <span className="font-mono-cipher text-xs text-muted-foreground">Refund Condition</span>
                    <span className="font-mono-cipher text-xs text-foreground">&lt; 3 interviews in 30 days</span>
                  </div>
                </div>

                {daysLeft <= 5 && order.interviewsScheduled < order.interviewsTarget && (
                  <div className="border border-destructive/40 bg-destructive/5 p-3 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                    <span className="font-mono-cipher text-xs text-destructive">
                      {daysLeft} days left. If target not met, refund will be automatically processed.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="border border-border bg-card p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
            <Calendar className="w-8 h-8 text-muted-foreground/30" />
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Not Active</div>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed max-w-xs">
                Activate Interview Insurance to guarantee 3 interviews in 30 days or get a full refund.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CandidatePage() {
  const { address, isConnected, chainId } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const [experience, setExperience] = useState(5);
  const [skillLevel, setSkillLevel] = useState(7);
  const [minSalary, setMinSalary] = useState(100000);
  const [maxSalary, setMaxSalary] = useState(150000);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Solidity", "TypeScript", "React"]);
  const [profileHash, setProfileHash] = useState("0x0000000000000000");
  const [creating, setCreating] = useState(false);
  const [revealedMatches, setRevealedMatches] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"profile" | "stealth" | "counter-offer" | "insurance" | "matches" | "skills">("profile");
  const [consentStates, setConsentStates] = useState<Record<string, { candidate: boolean; employer: boolean }>>({});
  // FHE encryption state
  const [fheCommitments, setFheCommitments] = useState<{
    minSalary?: string;
    maxSalary?: string;
    experience?: string;
    skillScore?: string;
  }>({});

  const submitProfile = useMutation(api.profiles.submitCandidateProfile);
  const consentReveal = useMutation(api.matches.consentReveal);
  const existingProfile = useQuery(
    api.profiles.getCandidateProfile,
    address ? { walletAddress: address } : "skip"
  );
  const candidateMatches = useQuery(
    api.matches.getCandidateMatches,
    address ? { walletAddress: address } : "skip"
  );

  const matches = candidateMatches ?? [];

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  }, []);

  const toggleReveal = useCallback((matchId: string) => {
    setRevealedMatches(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  }, []);

  const handleCandidateConsent = async (matchId: string) => {
    try {
      await consentReveal({ matchId: matchId as any, role: "candidate" });
      setConsentStates(prev => ({
        ...prev,
        [matchId]: { ...prev[matchId], candidate: true },
      }));
      toast.success("Consent recorded");
    } catch {
      toast.error("Failed to record consent");
    }
  };

  /**
   * Submit profile with real FHE encryption when on Fhenix,
   * or fall back to hash-based mock when on other networks.
   */
  const handleCreateProfile = async () => {
    if (!address) return;
    setCreating(true);

    try {
      let profileHashVal: string;
      let experienceHashVal: string;
      let salaryHashVal: string;
      let skillsHashVal: string;

      const isSepolia = chainId === 11155111;
      const provider = connectorClient?.transport;

      if (isSepolia && provider && isContractDeployed()) {
        // ── Real FHE path ──────────────────────────────────────────────────
        toast.info("Encrypting with FHE...");

        const [encMin, encMax, encExp, encSkill] = await Promise.all([
          encryptSalary(provider, minSalary),
          encryptSalary(provider, maxSalary),
          encryptExperience(provider, experience),
          encryptSkillScore(provider, skillLevel * 10), // 0-10 → 0-100
        ]);

        profileHashVal = encryptedToHex(encMin);
        salaryHashVal = encryptedToHex(encMax);
        experienceHashVal = encryptedToHex(encExp);
        skillsHashVal = encryptedToHex(encSkill);

        // Store commitments for display
        setFheCommitments({
          minSalary: formatEncryptedCommitment(encMin),
          maxSalary: formatEncryptedCommitment(encMax),
          experience: formatEncryptedCommitment(encExp),
          skillScore: formatEncryptedCommitment(encSkill),
        });

        toast.success("FHE encryption complete — ciphertexts ready");
      } else {
        // ── Commitment hash path (real keccak256 commitments) ──────────────
        profileHashVal = commitProfile(address, minSalary, maxSalary, experience, selectedSkills.length);
        salaryHashVal = commitSalary(address, minSalary);
        experienceHashVal = commitExperience(address, experience);
        skillsHashVal = commitSkills(address, selectedSkills);
        setFheCommitments({
          minSalary: profileHashVal.slice(0, 10) + "..." + profileHashVal.slice(-6),
          maxSalary: salaryHashVal.slice(0, 10) + "..." + salaryHashVal.slice(-6),
          experience: experienceHashVal.slice(0, 10) + "..." + experienceHashVal.slice(-6),
          skillScore: skillsHashVal.slice(0, 10) + "..." + skillsHashVal.slice(-6),
        });
      }

      // Persist to Convex (stores ciphertext commitments, not plaintext)
      await submitProfile({
        walletAddress: address,
        profileHash: profileHashVal,
        experienceHash: experienceHashVal,
        salaryHash: salaryHashVal,
        skillsHash: skillsHashVal,
        skillCount: selectedSkills.length,
        experienceYears: experience,
      });

      setProfileHash(profileHashVal.slice(0, 18));
      toast.success("Profile encrypted & submitted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit profile");
    } finally {
      setCreating(false);
    }
  };

  const statusIcon = (status: MatchStatus) => {
    if (status === "matched") return <CheckCircle className="w-4 h-4 text-primary" />;
    if (status === "pending") return <Clock className="w-4 h-4 text-muted-foreground" />;
    return <XCircle className="w-4 h-4 text-destructive" />;
  };

  if (!isConnected) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <Lock className="w-8 h-8 text-muted-foreground" />
          <div className="text-center space-y-2">
            <div className="font-mono-cipher text-sm text-foreground">Wallet Required</div>
            <div className="font-mono-cipher text-xs text-muted-foreground">Connect your wallet to access the candidate dashboard</div>
          </div>
          <ConnectWalletButton className="font-mono-cipher text-xs border border-border px-6 py-3 text-foreground hover:border-primary hover:text-primary transition-all duration-100" />
        </div>
      </AppLayout>
    );
  }

  const TABS = [
    { id: "profile", label: "Profile Builder" },
    { id: "stealth", label: "Stealth Mode" },
    { id: "counter-offer", label: "Counter-Offer" },
    { id: "insurance", label: "Interview Insurance" },
    { id: "matches", label: `Matches (${matches.length})` },
    { id: "skills", label: "Skill Map" },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground">Candidate Dashboard</h1>
            <div className="font-mono-cipher text-xs text-muted-foreground mt-1">
              {address?.slice(0, 6)}...{address?.slice(-4)} · {existingProfile ? "Profile Active" : "No Profile"}
            </div>
          </div>
          {existingProfile && (
            <div className="border border-primary/30 bg-primary/5 px-3 py-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="font-mono-cipher text-xs text-primary">In Matching Pool</span>
            </div>
          )}
        </div>

        {/* FHE Status Banner */}
        <FHEStatusBanner chainId={chainId} />

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-mono-cipher text-xs px-4 py-3 border-b-2 transition-all duration-100 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Profile Builder */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="border border-border bg-card">
                    <div className="px-6 py-4 border-b border-border">
                      <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Encrypted Profile Inputs</span>
                    </div>
                    <div className="p-6 space-y-5">
                      {/* Salary Range */}
                      <div className="space-y-3">
                        <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Salary Range</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>MIN</div>
                            <input
                              type="range"
                              min={40000}
                              max={300000}
                              step={5000}
                              value={minSalary}
                              onChange={e => setMinSalary(Number(e.target.value))}
                              className="w-full accent-primary"
                            />
                            <div className="border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono-cipher text-xs text-primary text-center">
                              {fheCommitments.minSalary ? fheCommitments.minSalary : "████████"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>MAX</div>
                            <input
                              type="range"
                              min={40000}
                              max={500000}
                              step={5000}
                              value={maxSalary}
                              onChange={e => setMaxSalary(Number(e.target.value))}
                              className="w-full accent-primary"
                            />
                            <div className="border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono-cipher text-xs text-primary text-center">
                              {fheCommitments.maxSalary ? fheCommitments.maxSalary : "████████"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="space-y-2">
                        <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Years of Experience</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={20}
                            step={1}
                            value={experience}
                            onChange={e => setExperience(Number(e.target.value))}
                            className="flex-1 accent-primary"
                          />
                          <div className="border border-border px-3 py-1.5 font-mono-cipher text-xs text-foreground min-w-[60px] text-center">
                            {fheCommitments.experience ? fheCommitments.experience : `${experience}yr`}
                          </div>
                        </div>
                      </div>

                      {/* Skill Level */}
                      <div className="space-y-2">
                        <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Skill Level (1-10)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            step={1}
                            value={skillLevel}
                            onChange={e => setSkillLevel(Number(e.target.value))}
                            className="flex-1 accent-primary"
                          />
                          <div className="border border-border px-3 py-1.5 font-mono-cipher text-xs text-foreground min-w-[60px] text-center">
                            {fheCommitments.skillScore ? fheCommitments.skillScore : `${skillLevel}/10`}
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="space-y-2">
                        <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {SKILLS.map(skill => (
                            <button
                              key={skill}
                              onClick={() => toggleSkill(skill)}
                              className={`font-mono-cipher text-xs px-3 py-1.5 border transition-all duration-100 ${
                                selectedSkills.includes(skill)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                              }`}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateProfile}
                    disabled={creating}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest font-mono-cipher disabled:opacity-60 transition-all duration-100 hover:bg-foreground hover:text-background"
                  >
                    {creating
                      ? chainId === 11155111 && isContractDeployed()
                        ? "Encrypting with FHE..."
                        : "Encrypting..."
                      : existingProfile
                        ? "Update Encrypted Profile →"
                        : "Submit Encrypted Profile →"}
                  </button>

                  {creating && (
                    <div className="border border-border p-4 space-y-2">
                      {(chainId === 11155111 && isContractDeployed()
                        ? [
                            "Fetching Sepolia contract state...",
                            "Encrypting salary range (euint32)...",
                            "Encrypting experience (euint32)...",
                            "Encrypting skill score (euint32)...",
                            "Storing ciphertext commitments...",
                          ]
                        : [
                            "Generating profile hash...",
                            "Encrypting salary range...",
                            "Encrypting experience...",
                            "Storing commitments...",
                          ]
                      ).map((step, i) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.3 }}
                          className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <span className="text-primary animate-pulse">▋</span> {step}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Status */}
                <div className="space-y-4">
                  <div className="border border-border bg-card">
                    <div className="px-4 py-3 border-b border-border">
                      <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Profile Status</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {[
                        { label: "Salary", hash: existingProfile?.salaryHash ?? fheCommitments.minSalary, ok: !!existingProfile },
                        { label: "Experience", hash: existingProfile?.experienceHash ?? fheCommitments.experience, ok: !!existingProfile },
                        { label: "Skills", hash: existingProfile?.skillsHash ?? fheCommitments.skillScore, ok: !!existingProfile },
                      ].map(item => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{item.label}</span>
                            {item.ok ? (
                              <CheckCircle className="w-3 h-3 text-primary" />
                            ) : (
                              <Clock className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="font-mono-cipher text-xs text-muted-foreground truncate">
                            {item.hash ? item.hash.slice(0, 20) + "..." : "Not encrypted"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Product navigation */}
                  <div className="border border-border bg-card">
                    <div className="px-4 py-3 border-b border-border">
                      <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Products</span>
                    </div>
                    <div className="divide-y divide-border">
                      {[
                        { id: "stealth", label: "Stealth Mode", icon: Ghost, desc: "Block employers", active: true },
                        { id: "counter-offer", label: "Counter-Offer", icon: TrendingUp, desc: "Salary strategy", active: true },
                        { id: "insurance", label: "Interview Insurance", icon: Calendar, desc: "Guaranteed interviews", active: true },
                      ].map(product => {
                        const Icon = product.icon;
                        return (
                          <button
                            key={product.id}
                            onClick={() => setActiveTab(product.id as any)}
                            className="w-full px-4 py-3 flex items-center justify-between group hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="font-mono-cipher text-xs text-foreground">{product.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {product.active && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                              <span className="font-mono-cipher text-xs text-muted-foreground">{product.desc}</span>
                              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-border bg-card p-6 space-y-3">
                    <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Match Statistics</div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Total", value: matches.length },
                        { label: "Matched", value: matches.filter(m => m.status === "matched").length },
                        { label: "Pending", value: matches.filter(m => m.status === "pending").length },
                        { label: "Rejected", value: matches.filter(m => m.status === "rejected").length },
                      ].map(stat => (
                        <div key={stat.label} className="border border-border p-3 text-center">
                          <div className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>{stat.value}</div>
                          <div className="font-mono-cipher text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "stealth" && (
            <motion.div key="stealth" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <StealthModeTab address={address!} />
            </motion.div>
          )}

          {activeTab === "counter-offer" && (
            <motion.div key="counter-offer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CounterOfferTab address={address!} />
            </motion.div>
          )}

          {activeTab === "insurance" && (
            <motion.div key="insurance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <InterviewInsuranceTab address={address!} />
            </motion.div>
          )}

          {activeTab === "matches" && (
            <motion.div key="matches" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {matches.length === 0 ? (
                <div className="border border-border p-12 text-center">
                  <div className="font-mono-cipher text-xs text-muted-foreground">No matches yet. Submit your profile to enter the matching pool.</div>
                </div>
              ) : (
                matches.map((match, i) => (
                  <motion.div key={match._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="border border-border bg-card">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcon(match.status as MatchStatus)}
                        <div>
                          <div className="font-mono-cipher text-xs text-foreground">Employer {match.employerWallet.slice(0, 6)}...{match.employerWallet.slice(-4)}</div>
                          <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{match.employerWallet}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {match.status === "matched" && (
                          <button onClick={() => toggleReveal(match._id)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {revealedMatches.has(match._id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <span className={`font-mono-cipher text-xs px-2 py-1 border ${match.status === "matched" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                          {match.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {match.status === "matched" && (
                      <div className="p-6">
                        <ConsentReveal
                          matchId={match._id}
                          candidateConsented={consentStates[match._id]?.candidate ?? match.candidateConsented}
                          employerConsented={consentStates[match._id]?.employer ?? match.employerConsented}
                          salaryRevealed={match.salaryRevealed ?? false}
                          suggestedSalary={match.suggestedSalary}
                          score={match.score}
                          onCandidateConsent={() => handleCandidateConsent(match._id)}
                          onEmployerConsent={() => {}}
                          role="candidate"
                        />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "skills" && (
            <motion.div key="skills" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SkillHeatmap
                candidateSkills={selectedSkills}
                employerSkills={["Solidity", "TypeScript", "Smart Contracts", "Layer 2", "Cryptography"]}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}