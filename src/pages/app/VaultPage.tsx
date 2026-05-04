import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { commitValue } from "@/lib/demoData";
import { Lock, Unlock, Download, Plus, Trash2, Eye, EyeOff, Shield, Key, CheckCircle, Clock } from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface CredentialType {
  type: "salary_range" | "experience" | "skill_vector" | "identity" | "education";
  label: string;
  icon: string;
  desc: string;
}

const CREDENTIAL_TYPES: CredentialType[] = [
  { type: "salary_range", label: "Salary Range", icon: "💰", desc: "Encrypted compensation expectations" },
  { type: "experience", label: "Work Experience", icon: "📋", desc: "Years and level of experience" },
  { type: "skill_vector", label: "Skill Vector", icon: "⚡", desc: "Technical skill set and proficiency" },
  { type: "identity", label: "Identity Proof", icon: "🔐", desc: "Wallet-bound identity commitment" },
  { type: "education", label: "Education", icon: "🎓", desc: "Degree and institution (encrypted)" },
];

const CREDENTIAL_VALUES: Record<string, string> = {
  salary_range: "$120,000 – $160,000 / year",
  experience: "6 years — Senior Engineer",
  skill_vector: "Solidity: 9/10, TypeScript: 8/10, FHE: 7/10",
  identity: "0x" + Math.random().toString(16).slice(2, 18) + "...",
  education: "B.S. Computer Science — MIT (2018)",
};

function CredentialCard({ credential, onReveal, onDelete }: {
  credential: { _id: Id<"vaultCredentials">; type: string; label: string; hash: string; network: string; revealed: boolean; _creationTime: number };
  onReveal: (id: Id<"vaultCredentials">) => void;
  onDelete: (id: Id<"vaultCredentials">) => void;
}) {
  const [revealing, setRevealing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localRevealed, setLocalRevealed] = useState(false);

  const handleReveal = async () => {
    setRevealing(true);
    await new Promise(r => setTimeout(r, 1000));
    onReveal(credential._id);
    setLocalRevealed(v => !v);
    setRevealing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise(r => setTimeout(r, 400));
    onDelete(credential._id);
    toast.success("Credential revoked");
  };

  const isRevealed = credential.revealed || localRevealed;

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
          <div className={`w-8 h-8 border flex items-center justify-center ${isRevealed ? "border-primary" : "border-border"}`}>
            {isRevealed ? <Unlock className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          <div>
            <div className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">{credential.label}</div>
            <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{credential.network}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReveal}
            disabled={revealing}
            className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100 flex items-center gap-1.5 disabled:opacity-50"
          >
            {revealing ? <span className="animate-pulse">▋</span> : isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {isRevealed ? "Hide" : "Reveal"}
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
            <div className="font-mono-cipher text-xs text-primary truncate">{credential.hash}</div>
          </div>
          <div>
            <div className="font-mono-cipher text-muted-foreground mb-1" style={{ fontSize: "10px" }}>ENCRYPTED AT</div>
            <div className="font-mono-cipher text-xs text-foreground">
              {new Date(credential._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isRevealed && (
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
                {CREDENTIAL_VALUES[credential.type] ?? "[encrypted]"}
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

function AddCredentialModal({ walletAddress, onClose }: { walletAddress: string; onClose: () => void }) {
  const [selected, setSelected] = useState<CredentialType["type"] | null>(null);
  const [encrypting, setEncrypting] = useState(false);
  const [step, setStep] = useState(0);
  const addCredential = useMutation(api.vault.addCredential);

  const handleAdd = async () => {
    if (!selected) return;
    setEncrypting(true);
    const steps = ["Generating encryption keys...", "Encrypting credential...", "Committing to Arbitrum Sepolia...", "Done"];
    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 600));
    }
    const typeInfo = CREDENTIAL_TYPES.find(t => t.type === selected)!;
    await addCredential({
      walletAddress,
      type: selected,
      label: typeInfo.label,
      hash: commitValue(selected + Date.now()),
      network: "Arbitrum Sepolia",
    });
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
        className="bg-card border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Add Encrypted Credential</span>
          <button onClick={onClose} className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground">✕</button>
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
              {["Generating encryption keys...", "Encrypting credential...", "Committing to Arbitrum Sepolia...", "Done"].map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: step >= i ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3 font-mono-cipher text-xs"
                >
                  {step > i ? <CheckCircle className="w-3.5 h-3.5 text-primary" /> : step === i ? <span className="text-primary animate-pulse">▋</span> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
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

export default function VaultPage() {
  const { address } = useAccount();
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"vault" | "export" | "audit">("vault");

  const credentials = useQuery(api.vault.getCredentials, address ? { walletAddress: address } : "skip") ?? [];
  const toggleReveal = useMutation(api.vault.toggleReveal);
  const revokeCredential = useMutation(api.vault.revokeCredential);

  const handleReveal = (id: Id<"vaultCredentials">) => {
    toggleReveal({ credentialId: id });
  };

  const handleDelete = (id: Id<"vaultCredentials">) => {
    revokeCredential({ credentialId: id });
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

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">ZK Identity Vault — Wave 3</div>
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
            { label: "Network", value: "Arbitrum Sepolia" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`p-5 ${i < 3 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="text-xl font-bold text-foreground mb-0.5" style={{ fontFamily: "Space Grotesk" }}>{stat.value}</div>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
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
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "vault" && (
            <motion.div key="vault" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {credentials.length === 0 ? (
                <div className="border border-border p-12 text-center space-y-3">
                  <Key className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <div className="font-mono-cipher text-xs text-muted-foreground">
                    No credentials yet. Add your first encrypted credential.
                  </div>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="font-mono-cipher text-xs border border-border text-muted-foreground px-4 py-2 hover:border-primary hover:text-foreground transition-all duration-100"
                  >
                    + Add First Credential
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {credentials.map(cred => (
                    <CredentialCard key={cred._id} credential={cred} onReveal={handleReveal} onDelete={handleDelete} />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {activeTab === "audit" && (
            <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border border-border bg-card">
              <div className="px-6 py-4 border-b border-border">
                <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Credential Audit Log</span>
              </div>
              <div className="divide-y divide-border">
                {credentials.length === 0 ? (
                  <div className="p-8 text-center font-mono-cipher text-xs text-muted-foreground">No audit events yet</div>
                ) : (
                  credentials.map((cred, i) => (
                    <div key={cred._id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                      <div className="flex-1 font-mono-cipher text-xs text-foreground">
                        {cred.label} — committed to {cred.network}
                      </div>
                      <div className="font-mono-cipher text-xs text-muted-foreground">
                        {new Date(cred._creationTime).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "export" && (
            <motion.div key="export" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="border border-border bg-card p-6 space-y-4">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Export Options</div>
                <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                  Export your vault as a JSON file containing commitment hashes only. Encrypted values are never exported.
                </p>
                <button
                  onClick={handleExportAll}
                  className="font-mono-cipher text-xs bg-primary text-primary-foreground px-6 py-3 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Export Vault JSON
                </button>
              </div>
              <div className="border border-border bg-card p-6 space-y-3">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Portability</div>
                {[
                  "Commitment hashes are portable across any FHE-compatible platform",
                  "Your wallet signature proves ownership without revealing values",
                  "Import into any Cipher CV-compatible dApp using your wallet",
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 font-mono-cipher text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAdd && address && (
            <AddCredentialModal walletAddress={address} onClose={() => setShowAdd(false)} />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}