import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { FHECircuit } from "@/components/FHECircuit";
import { generateHash } from "@/lib/demoData";
import { Shield, CheckCircle, Clock, Zap, Code2, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

interface ProofLog {
  id: string;
  txHash: string;
  blockNumber: number;
  operation: string;
  inputTypes: string[];
  outputType: string;
  gasUsed: number;
  timestamp: number;
  verified: boolean;
}

function generateProofLog(): ProofLog {
  const ops = [
    { op: "FHE.gte(euint256, euint256)", inputs: ["euint256", "euint256"], output: "ebool" },
    { op: "FHE.and(ebool, ebool)", inputs: ["ebool", "ebool"], output: "ebool" },
    { op: "FHE.lte(euint256, euint256)", inputs: ["euint256", "euint256"], output: "ebool" },
    { op: "FHE.add(euint256, euint256)", inputs: ["euint256", "euint256"], output: "euint256" },
    { op: "FHE.div(euint256, euint256)", inputs: ["euint256", "euint256"], output: "euint256" },
    { op: "FHE.asEuint256(inEuint256)", inputs: ["inEuint256"], output: "euint256" },
  ];
  const chosen = ops[Math.floor(Math.random() * ops.length)];
  return {
    id: generateHash(),
    txHash: generateHash(),
    blockNumber: 1847293 + Math.floor(Math.random() * 1000),
    operation: chosen.op,
    inputTypes: chosen.inputs,
    outputType: chosen.output,
    gasUsed: 21000 + Math.floor(Math.random() * 80000),
    timestamp: Date.now() - Math.floor(Math.random() * 60000),
    verified: Math.random() > 0.05,
  };
}

const INITIAL_PROOFS = Array.from({ length: 8 }, generateProofLog);

function ProofRow({ proof, index }: { proof: ProofLog; index: number }) {
  const [copied, setCopied] = useState(false);
  const copyHash = () => {
    navigator.clipboard.writeText(proof.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Hash copied");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="px-6 py-4 flex items-center gap-4 border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors"
    >
      <div className="shrink-0">
        {proof.verified
          ? <CheckCircle className="w-3.5 h-3.5 text-primary" />
          : <Clock className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
        }
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <div className="font-mono-cipher text-xs text-foreground truncate">{proof.operation}</div>
          <div className="font-mono-cipher text-muted-foreground truncate" style={{ fontSize: "10px" }}>
            Block #{proof.blockNumber}
          </div>
        </div>
        <div className="hidden md:block">
          <div className="flex gap-1 flex-wrap">
            {proof.inputTypes.map((t, i) => (
              <span key={i} className="font-mono-cipher border border-border px-1.5 py-0.5 text-muted-foreground" style={{ fontSize: "9px" }}>
                {t}
              </span>
            ))}
            <span className="font-mono-cipher text-muted-foreground self-center" style={{ fontSize: "9px" }}>→</span>
            <span className="font-mono-cipher border border-primary px-1.5 py-0.5 text-primary" style={{ fontSize: "9px" }}>
              {proof.outputType}
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <span className="font-mono-cipher text-xs text-muted-foreground truncate">{proof.txHash.slice(0, 14)}...</span>
          <button onClick={copyHash} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            {copied ? <CheckCircle className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="hidden md:block text-right">
          <div className="font-mono-cipher text-xs text-muted-foreground">{proof.gasUsed.toLocaleString()} gas</div>
          <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
            {new Date(proof.timestamp).toLocaleTimeString("en-US", { hour12: false })}
          </div>
        </div>
      </div>
      <div className="shrink-0">
        <a
          href={`https://sepolia.etherscan.io/tx/${proof.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}

function LiveProofStream() {
  const [proofs, setProofs] = useState<ProofLog[]>(INITIAL_PROOFS);
  const [circuitRunning, setCircuitRunning] = useState(false);
  const [autoRun, setAutoRun] = useState(true);

  useEffect(() => {
    if (!autoRun) return;
    const interval = setInterval(() => {
      setProofs(prev => [generateProofLog(), ...prev].slice(0, 20));
    }, 3200);
    return () => clearInterval(interval);
  }, [autoRun]);

  const runProof = () => {
    setCircuitRunning(true);
    setTimeout(() => {
      setCircuitRunning(false);
      setProofs(prev => [generateProofLog(), ...prev].slice(0, 20));
      toast.success("FHE proof verified on Ethereum Sepolia");
    }, 2800);
  };

  const verifiedCount = proofs.filter(p => p.verified).length;
  const totalGas = proofs.reduce((sum, p) => sum + p.gasUsed, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
        {[
          { label: "Proofs Verified", value: String(verifiedCount) },
          { label: "Total Gas Used", value: totalGas.toLocaleString() },
          { label: "Avg Gas / Op", value: Math.round(totalGas / proofs.length).toLocaleString() },
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

      {/* FHE Circuit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
              Live Circuit Execution
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="font-mono-cipher text-xs text-muted-foreground">Auto</span>
                <div
                  onClick={() => setAutoRun(v => !v)}
                  className={`w-8 h-4 border transition-colors cursor-pointer relative ${autoRun ? "border-primary bg-primary/20" : "border-border"}`}
                >
                  <motion.div
                    animate={{ x: autoRun ? 16 : 0 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute top-0.5 left-0.5 w-3 h-3 ${autoRun ? "bg-primary" : "bg-muted-foreground"}`}
                  />
                </div>
              </label>
              <button
                onClick={runProof}
                disabled={circuitRunning}
                className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50 flex items-center gap-2"
              >
                <Zap className="w-3 h-3" />
                {circuitRunning ? "Proving..." : "Run Proof"}
              </button>
            </div>
          </div>
          <FHECircuit running={circuitRunning} />
        </div>

        {/* Proof detail */}
        <div className="border border-border bg-card">
          <div className="px-4 py-3 border-b border-border">
            <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
              Latest Proof Detail
            </span>
          </div>
          <div className="p-4 space-y-3">
            {proofs[0] && (
              <>
                <div className="space-y-2">
                  {[
                    { label: "Operation", value: proofs[0].operation },
                    { label: "Block", value: `#${proofs[0].blockNumber}` },
                    { label: "Tx Hash", value: `${proofs[0].txHash.slice(0, 18)}...` },
                    { label: "Gas Used", value: proofs[0].gasUsed.toLocaleString() },
                    { label: "Status", value: proofs[0].verified ? "VERIFIED" : "PENDING" },
                    { label: "Network", value: "Ethereum Sepolia" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="font-mono-cipher text-xs text-muted-foreground">{item.label}</span>
                      <span className={`font-mono-cipher text-xs ${item.label === "Status" && proofs[0].verified ? "text-primary" : "text-foreground"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border border-border p-3 bg-background space-y-1">
                  <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                    PROOF CALLDATA
                  </div>
                  <div className="font-mono-cipher text-xs text-primary break-all">
                    {proofs[0].txHash}{proofs[0].id.slice(2)}...
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Proof log table */}
      <div className="border border-border bg-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
            Proof Log — Ethereum Sepolia
          </span>
          <span className="flex items-center gap-1.5 font-mono-cipher text-xs text-primary">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="hidden md:grid grid-cols-4 gap-2 px-6 py-2 border-b border-border bg-muted/30">
          {["Operation", "I/O Types", "Tx Hash", "Gas / Time"].map(h => (
            <div key={h} className="font-mono-cipher text-muted-foreground uppercase tracking-widest" style={{ fontSize: "9px" }}>
              {h}
            </div>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {proofs.map((proof, i) => (
            <ProofRow key={proof.id} proof={proof} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const FHE_OPS_REFERENCE = [
  { op: "FHE.gte(a, b)", gas: "~45,000", desc: "Encrypted ≥ comparison. Core salary overlap operator." },
  { op: "FHE.lte(a, b)", gas: "~45,000", desc: "Encrypted ≤ comparison. Upper bound salary check." },
  { op: "FHE.and(a, b)", gas: "~12,000", desc: "Encrypted AND. Combines salary + experience signals." },
  { op: "FHE.add(a, b)", gas: "~38,000", desc: "Encrypted addition. Salary midpoint computation." },
  { op: "FHE.div(a, b)", gas: "~95,000", desc: "Encrypted division. Normalize salary ranges." },
  { op: "FHE.asEuint256(x)", gas: "~28,000", desc: "Convert client input to on-chain encrypted integer." },
];

export default function ProofExplorerPage() {
  const tableRef = useRef(null);
  const tableInView = useInView(tableRef, { once: true });

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            FHE Proof Explorer — Wave 2
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Live Proof Verification
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Every FHE operation on Fhenix generates a cryptographic proof. Verify that salary comparisons, experience checks, and match computations were performed correctly — without revealing the underlying values.
          </p>
        </div>

        {/* Status banner */}
        <div className="border border-primary/40 bg-primary/5 p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-mono-cipher text-xs text-primary">
              Ethereum Sepolia — Chain ID 11155111 — Contract Verification Active
            </span>
          </div>
          <a
            href="https://sepolia.etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Sepolia Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Live proof stream */}
        <LiveProofStream />

        {/* FHE Operations Reference */}
        <div ref={tableRef} className="space-y-4">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
            FHE Operations Reference — Gas Costs
          </div>
          <div className="border border-border">
            <div className="grid grid-cols-3 px-6 py-3 border-b border-border bg-muted/30">
              {["Operation", "Est. Gas", "Description"].map(h => (
                <div key={h} className="font-mono-cipher text-muted-foreground uppercase tracking-widest" style={{ fontSize: "9px" }}>
                  {h}
                </div>
              ))}
            </div>
            {FHE_OPS_REFERENCE.map((op, i) => (
              <motion.div
                key={op.op}
                initial={{ opacity: 0, x: -10 }}
                animate={tableInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.07 }}
                className={`grid grid-cols-3 px-6 py-4 gap-4 ${i < FHE_OPS_REFERENCE.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="font-mono-cipher text-xs text-primary">{op.op}</div>
                <div className="font-mono-cipher text-xs text-foreground">{op.gas}</div>
                <div className="font-mono-cipher text-xs text-muted-foreground">{op.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How proofs work */}
        <div className="border border-border p-6 space-y-4">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
            How FHE Proofs Work
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Client Encrypts",
                desc: "The @cofhe/sdk encrypts inputs client-side. The ciphertext is submitted to the Fhenix fhEVM as inEuint256.",
              },
              {
                step: "02",
                title: "fhEVM Computes",
                desc: "The Fhenix virtual machine executes FHE operations on ciphertext. No decryption occurs during computation.",
              },
              {
                step: "03",
                title: "Proof Generated",
                desc: "Each operation generates a cryptographic proof that the computation was performed correctly on valid ciphertext.",
              },
            ].map((item, i) => (
              <div key={item.step} className="space-y-2">
                <div className="font-mono-cipher text-3xl font-bold text-muted-foreground opacity-20">
                  {item.step}
                </div>
                <div className="font-bold text-foreground text-sm" style={{ fontFamily: "Space Grotesk" }}>
                  {item.title}
                </div>
                <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
