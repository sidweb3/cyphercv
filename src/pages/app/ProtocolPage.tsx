import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { ExternalLink } from "lucide-react";

const CONTRACT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhenixprotocol/contracts/FHE.sol";

contract CipherCV {
    // Encrypted candidate profiles
    mapping(address => euint256) private candidateSalaryMin;
    mapping(address => euint256) private candidateSalaryMax;
    mapping(address => euint256) private candidateExperience;
    
    // Encrypted employer constraints
    mapping(address => euint256) private employerBudget;
    mapping(address => euint256) private employerMinExp;
    
    // Submit encrypted candidate profile
    function submitCandidateProfile(
        inEuint256 calldata _salaryMin,
        inEuint256 calldata _salaryMax,
        inEuint256 calldata _experience
    ) external {
        candidateSalaryMin[msg.sender] = FHE.asEuint256(_salaryMin);
        candidateSalaryMax[msg.sender] = FHE.asEuint256(_salaryMax);
        candidateExperience[msg.sender] = FHE.asEuint256(_experience);
    }
    
    // Compute blind match — no plaintext ever exposed
    function computeMatch(
        address candidate,
        address employer
    ) external view returns (ebool) {
        euint256 cMin = candidateSalaryMin[candidate];
        euint256 cMax = candidateSalaryMax[candidate];
        euint256 budget = employerBudget[employer];
        euint256 minExp = employerMinExp[employer];
        euint256 exp = candidateExperience[candidate];
        
        // Encrypted comparison — FHE operators
        ebool salaryMatch = FHE.and(
            FHE.gte(budget, cMin),
            FHE.lte(budget, cMax)
        );
        ebool expMatch = FHE.gte(exp, minExp);
        
        return FHE.and(salaryMatch, expMatch);
    }
}`;

const ARCHITECTURE_LAYERS = [
  {
    layer: "01",
    name: "Client Layer",
    tech: "React + CoFHE SDK",
    desc: "Encrypts all sensitive inputs client-side using Fhenix's CoFHE SDK before any network transmission. Zero plaintext leaves the browser.",
    status: "Wave 1 — Live",
  },
  {
    layer: "02",
    name: "Protocol Layer",
    tech: "Fhenix fhEVM",
    desc: "Fully Homomorphic Encryption virtual machine. Executes arithmetic and comparison operations on encrypted integers without decryption.",
    status: "Wave 2 — Deploying",
  },
  {
    layer: "03",
    name: "Storage Layer",
    tech: "Encrypted State",
    desc: "All on-chain state stored as euint256 types. Salary ranges, experience, and skill vectors are never stored in plaintext.",
    status: "Wave 2 — Deploying",
  },
  {
    layer: "04",
    name: "Matching Layer",
    tech: "FHE.gte / FHE.and",
    desc: "Blind comparison operators compute salary overlap and experience matching without revealing either party's constraints.",
    status: "Wave 2 — Deploying",
  },
  {
    layer: "05",
    name: "Reveal Layer",
    tech: "Mutual Consent Decrypt",
    desc: "Salary figures are decrypted only upon mutual consent from both parties. Rejection reveals zero information.",
    status: "Wave 2 — Deploying",
  },
];

const FHE_CONCEPTS = [
  {
    term: "euint256",
    definition: "Encrypted unsigned 256-bit integer. Stores salary, experience, and skill vectors in ciphertext form on-chain.",
  },
  {
    term: "ebool",
    definition: "Encrypted boolean. The result of FHE comparisons — match/no-match — without revealing the underlying values.",
  },
  {
    term: "FHE.gte()",
    definition: "Homomorphic greater-than-or-equal comparison. Computes salary overlap without decrypting either party's range.",
  },
  {
    term: "inEuint256",
    definition: "Input type for encrypted integers. Candidates submit their salary range as ciphertext — never plaintext.",
  },
  {
    term: "CoFHE SDK",
    definition: "Client-side encryption library. Encrypts inputs in the browser before transmission to the Fhenix network.",
  },
  {
    term: "Blind Match",
    definition: "A match result computed entirely on encrypted data. The protocol knows a match exists without knowing why.",
  },
];

export default function ProtocolPage() {
  const codeRef = useRef(null);
  const codeInView = useInView(codeRef, { once: true });
  const archRef = useRef(null);
  const archInView = useInView(archRef, { once: true });

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            Protocol Explorer
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Technical Architecture
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Cipher CV is built on Fhenix's fhEVM — the first EVM-compatible blockchain with native Fully Homomorphic Encryption. Smart contracts compute on encrypted data without ever decrypting it.
          </p>
        </div>

        {/* Status banner */}
        <div className="border border-primary p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="font-mono-cipher text-xs text-primary">
            ▋ Wave 1 Active — Frontend + Demo Layer
          </div>
          <div className="font-mono-cipher text-xs text-muted-foreground">
            Smart contracts deploying Wave 2 · Fhenix Frontier Testnet
          </div>
          <a
            href="https://docs.fhenix.zone"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Fhenix Docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Architecture layers */}
        <div ref={archRef} className="space-y-4">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-6">
            System Architecture
          </div>
          <div className="border border-border">
            {ARCHITECTURE_LAYERS.map((layer, i) => (
              <motion.div
                key={layer.layer}
                initial={{ opacity: 0, x: -20 }}
                animate={archInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-6 ${
                  i < ARCHITECTURE_LAYERS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono-cipher text-2xl font-bold text-muted-foreground opacity-30">
                    {layer.layer}
                  </span>
                  <div>
                    <div className="font-bold text-foreground text-sm" style={{ fontFamily: "Space Grotesk" }}>
                      {layer.name}
                    </div>
                    <div className="font-mono-cipher text-xs text-primary mt-0.5">{layer.tech}</div>
                  </div>
                </div>
                <div className="md:col-span-2 font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                  {layer.desc}
                </div>
                <div className="flex items-start justify-end">
                  <span className={`font-mono-cipher text-xs px-2 py-1 border ${
                    layer.status.includes("Live")
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  }`}>
                    {layer.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Smart contract code */}
        <div ref={codeRef} className="space-y-4">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
            Smart Contract Preview — Wave 2
          </div>
          <div className="border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
              <span className="font-mono-cipher text-xs text-muted-foreground">CipherCV.sol</span>
              <div className="flex items-center gap-3">
                <span className="font-mono-cipher text-xs text-primary">Solidity 0.8.24</span>
                <span className="font-mono-cipher text-xs text-muted-foreground">Fhenix fhEVM</span>
              </div>
            </div>
            <motion.pre
              initial={{ opacity: 0 }}
              animate={codeInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
              className="p-6 overflow-x-auto"
            >
              <code className="font-mono-cipher text-xs leading-relaxed">
                {CONTRACT_CODE.split("\n").map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-muted-foreground select-none w-6 text-right shrink-0 opacity-40">
                      {i + 1}
                    </span>
                    <span
                      className={
                        line.trim().startsWith("//")
                          ? "text-muted-foreground opacity-60"
                          : line.includes("euint256") || line.includes("ebool") || line.includes("inEuint256")
                          ? "text-primary"
                          : line.includes("function") || line.includes("contract") || line.includes("mapping")
                          ? "text-foreground"
                          : line.includes("FHE.")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {line || " "}
                    </span>
                  </div>
                ))}
              </code>
            </motion.pre>
          </div>
        </div>

        {/* FHE Glossary */}
        <div className="space-y-4">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
            FHE Primitives
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
            {FHE_CONCEPTS.map((concept, i) => (
              <motion.div
                key={concept.term}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-6 space-y-2 ${
                  i % 2 === 0 ? "border-b md:border-b-0 md:border-r border-border" : "border-b border-border"
                } ${i >= FHE_CONCEPTS.length - 2 ? "border-b-0" : ""}`}
              >
                <div className="font-mono-cipher text-sm text-primary">{concept.term}</div>
                <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                  {concept.definition}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="border border-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Fhenix Documentation",
              desc: "Full fhEVM developer docs, CoFHE SDK, and testnet guides",
              href: "https://docs.fhenix.zone",
            },
            {
              label: "Fhenix Testnet",
              desc: "Connect to Frontier Testnet — Chain ID 8008135",
              href: "https://fhenix.io",
            },
            {
              label: "FHE Whitepaper",
              desc: "Technical overview of Fully Homomorphic Encryption on EVM",
              href: "https://fhenix.io/whitepaper",
            },
          ].map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="space-y-1 group"
            >
              <div className="font-mono-cipher text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                {link.label} <ExternalLink className="w-3 h-3" />
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground">{link.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
