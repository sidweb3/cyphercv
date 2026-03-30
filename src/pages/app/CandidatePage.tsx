import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import { AppLayout } from "./AppLayout";
import { EncryptedInput } from "@/components/EncryptedInput";
import { generateHash, computeMatch } from "@/lib/demoData";
import { CheckCircle, Clock, XCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useAccount, useConnect } from "wagmi";

function ConnectWalletButton({ className }: { className?: string }) {
  const { connect, connectors } = useConnect();
  const handleConnect = () => {
    const c = connectors.find(c => c.id === 'injected') || connectors[0];
    if (c) connect({ connector: c });
  };
  return (
    <button onClick={handleConnect} className={className}>
      Connect Wallet →
    </button>
  );
}

type MatchStatus = "pending" | "matched" | "rejected";

interface MatchRecord {
  id: string;
  employerHash: string;
  employerLabel: string;
  status: MatchStatus;
  score?: number;
  salary?: number;
  timestamp: string;
}

const MOCK_MATCHES: MatchRecord[] = [
  {
    id: "m1",
    employerHash: "0x9b2c4e1d8f5a7f3a",
    employerLabel: "Series A Startup — Engineering",
    status: "matched",
    score: 94,
    salary: 125000,
    timestamp: "2 hours ago",
  },
  {
    id: "m2",
    employerHash: "0x3d8e2f1a9c7b4e6d",
    employerLabel: "Enterprise Corp — Senior Role",
    status: "pending",
    timestamp: "5 hours ago",
  },
  {
    id: "m3",
    employerHash: "0x5c9f2e8a1b4d7e3c",
    employerLabel: "Early Stage — Founding Engineer",
    status: "rejected",
    timestamp: "1 day ago",
  },
  {
    id: "m4",
    employerHash: "0x1a9c7b4e6d3d8e2f",
    employerLabel: "Scale-up — Staff Engineer",
    status: "matched",
    score: 78,
    salary: 145000,
    timestamp: "2 days ago",
  },
];

const SKILLS = [
  "Solidity", "Rust", "TypeScript", "React", "Node.js",
  "Python", "Go", "ZK Proofs", "FHE", "Smart Contracts",
  "DeFi", "Layer 2", "Cryptography", "Distributed Systems",
];

