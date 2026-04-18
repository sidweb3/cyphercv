import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, AlertTriangle, CheckCircle } from "lucide-react";

interface PrivacyMetric {
  label: string;
  score: number;
  status: "secure" | "warning" | "critical";
  detail: string;
}

const BASE_METRICS: PrivacyMetric[] = [
  { label: "Identity Exposure", score: 0, status: "secure", detail: "Wallet address decoupled from profile" },
  { label: "Salary Leakage", score: 0, status: "secure", detail: "All values encrypted before transmission" },
  { label: "Rejection Signal", score: 0, status: "secure", detail: "Zero-information rejection guaranteed" },
  { label: "History Exposure", score: 0, status: "secure", detail: "No prior compensation data stored" },
  { label: "Network Visibility", score: 2, status: "secure", detail: "Only ciphertext visible on-chain" },
  { label: "Consent Enforcement", score: 0, status: "secure", detail: "Dual-signature required for reveal" },
];

export function PrivacyScore({ walletConnected = false }: { walletConnected?: boolean }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const overallScore = 98;

  return (
    <div className="border border-border bg-card space-y-0">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
            Privacy Score
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={animated ? { opacity: 1 } : {}}
          className="flex items-baseline gap-1"
        >
          <span className="text-3xl font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>
            {overallScore}
          </span>
          <span className="font-mono-cipher text-xs text-muted-foreground">/100</span>
        </motion.div>
      </div>

      {/* Score bar */}
      <div className="px-6 py-3 border-b border-border">
        <div className="h-1.5 bg-secondary relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-primary"
            initial={{ width: 0 }}
            animate={animated ? { width: `${overallScore}%` } : {}}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>EXPOSED</span>
          <span className="font-mono-cipher text-primary" style={{ fontSize: "10px" }}>PRIVATE</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="divide-y divide-border">
        {BASE_METRICS.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -10 }}
            animate={animated ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.08 }}
            className="px-6 py-3 flex items-center gap-3"
          >
            <CheckCircle className="w-3 h-3 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-mono-cipher text-xs text-foreground">{metric.label}</div>
              <div className="font-mono-cipher text-muted-foreground truncate" style={{ fontSize: "10px" }}>
                {metric.detail}
              </div>
            </div>
            <div className="font-mono-cipher text-xs text-primary shrink-0">
              {metric.score === 0 ? "0% leak" : `${metric.score}%`}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Threat model */}
      <div className="px-6 py-4 border-t border-border bg-muted/20">
        <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-3">
          Threat Model
        </div>
        <div className="space-y-2">
          {[
            { threat: "Employer learns candidate salary", mitigated: true },
            { threat: "Candidate learns employer budget", mitigated: true },
            { threat: "Network observer sees plaintext", mitigated: true },
            { threat: "Rejection reveals mismatch reason", mitigated: true },
            { threat: "Admin can override privacy", mitigated: true },
          ].map(item => (
            <div key={item.threat} className="flex items-center gap-2">
              <span className="text-primary font-mono-cipher text-xs">✓</span>
              <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "11px" }}>
                {item.threat}
              </span>
              <span className="font-mono-cipher text-primary ml-auto" style={{ fontSize: "10px" }}>
                MITIGATED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
