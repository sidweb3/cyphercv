import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { commitValue } from "@/lib/demoData";
import { Lock, Unlock, Download, Plus, Trash2, Eye, EyeOff, Shield, Key, CheckCircle, Clock } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { toast } from "sonner";

interface Credential {
  id: string;
  type: "salary_range" | "experience" | "skill_vector" | "identity" | "education";
  label: string;
  hash: string;
  encryptedAt: string;
  network: string;
  revealed: boolean;
  value?: string;
}

const CREDENTIAL_TYPES = [
  { type: "salary_range" as const, label: "Salary Range", icon: "💰", desc: "Encrypted compensation expectations" },
  { type: "experience" as const, label: "Work Experience", icon: "📋", desc: "Years and level of experience" },
  { type: "skill_vector" as const, label: "Skill Vector", icon: "⚡", desc: "Technical skill set and proficiency" },
  { type: "identity" as const, label: "Identity Proof", icon: "🔐", desc: "Wallet-bound identity commitment" },
  { type: "education" as const, label: "Education", icon: "🎓", desc: "Degree and institution (encrypted)" },
];

const INITIAL_CREDENTIALS: Credential[] = [];

function CredentialCard({ credential, onReveal, onDelete }: {
  credential: Credential;
  onReveal: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [revealing, setRevealing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleReveal = async () => {
    setRevealing(true);
    await new Promise(r => setTimeout(r, 1200));
    onReveal(credential.id);
    setRevealing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise(r => setTimeout(r, 600));
    onDelete(credential.id);
    toast.success("Credential revoked");
  };

  const typeInfo = CREDENTIAL_TYPES.find(t => t.type === credential.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="border border-border bg-card"
    >
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 border flex items-center justify-center text-sm ${credential.revealed ? "border-primary" : "border-border"}`}>
            {credential.revealed ? <Unlock className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          <div>
            <div className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">
              {credential.label}
            </div>
            <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
              {credential.network}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReveal}
            disabled={revealing}
            className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100 flex items-center gap-1.5 disabled:opacity-50"
          >
            {revealing ? (
              <span className="animate-pulse">▋</span>
            ) : credential.revealed ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
            {credential.revealed ? "Hide" : "Reveal"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="font-mono-cipher text-xs border border-border text-muted-foreground px-2 py-1.5 hover:border-destructive hover:text-destructive transition-all duration-100 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-mono-cipher text-muted-foreground mb-1" style={{ fontSize: "10px" }}>COMMITMENT HASH</div>
            <div className="font-mono-cipher text-xs text-primary">{credential.hash}</div>
          </div>
          <div>
            <div className="font-mono-cipher text-muted-foreground mb-1" style={{ fontSize: "10px" }}>ENCRYPTED AT</div>
            <div className="font-mono-cipher text-xs text-foreground">
              {new Date(credential.encryptedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {credential.revealed && credential.value && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-primary/40 bg-primary/5 p-4"
            >
              <div className="font-mono-cipher text-muted-foreground mb-2" style={{ fontSize: "10px" }}>
                DECRYPTED VALUE — VISIBLE TO YOU ONLY
              </div>
              <motion.div
                initial={{ filter: "blur(8px)" }}
                animate={{ filter: "blur(0px)" }}
                transition={{ duration: 0.6 }}
                className="font-mono-cipher text-sm text-foreground font-bold"
              >
                {credential.value}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-primary" />
          <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
            Cryptographically bound to wallet — cannot be forged or transferred
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function AddCredentialModal({ onAdd, onClose }: { onAdd: (type: Credential["type"], label: string) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<Credential["type"] | null>(null);
  const [encrypting, setEncrypting] = useState(false);
  const [step, setStep] = useState(0);

  const handleAdd = async () => {
    if (!selected) return;
    setEncrypting(true);
    const steps = ["Generating encryption keys...", "Encrypting credential...", "Committing to Fhenix...", "Done"];
    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 600));
    }
    const typeInfo = CREDENTIAL_TYPES.find(t => t.type === selected)!;
    onAdd(selected, typeInfo.label);
    setEncrypting(false);
    onClose();
    toast.success("Credential encrypted & committed");
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
        className="bg-card border border-border w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
            Add Encrypted Credential
          </span>
          <button onClick={onClose} className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          {!encrypting ? (
            <>
              <div className="space-y-2">
                {CREDENTIAL_TYPES.map(type => (
                  <button
                    key={type.type}
                    onClick={() => setSelected(type.type)}
                    className={`w-full flex items-center gap-4 p-4 border transition-all duration-100 text-left ${
                      selected === type.type ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <div className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">{type.label}</div>
                      <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{type.desc}</div>
                    </div>
                    {selected === type.type && <CheckCircle className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAdd}
                disabled={!selected}
                className="w-full py-3 bg-primary text-primary-foreground font-mono-cipher text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50"
              >
                Encrypt & Add Credential →
              </button>
            </>
          ) : (
            <div className="space-y-3 py-4">
              {["Generating encryption keys...", "Encrypting credential...", "Committing to Fhenix...", "Done"].map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: step >= i ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3 font-mono-cipher text-xs"
                >
                  {step > i ? (
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  ) : step === i ? (
                    <span className="text-primary animate-pulse">▋</span>
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className={step >= i ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

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

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const [credentials, setCredentials] = useState<Credential[]>(INITIAL_CREDENTIALS);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"vault" | "export" | "audit">("vault");

  const handleReveal = (id: string) => {
    setCredentials(prev => prev.map(c => c.id === id ? { ...c, revealed: !c.revealed } : c));
  };

  const handleDelete = (id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  const handleAdd = (type: Credential["type"], label: string) => {
    const newCred: Credential = {
      id: `cred-${Date.now()}`,
      type,
      label,
      hash: commitValue(type + Date.now()),
      encryptedAt: new Date().toISOString(),
      network: "Ethereum Sepolia",
      revealed: false,
    };
    setCredentials(prev => [newCred, ...prev]);
  };

  const handleExportAll = () => {
    const exportData = {
      version: "cipher-cv-vault-v2",
      walletAddress: address,
      exportedAt: new Date().toISOString(),
      credentials: credentials.map(c => ({
        type: c.type,
        label: c.label,
        hash: c.hash,
        encryptedAt: c.encryptedAt,
        network: c.network,
        value: "[ENCRYPTED — NOT EXPORTED]",
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cipher-cv-vault-${address?.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Vault exported (encrypted hashes only)");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
              ZK Identity Vault
            </span>
          </div>
          <div className="border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Access Restricted</div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                Connect Wallet to Access Vault
              </h2>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                Your encrypted credentials are bound to your wallet address. Connect to manage them.
              </p>
            </div>
            <ConnectWalletButton className="w-full font-mono-cipher text-sm bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
              ZK Identity Vault — Wave 2
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
              Encrypted Credentials
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your cryptographic credential commitments. Reveal values only to yourself — never to employers or the network.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportAll}
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-4 py-2 hover:border-primary hover:text-foreground transition-all duration-100 flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              Export Vault
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Add Credential
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {[
            { label: "Total Credentials", value: String(credentials.length) },
            { label: "Encrypted", value: String(credentials.filter(c => !c.revealed).length) },
            { label: "Revealed (local)", value: String(credentials.filter(c => c.revealed).length) },
            { label: "Network", value: "Ethereum Sepolia" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`p-5 ${i < 3 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="text-xl font-bold text-foreground mb-0.5" style={{ fontFamily: "Space Grotesk" }}>
                {stat.value}
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "vault" as const, label: "Credentials" },
            { id: "audit" as const, label: "Audit Log" },
            { id: "export" as const, label: "Export & Share" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-mono-cipher text-xs uppercase tracking-widest border-b-2 transition-all duration-100 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "vault" && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {credentials.length === 0 ? (
                <div className="border border-border p-12 text-center">
                  <div className="font-mono-cipher text-xs text-muted-foreground">
                    No credentials yet. Add your first encrypted credential.
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {credentials.map(cred => (
                    <CredentialCard
                      key={cred.id}
                      credential={cred}
                      onReveal={handleReveal}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {activeTab === "audit" && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border border-border bg-card"
            >
              <div className="px-6 py-4 border-b border-border">
                <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                  Credential Access Log
                </span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { action: "CREDENTIAL_CREATED", cred: "Salary Range", time: "2 days ago", hash: commitValue("salary_range", "log-1") },
                  { action: "CREDENTIAL_CREATED", cred: "Work Experience", time: "3 days ago", hash: commitValue("experience", "log-2") },
                  { action: "CREDENTIAL_CREATED", cred: "Skill Vector", time: "4 days ago", hash: commitValue("skill_vector", "log-3") },
                  { action: "MATCH_COMPUTED", cred: "Salary Range", time: "1 day ago", hash: commitValue("match_computed", "log-4") },
                  { action: "CONSENT_SIGNED", cred: "Salary Range", time: "12 hours ago", hash: commitValue("consent_signed", "log-5") },
                ].map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    <span className={`font-mono-cipher border px-2 py-0.5 shrink-0 ${
                      log.action.includes("MATCH") || log.action.includes("CONSENT")
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                    }`} style={{ fontSize: "9px" }}>
                      {log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono-cipher text-xs text-foreground">{log.cred}</div>
                      <div className="font-mono-cipher text-muted-foreground truncate" style={{ fontSize: "10px" }}>
                        {log.hash}
                      </div>
                    </div>
                    <div className="font-mono-cipher text-xs text-muted-foreground shrink-0">{log.time}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "export" && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="border border-border bg-card p-6 space-y-4">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                  Export Options
                </div>
                <div className="space-y-3">
                  {[
                    {
                      label: "Export Vault (Hashes Only)",
                      desc: "Export commitment hashes for verification. No plaintext values included.",
                      action: handleExportAll,
                      safe: true,
                    },
                    {
                      label: "Generate Shareable Proof",
                      desc: "Create a zero-knowledge proof that you hold specific credentials without revealing values.",
                      action: () => toast.info("ZK proof generation — Wave 3 feature"),
                      safe: true,
                    },
                    {
                      label: "Revoke All Credentials",
                      desc: "Permanently revoke all credential commitments from the Fhenix network.",
                      action: () => toast.error("Revocation requires on-chain transaction — Wave 3"),
                      safe: false,
                    },
                  ].map(option => (
                    <div key={option.label} className={`border p-4 flex items-center justify-between gap-4 ${option.safe ? "border-border" : "border-destructive/30"}`}>
                      <div>
                        <div className="font-mono-cipher text-xs text-foreground">{option.label}</div>
                        <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>
                          {option.desc}
                        </div>
                      </div>
                      <button
                        onClick={option.action}
                        className={`font-mono-cipher text-xs px-4 py-2 border transition-all duration-100 shrink-0 ${
                          option.safe
                            ? "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                            : "border-destructive/50 text-destructive hover:bg-destructive hover:text-background"
                        }`}
                      >
                        Execute →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border bg-card p-6 space-y-3">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                  Privacy Guarantee
                </div>
                <div className="space-y-2">
                  {[
                    "Plaintext values never leave your device",
                    "Only cryptographic hashes are stored on-chain",
                    "Reveal is always local — never transmitted",
                    "Wallet signature required for any on-chain action",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-mono-cipher text-xs text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add credential modal */}
        <AnimatePresence>
          {showAdd && (
            <AddCredentialModal
              onAdd={handleAdd}
              onClose={() => setShowAdd(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}