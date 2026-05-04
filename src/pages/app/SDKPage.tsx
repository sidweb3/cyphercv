import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { ExternalLink, Copy, CheckCircle, Code2, Package, Zap, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const SDK_METHODS = [
  {
    category: "Candidate",
    methods: [
      {
        name: "cv.candidate.submitProfile()",
        signature: `await cv.candidate.submitProfile({
  salaryMin: 120_000,
  salaryMax: 160_000,
  experience: 8,
  skills: ["Solidity", "FHE", "Rust"],
})`,
        returns: "Promise<{ id: string; profileHash: string; txHash: string }>",
        desc: "Encrypts and submits a candidate profile to CipherCV on Arbitrum Sepolia. All values are encrypted client-side before submission.",
      },
      {
        name: "cv.candidate.updateStealth()",
        signature: `await cv.candidate.updateStealth({
  enabled: true,
  blockedDomains: ["google.com", "meta.com"],
  timeLockDate: "2025-09-01",
})`,
        returns: "Promise<{ txHash: string }>",
        desc: "Updates stealth mode settings. Blocked domains are hashed via keccak256 before submission — employers cannot see who blocked them.",
      },
    ],
  },
  {
    category: "Matching",
    methods: [
      {
        name: "cv.matching.computeMatch()",
        signature: `const match = await cv.matching.computeMatch({
  candidateId: profile.id,
  jobId: "job_abc123",
})`,
        returns: "Promise<{ isMatch: boolean; score: number; matchId: string }>",
        desc: "Runs the FHE matching circuit on Arbitrum Sepolia. Returns an encrypted boolean — the protocol knows a match exists without knowing why.",
      },
      {
        name: "cv.matching.batchMatch()",
        signature: `const results = await cv.matching.batchMatch({
  candidateIds: ["c1", "c2", "c3"],
  jobId: "job_abc123",
  maxPairs: 50,
})`,
        returns: "Promise<MatchResult[]>",
        desc: "Batch tournament matching via CipherBatchMatcher. Up to 50 candidate × employer pairs per transaction. Gas-optimized.",
      },
    ],
  },
  {
    category: "Consent",
    methods: [
      {
        name: "cv.consent.revealSalary()",
        signature: `const salary = await cv.consent.revealSalary({
  matchId: match.id,
  consent: true,
})`,
        returns: "Promise<{ salary: number; txHash: string }>",
        desc: "Signs mutual consent and reveals salary via decryptForTx + FHE.publishDecryptResult(). Both parties must consent before any value is revealed.",
      },
      {
        name: "cv.consent.decryptForView()",
        signature: `const value = await cv.consent.decryptForView({
  ctHash: "0x...",
  type: "uint64",
})`,
        returns: "Promise<bigint>",
        desc: "Decrypts a ciphertext for local UI display only. Uses @cofhe/sdk decryptForView — value is never transmitted to any server.",
      },
    ],
  },
  {
    category: "Vault",
    methods: [
      {
        name: "cv.vault.addCredential()",
        signature: `await cv.vault.addCredential({
  type: "salary_range",
  value: { min: 120_000, max: 160_000 },
})`,
        returns: "Promise<{ credentialId: string; hash: string }>",
        desc: "Encrypts and stores a credential in CipherVault. Returns the commitment hash for on-chain verification.",
      },
      {
        name: "cv.vault.revokeCredential()",
        signature: `await cv.vault.revokeCredential({
  credentialId: "cred_abc123",
})`,
        returns: "Promise<{ txHash: string }>",
        desc: "Revokes a credential on-chain. The commitment hash is invalidated — future matching will not use this credential.",
      },
    ],
  },
];

const INSTALL_CODE = `# Install the SDK
npm install @cipher-cv/sdk wagmi viem

# Or with bun
bun add @cipher-cv/sdk wagmi viem`;

const INIT_CODE = `import { CipherCV } from "@cipher-cv/sdk";
import { createWalletClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

const walletClient = createWalletClient({
  chain: arbitrumSepolia,
  transport: http(),
});

const cv = new CipherCV({
  network: "arbitrum-sepolia",
  walletClient,
  // Optional: override contract addresses
  contracts: {
    CipherCV: "0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659",
    CipherVault: "0xeff0835318a9e6812150519321B3097Db685A361",
  },
});`;

const FULL_EXAMPLE = `import { CipherCV } from "@cipher-cv/sdk";

const cv = new CipherCV({ network: "arbitrum-sepolia", walletClient });

// 1. Submit encrypted candidate profile
const profile = await cv.candidate.submitProfile({
  salaryMin: 120_000,
  salaryMax: 160_000,
  experience: 8,
  skills: ["Solidity", "FHE", "Rust"],
});

// 2. Enable stealth mode — block current employer
await cv.candidate.updateStealth({
  enabled: true,
  blockedDomains: ["currentemployer.com"],
});

// 3. Compute blind match against a job posting
const match = await cv.matching.computeMatch({
  candidateId: profile.id,
  jobId: "job_abc123",
});

// 4. If matched, reveal salary on mutual consent
if (match.isMatch) {
  const salary = await cv.consent.revealSalary({
    matchId: match.id,
    consent: true,
  });
  console.log(\`Agreed salary: $\${salary.salary.toLocaleString()}\`);
}`;

function CodeBlock({ code, label, copyable = true }: { code: string; label?: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border bg-card">
      {label && (
        <div className="px-4 py-2 border-b border-border bg-muted flex items-center justify-between">
          <span className="font-mono-cipher text-xs text-muted-foreground">{label}</span>
          <div className="flex items-center gap-3">
            <span className="font-mono-cipher text-xs text-primary">@cipher-cv/sdk</span>
            {copyable && (
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}
      <pre className="p-5 overflow-x-auto">
        <code className="font-mono-cipher text-xs leading-relaxed">
          {code.split("\n").map((line, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-muted-foreground select-none w-5 text-right shrink-0 opacity-30">{i + 1}</span>
              <span className={
                line.trim().startsWith("//") || line.trim().startsWith("#") ? "text-muted-foreground opacity-60" :
                line.includes("await") || line.includes("const") || line.includes("import") ? "text-foreground" :
                line.includes("cv.") ? "text-primary" :
                "text-muted-foreground"
              }>{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function MethodCard({ method }: { method: { name: string; signature: string; returns: string; desc: string } }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(method.signature);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div layout className="border border-border bg-card">
      <button
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono-cipher text-xs text-primary">{method.name}</span>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0 space-y-4 border-t border-border">
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed pt-4">{method.desc}</p>
              <div className="border border-border bg-muted/30">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="font-mono-cipher text-xs text-muted-foreground">Example</span>
                  <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
                    {copied ? <CheckCircle className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className="font-mono-cipher text-xs leading-relaxed text-muted-foreground">
                    {method.signature}
                  </code>
                </pre>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>RETURNS</span>
                <span className="font-mono-cipher text-xs text-primary">{method.returns}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SDKPage() {
  const [activeTab, setActiveTab] = useState<"quickstart" | "reference" | "examples">("quickstart");

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            SDK — Wave 3
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            @cipher-cv/sdk
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            TypeScript SDK for building privacy-preserving applications on the Cipher CV protocol. Wraps all 8 CoFHE contracts with a clean, type-safe API.
          </p>
        </div>

        {/* Status banner */}
        <div className="border border-primary/40 bg-primary/5 p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-primary" />
            <div>
              <div className="font-mono-cipher text-xs text-primary">@cipher-cv/sdk — Wave 3 Internal Release</div>
              <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>
                Arbitrum Sepolia · 8 contracts · decryptForView / decryptForTx
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono-cipher text-xs border border-primary text-primary px-2 py-1">v0.3.0-beta</span>
            <a
              href="https://docs.fhenix.zone"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Fhenix Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {[
            { label: "Contracts", value: "8", sub: "All on Arb Sepolia" },
            { label: "Methods", value: "24+", sub: "Type-safe API" },
            { label: "Networks", value: "3", sub: "Arb · Eth · Base Sepolia" },
            { label: "FHE Ops", value: "6", sub: "gte, lte, and, add, div, select" },
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
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              <div className="font-mono-cipher text-muted-foreground mt-0.5 opacity-60" style={{ fontSize: "10px" }}>{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "quickstart" as const, label: "Quick Start", icon: Zap },
            { id: "reference" as const, label: "API Reference", icon: Code2 },
            { id: "examples" as const, label: "Full Example", icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-mono-cipher text-xs uppercase tracking-widest border-b-2 transition-all duration-100 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "quickstart" && (
            <motion.div
              key="quickstart"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">1. Install</div>
                <CodeBlock code={INSTALL_CODE} label="Terminal" />
              </div>
              <div className="space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">2. Initialize</div>
                <CodeBlock code={INIT_CODE} label="init.ts" />
              </div>
              <div className="space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">3. Contract Addresses (Arbitrum Sepolia)</div>
                <div className="border border-border bg-card">
                  {[
                    { name: "CipherCV", addr: "0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659" },
                    { name: "CipherVault", addr: "0xeff0835318a9e6812150519321B3097Db685A361" },
                    { name: "CipherGovernance", addr: "0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707" },
                    { name: "CipherEscrow", addr: "0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6" },
                    { name: "CipherCounterOffer", addr: "0xac95Fd56a9a18A5424370528a40035F47277A13d" },
                    { name: "CipherStealth", addr: "0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91" },
                    { name: "CipherBatchMatcher", addr: "0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b" },
                    { name: "CipherRegistry", addr: "0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79" },
                  ].map((c, i) => (
                    <div key={c.name} className={`flex items-center justify-between px-5 py-3 ${i < 7 ? "border-b border-border" : ""}`}>
                      <span className="font-mono-cipher text-xs text-foreground">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-cipher text-xs text-primary">{c.addr.slice(0, 10)}...{c.addr.slice(-6)}</span>
                        <a
                          href={`https://sepolia.arbiscan.io/address/${c.addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "reference" && (
            <motion.div
              key="reference"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {SDK_METHODS.map(category => (
                <div key={category.category} className="space-y-3">
                  <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                    {category.category} Methods
                  </div>
                  <div className="space-y-2">
                    {category.methods.map(method => (
                      <MethodCard key={method.name} method={method} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "examples" && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                  End-to-End: Candidate Profile → Match → Reveal
                </div>
                <CodeBlock code={FULL_EXAMPLE} label="example.ts" />
              </div>

              <div className="border border-border p-6 space-y-4">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                  Privacy Guarantees
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Client-Side Encryption",
                      desc: "All values encrypted via @cofhe/sdk before any network call. Plaintext never leaves the browser.",
                    },
                    {
                      title: "Blind Matching",
                      desc: "FHE.gte() and FHE.and() compute compatibility on ciphertext. The protocol learns nothing about the inputs.",
                    },
                    {
                      title: "Consent-Gated Reveal",
                      desc: "decryptForTx + FHE.publishDecryptResult() requires both parties to sign. Rejection reveals zero information.",
                    },
                  ].map((item, i) => (
                    <div key={item.title} className="space-y-2">
                      <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">{item.title}</div>
                      <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