export default function CandidatePage() {
  const { isConnected } = useAccount();
  const [experience, setExperience] = useState(5);
  const [skillLevel, setSkillLevel] = useState(7);
  const [minSalary, setMinSalary] = useState(100000);
  const [maxSalary, setMaxSalary] = useState(150000);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Solidity", "TypeScript", "React"]);
  const [profileHash] = useState(generateHash);
  const [profileCreated, setProfileCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revealedMatches, setRevealedMatches] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<MatchRecord[]>(MOCK_MATCHES);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleCreateProfile = useCallback(() => {
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      setProfileCreated(true);
    }, 2000);
  }, []);

  const toggleReveal = (id: string) => {
    setRevealedMatches(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusIcon = (status: MatchStatus) => {
    if (status === "matched") return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
    if (status === "pending") return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    return <XCircle className="w-3.5 h-3.5 text-destructive" />;
  };

  // Wallet gate
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
              Cipher CV
            </span>
          </div>
          <div className="border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Access Restricted</div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                Candidate Dashboard
              </h2>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                Connect your wallet to access the encrypted candidate profile builder.
              </p>
            </div>
            <ConnectWalletButton className="w-full font-mono-cipher text-sm bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold" />
            <Link to="/" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors block">
              ← Back to Landing
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            Candidate Dashboard
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Encrypted Profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Your credentials are encrypted before submission. Employers see only a cryptographic commitment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Builder */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-border bg-card">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                  Utility Curve Configuration
                </span>
                <span className="encrypted-block">{profileHash.slice(0, 12)}...</span>
              </div>
              <div className="p-6 space-y-6">
                <EncryptedInput
                  label="Years of Experience"
                  min={0}
                  max={20}
                  value={experience}
                  onChange={setExperience}
                />
                <EncryptedInput
                  label="Skill Proficiency Index"
                  min={1}
                  max={10}
                  value={skillLevel}
                  onChange={setSkillLevel}
                />
                <EncryptedInput
                  label="Minimum Salary Requirement"
                  min={40000}
                  max={400000}
                  value={minSalary}
                  onChange={setMinSalary}
                />
                <EncryptedInput
                  label="Maximum Salary Ceiling"
                  min={40000}
                  max={400000}
                  value={maxSalary}
                  onChange={setMaxSalary}
                />
              </div>
            </div>

            {/* Skills */}
            <div className="border border-border bg-card">
              <div className="px-6 py-4 border-b border-border">
                <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                  Skill Vector — Encrypted
                </span>
              </div>
              <div className="p-6">
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
                      {selectedSkills.includes(skill) ? "█ " : ""}{skill}
                    </button>
                  ))}
                </div>
                <div className="mt-4 font-mono-cipher text-xs text-muted-foreground">
                  Skill hash: <span className="text-foreground">{generateHash()}</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleCreateProfile}
              disabled={creating || profileCreated}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest font-mono-cipher disabled:opacity-60 transition-all duration-100 hover:bg-foreground hover:text-background"
            >
              {creating
                ? "Encrypting Profile..."
                : profileCreated
                ? "✓ Profile Encrypted & Submitted"
                : "Encrypt & Submit Profile"}
            </motion.button>

            {creating && (
              <div className="border border-border p-4 space-y-2">
                {[
                  "Generating encryption keys...",
                  "Encrypting salary range...",
                  "Encrypting skill vector...",
                  "Committing to Fhenix...",
                ].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-2"
                  >
                    <span className="text-primary animate-pulse">▋</span> {step}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <div className="border border-border bg-card p-6 space-y-4">
              <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                Profile Status
              </div>
              <div className="space-y-3">
                {[
                  { label: "Identity", value: "[ENCRYPTED]", ok: true },
                  { label: "Salary Range", value: "[ENCRYPTED]", ok: true },
                  { label: "Skills", value: `${selectedSkills.length} vectors`, ok: true },
                  { label: "Experience", value: "[ENCRYPTED]", ok: true },
                  { label: "On-chain", value: profileCreated ? "Committed" : "Pending", ok: profileCreated },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="font-mono-cipher text-xs text-muted-foreground">{item.label}</span>
                    <span className={`font-mono-cipher text-xs ${item.ok ? "text-primary" : "text-muted-foreground"}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border bg-card p-6 space-y-3">
              <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                Match Statistics
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total", value: matches.length },
                  { label: "Matched", value: matches.filter(m => m.status === "matched").length },
                  { label: "Pending", value: matches.filter(m => m.status === "pending").length },
                  { label: "Rejected", value: matches.filter(m => m.status === "rejected").length },
                ].map(stat => (
                  <div key={stat.label} className="border border-border p-3 text-center">
                    <div className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                      {stat.value}
                    </div>
                    <div className="font-mono-cipher text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="border border-border bg-card">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
              Match History — Encrypted
            </span>
            <span className="font-mono-cipher text-xs text-muted-foreground">
              {matches.length} records
            </span>
          </div>
          <div className="divide-y divide-border">
            {matches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {statusIcon(match.status)}
                  <div className="min-w-0">
                    <div className="font-mono-cipher text-xs text-foreground truncate">
                      {match.employerLabel}
                    </div>
                    <div className="font-mono-cipher text-xs text-muted-foreground">
                      {match.employerHash.slice(0, 14)}... · {match.timestamp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {match.status === "matched" && (
                    <AnimatePresence mode="wait">
                      {revealedMatches.has(match.id) ? (
                        <motion.div
                          key="revealed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-right"
                        >
                          <div className="font-mono-cipher text-xs text-primary">{match.score}% match</div>
                          <div className="font-mono-cipher text-xs text-foreground">${match.salary?.toLocaleString()}</div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-right"
                        >
                          <div className="encrypted-block">██% match</div>
                          <div className="encrypted-block mt-1">$███,███</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                  {match.status === "rejected" && (
                    <div className="font-mono-cipher text-xs text-muted-foreground">
                      No overlap detected
                    </div>
                  )}
                  {match.status === "pending" && (
                    <div className="font-mono-cipher text-xs text-muted-foreground animate-pulse">
                      Computing...
                    </div>
                  )}
                  {match.status === "matched" && (
                    <button
                      onClick={() => toggleReveal(match.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {revealedMatches.has(match.id) ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}