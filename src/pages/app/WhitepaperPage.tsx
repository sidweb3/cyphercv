import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react";

const TOC = [
  { id: "abstract", label: "Abstract" },
  { id: "problem", label: "1. The Problem" },
  { id: "solution", label: "2. The Solution" },
  { id: "fhe", label: "3. FHE Primer" },
  { id: "protocol", label: "4. Protocol Design" },
  { id: "matching", label: "5. Matching Algorithm" },
  { id: "privacy", label: "6. Privacy Guarantees" },
  { id: "architecture", label: "7. Architecture" },
  { id: "tokenomics", label: "8. Incentive Model" },
  { id: "roadmap", label: "9. Roadmap" },
  { id: "conclusion", label: "10. Conclusion" },
];

function Section({ id, title, tag, children }: { id: string; title: string; tag?: string; children: React.ReactNode }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="space-y-6 pt-12 border-t border-border"
    >
      {tag && (
        <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">{tag}</div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground leading-relaxed text-sm max-w-3xl">{children}</p>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="border border-border bg-card">
      {label && (
        <div className="px-4 py-2 border-b border-border bg-muted flex items-center justify-between">
          <span className="font-mono-cipher text-xs text-muted-foreground">{label}</span>
          <span className="font-mono-cipher text-xs text-primary">Fhenix fhEVM</span>
        </div>
      )}
      <pre className="p-6 overflow-x-auto">
        <code className="font-mono-cipher text-xs leading-relaxed">
          {code.split("\n").map((line, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-muted-foreground select-none w-5 text-right shrink-0 opacity-30">{i + 1}</span>
              <span className={
                line.trim().startsWith("//") ? "text-muted-foreground opacity-60" :
                line.includes("euint") || line.includes("ebool") || line.includes("inEuint") ? "text-primary" :
                line.includes("FHE.") ? "text-primary" :
                line.includes("function") || line.includes("contract") || line.includes("mapping") ? "text-foreground" :
                "text-muted-foreground"
              }>{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function Callout({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warning" | "key" }) {
  const styles = {
    info: "border-border bg-muted/30",
    warning: "border-primary/40 bg-primary/5",
    key: "border-primary bg-primary/10",
  };
  return (
    <div className={`border p-4 ${styles[type]}`}>
      <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

const MATCH_ALGO = `// Encrypted salary overlap detection
function computeSalaryMatch(
    euint256 candidateMin,
    euint256 candidateMax,
    euint256 employerBudget
) internal pure returns (ebool) {
    // Budget must be >= candidate minimum
    ebool budgetSufficient = FHE.gte(employerBudget, candidateMin);
    // Budget must be <= candidate maximum (no overpay signal)
    ebool budgetAcceptable = FHE.lte(employerBudget, candidateMax);
    // Both conditions must hold — encrypted AND
    return FHE.and(budgetSufficient, budgetAcceptable);
}

// Experience gate
function computeExpMatch(
    euint256 candidateExp,
    euint256 requiredExp
) internal pure returns (ebool) {
    return FHE.gte(candidateExp, requiredExp);
}

// Full match — salary AND experience
function computeFullMatch(
    address candidate,
    address employer
) external view returns (ebool) {
    ebool salary = computeSalaryMatch(
        candidateSalaryMin[candidate],
        candidateSalaryMax[candidate],
        employerBudget[employer]
    );
    ebool exp = computeExpMatch(
        candidateExperience[candidate],
        employerMinExp[employer]
    );
    return FHE.and(salary, exp);
}`;

// Updated: FHE.decrypt() deprecated — now uses decryptForView (UI) or decryptForTx (on-chain)
const REVEAL_CODE = `// Mutual consent reveal — both parties must sign
// @cofhe/sdk: decryptForTx returns { decryptedValue, signature }
// for on-chain verification via FHE.publishDecryptResult()
function revealSalary(
    address candidate,
    address employer,
    uint256 ctHash,
    uint256 decryptedValue,
    bytes calldata signature
) external {
    // Verify both parties consented
    require(candidateConsented[candidate][employer], "No candidate consent");
    require(employerConsented[employer][candidate], "No employer consent");
    
    // Publish the decrypted result on-chain using Threshold Network signature
    // Client calls: client.decryptForTx(ctHash).withoutPermit().execute()
    // Returns: { decryptedValue, signature } — submitted here
    FHE.publishDecryptResult(ctHash, decryptedValue, signature);
    
    emit SalaryRevealed(candidate, employer, decryptedValue);
}

// Client-side (@cofhe/sdk) — decryptForView for UI display only
// const balance = await client
//   .decryptForView(ctHash, FheTypes.Uint64)
//   .execute();
//
// Client-side (@cofhe/sdk) — decryptForTx for on-chain publishing
// const { decryptedValue, signature } = await client
//   .decryptForTx(ctHash)
//   .withoutPermit()
//   .execute();
// await contract.revealSalary(candidate, employer, ctHash, decryptedValue, signature);`;

export default function WhitepaperPage() {
  const [activeSection, setActiveSection] = useState("abstract");
  const [tocOpen, setTocOpen] = useState(true);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  return (
    <AppLayout>
      <div className="flex min-h-full">
        {/* TOC Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
          <div className="px-4 py-5 border-b border-border">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Whitepaper</div>
            <div className="font-mono-cipher text-xs text-muted-foreground mt-1">v2.0 — Wave 2</div>
          </div>
          <nav className="py-4 px-2 space-y-0.5">
            {TOC.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-2 py-2 font-mono-cipher text-xs transition-all duration-100 ${
                  activeSection === item.id
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-4 border-t border-border">
            <div className="font-mono-cipher text-xs text-muted-foreground">
              Cipher CV Protocol<br />
              Fhenix Buildathon 2025
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 p-6 md:p-10 max-w-4xl space-y-0">
          {/* Header */}
          <div className="pb-12 space-y-4">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
              Technical Whitepaper — v2.1
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "Space Grotesk" }}>
              Cipher CV:<br />
              <span className="text-primary">Privacy-Preserving</span><br />
              Labor Market Protocol
            </h1>
            <div className="font-mono-cipher text-xs text-muted-foreground space-y-1">
              <div>Authors: Cipher CV Core Team</div>
              <div>Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}</div>
              <div>Network: Ethereum Sepolia Testnet (Chain ID: 11155111)</div>
              <div>Status: Wave 2 — @cofhe/sdk Migration · decryptForView / decryptForTx</div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {["FHE", "Privacy", "Labor Markets", "Fhenix", "fhEVM", "Encrypted Matching"].map(tag => (
                <span key={tag} className="font-mono-cipher text-xs border border-border px-2 py-1 text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Abstract */}
          <Section id="abstract" title="Abstract" tag="§ 00">
            <Callout type="key">
              Cipher CV introduces a cryptographically private labor market protocol built on Fhenix's fhEVM. Using Fully Homomorphic Encryption (FHE), the protocol enables salary matching between candidates and employers without either party revealing their compensation expectations to the other — or to the network. The result is a blind matching system where a match is confirmed or denied without exposing the underlying data that produced it.
            </Callout>
            <Para>
              Traditional hiring markets suffer from a fundamental information asymmetry: candidates must reveal salary history and expectations before knowing whether a role is financially viable, while employers broadcast budget ranges that anchor negotiations against candidates. This creates a market where the party with less information — typically the candidate — is systematically disadvantaged.
            </Para>
            <Para>
              Cipher CV resolves this by moving all sensitive computation on-chain using FHE operators. Salary ranges, experience levels, and skill vectors are encrypted client-side and submitted as ciphertext. The Fhenix fhEVM computes the intersection of these encrypted sets and returns an encrypted boolean — match or no match — without ever decrypting the inputs.
            </Para>
          </Section>

          {/* Problem */}
          <Section id="problem" title="1. The Problem with Transparent Labor Markets" tag="§ 01">
            <Para>
              The modern hiring process is structurally broken for candidates. Every touchpoint in the traditional pipeline requires candidates to expose sensitive information before receiving any value in return.
            </Para>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
              {[
                { issue: "Salary History Exposure", detail: "Candidates are asked to disclose prior compensation, anchoring all future negotiations to past underpayment." },
                { issue: "Asymmetric Information", detail: "Employers know their budget ceiling. Candidates must guess. The party with more information extracts more value." },
                { issue: "Rejection Without Reason", detail: "Candidates receive no signal from rejections. They cannot distinguish budget mismatch from skill mismatch." },
                { issue: "Identity Bias", detail: "Names, photos, and demographic signals are visible before any evaluation of merit occurs." },
                { issue: "Negotiation Leverage", detail: "Desperation signals — employment gaps, multiple applications — are visible to employers and exploited." },
                { issue: "Data Permanence", detail: "Salary history submitted to one employer is retained, shared, and used against candidates in future negotiations." },
              ].map((item, i) => (
                <div key={item.issue} className={`p-5 space-y-2 ${i % 2 === 0 ? "border-b md:border-b-0 md:border-r border-border" : "border-b border-border"} ${i >= 4 ? "border-b-0" : ""}`}>
                  <div className="font-mono-cipher text-xs text-primary">{item.issue}</div>
                  <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.detail}</div>
                </div>
              ))}
            </div>
            <Para>
              These are not edge cases. They are structural features of a market designed to extract maximum information from the party with less leverage. The solution is not better regulation — it is cryptographic enforcement of information boundaries.
            </Para>
          </Section>

          {/* Solution */}
          <Section id="solution" title="2. The Cipher CV Solution" tag="§ 02">
            <Para>
              Cipher CV replaces information disclosure with cryptographic commitment. Instead of revealing salary expectations, candidates submit an encrypted utility curve — a mathematical representation of their acceptable compensation range — to the Fhenix blockchain. Employers submit an encrypted constraint set representing their budget and requirements.
            </Para>
            <Para>
              The protocol then computes the intersection of these two encrypted sets using FHE operators. The result — a match or no-match signal — is returned as an encrypted boolean. Neither party learns anything about the other's inputs. A match confirms overlap exists. A rejection confirms it does not. Nothing more is revealed.
            </Para>
            <div className="border border-border p-6 space-y-4">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-2">Core Properties</div>
              {[
                { prop: "Zero-Knowledge Rejection", desc: "A rejection reveals no information about why the match failed. Budget mismatch and skill mismatch are indistinguishable." },
                { prop: "Mutual Consent Reveal", desc: "Salary figures are decrypted only when both parties explicitly consent. Neither can unilaterally reveal the other's data." },
                { prop: "Identity Separation", desc: "Candidate identity is decoupled from the matching process. Employers evaluate encrypted profiles, not names or photos." },
                { prop: "Cryptographic Enforcement", desc: "Privacy guarantees are enforced by mathematics, not policy. No administrator can override them." },
              ].map((item, i) => (
                <div key={item.prop} className="flex gap-4 items-start">
                  <span className="font-mono-cipher text-xs text-primary mt-0.5 shrink-0">—</span>
                  <div>
                    <div className="font-mono-cipher text-xs text-foreground mb-1">{item.prop}</div>
                    <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* FHE Primer */}
          <Section id="fhe" title="3. Fully Homomorphic Encryption — A Primer" tag="§ 03">
            <Para>
              Fully Homomorphic Encryption (FHE) is a class of encryption scheme that allows arbitrary computation to be performed on ciphertext without decrypting it. The result of the computation, when decrypted, is identical to the result that would have been obtained by performing the same computation on the plaintext.
            </Para>
            <Callout type="key">
              FHE.gte(encrypt(100000), encrypt(90000)) → encrypt(true)
              <br /><br />
              The comparison is performed entirely on ciphertext. Neither value is ever decrypted during computation. The result is an encrypted boolean that can only be decrypted by the authorized party.
            </Callout>
            <Para>
              Fhenix implements FHE on an EVM-compatible blockchain, exposing FHE operations as Solidity primitives. This allows smart contracts to perform encrypted arithmetic and comparison operations natively, without requiring off-chain computation or trusted execution environments.
            </Para>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
              {[
                { op: "FHE.add(a, b)", desc: "Homomorphic addition of two encrypted integers. Used for computing salary midpoints." },
                { op: "FHE.gte(a, b)", desc: "Encrypted greater-than-or-equal comparison. Core operator for salary overlap detection." },
                { op: "FHE.and(a, b)", desc: "Logical AND on encrypted booleans. Combines salary and experience match signals." },
                { op: "FHE.asEuint256(x)", desc: "Converts an inEuint256 input (submitted by client) to an on-chain encrypted integer." },
                { op: "decryptForView / decryptForTx", desc: "FHE.decrypt() deprecated (Apr 2026). Use decryptForView for UI display or decryptForTx to get a Threshold Network signature for FHE.publishDecryptResult() on-chain." },
                { op: "FHE.div(a, b)", desc: "Homomorphic division. Used to compute the encrypted salary midpoint for mutual reveal." },
              ].map((item, i) => (
                <div key={item.op} className={`p-4 space-y-2 ${i % 3 !== 2 ? "border-b md:border-b-0 md:border-r border-border" : ""} ${i < 3 ? "border-b border-border" : ""}`}>
                  <div className="font-mono-cipher text-xs text-primary">{item.op}</div>
                  <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Protocol Design */}
          <Section id="protocol" title="4. Protocol Design" tag="§ 04">
            <Para>
              The Cipher CV protocol consists of five distinct phases, each with clearly defined information boundaries. At no phase does any party gain access to information they are not entitled to.
            </Para>
            <div className="border border-border">
              {[
                {
                  phase: "01",
                  name: "Profile Encryption",
                  actor: "Candidate / Employer",
                  desc: "The client-side @cofhe/sdk (successor to cofhejs) encrypts all sensitive inputs — salary range, experience, skill vectors — before any network transmission using encryptInputs([...]).execute(). The encrypted values are submitted to the Fhenix smart contract as inEuint256 types.",
                  guarantee: "No plaintext leaves the browser.",
                },
                {
                  phase: "02",
                  name: "On-Chain Commitment",
                  actor: "Fhenix fhEVM",
                  desc: "Encrypted profiles are stored on-chain as euint256 state variables. The contract address and transaction hash serve as a cryptographic commitment to the submitted values without revealing them.",
                  guarantee: "Immutable, verifiable commitment without disclosure.",
                },
                {
                  phase: "03",
                  name: "Blind Matching",
                  actor: "Smart Contract",
                  desc: "The matching function computes FHE.gte and FHE.and operations on the encrypted profiles. The result is an encrypted boolean stored on-chain. Neither party can read the result until they are authorized to decrypt it.",
                  guarantee: "Match computed without decrypting inputs.",
                },
                {
                  phase: "04",
                  name: "Result Notification",
                  actor: "Protocol",
                  desc: "Both parties receive a notification that a match result exists. The notification contains no information about the match score or salary — only that a result is available for authorized decryption.",
                  guarantee: "Existence of result revealed; content remains encrypted.",
                },
                {
                  phase: "05",
                  name: "Mutual Consent Reveal",
                  actor: "Both Parties",
                  desc: "Both parties must sign a consent transaction to decrypt the match result. The decrypted output contains only the suggested salary midpoint — not the full range of either party. Identity is revealed only if both parties explicitly consent to a second reveal.",
                  guarantee: "Salary revealed only with bilateral consent.",
                },
              ].map((phase, i) => (
                <div key={phase.phase} className={`p-6 grid grid-cols-1 md:grid-cols-4 gap-4 ${i < 4 ? "border-b border-border" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="font-mono-cipher text-2xl font-bold text-muted-foreground opacity-20">{phase.phase}</span>
                    <div>
                      <div className="font-bold text-sm text-foreground" style={{ fontFamily: "Space Grotesk" }}>{phase.name}</div>
                      <div className="font-mono-cipher text-xs text-primary mt-0.5">{phase.actor}</div>
                    </div>
                  </div>
                  <div className="md:col-span-2 font-mono-cipher text-xs text-muted-foreground leading-relaxed">{phase.desc}</div>
                  <div className="font-mono-cipher text-xs text-muted-foreground border border-border p-2 h-fit">
                    <span className="text-primary">✓ </span>{phase.guarantee}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Matching Algorithm */}
          <Section id="matching" title="5. The Matching Algorithm" tag="§ 05">
            <Para>
              The core matching algorithm computes salary overlap and experience compatibility using FHE comparison operators. The algorithm is designed to be minimal — it reveals only whether a match exists, not the degree of overlap or the distance between the parties' positions.
            </Para>
            <CodeBlock code={MATCH_ALGO} label="CipherCV.sol — matchingAlgorithm()" />
            <Para>
              The salary overlap condition requires that the employer's budget falls within the candidate's acceptable range — not merely that it exceeds the minimum. This prevents employers from using a high budget to match with candidates who would accept significantly less, preserving the candidate's negotiating position.
            </Para>
            <Para>
              The mutual consent reveal mechanism computes only the midpoint of the overlap — not the full range of either party. This ensures that even after consent, neither party learns the other's absolute position.
            </Para>
            <CodeBlock code={REVEAL_CODE} label="CipherCV.sol — revealSalary()" />
          </Section>

          {/* Privacy Guarantees */}
          <Section id="privacy" title="6. Privacy Guarantees" tag="§ 06">
            <Para>
              Cipher CV provides the following privacy guarantees, enforced cryptographically by the Fhenix fhEVM. These are not policy commitments — they are mathematical properties of the protocol.
            </Para>
            <div className="space-y-3">
              {[
                {
                  guarantee: "Input Confidentiality",
                  formal: "∀ adversary A: Pr[A learns plaintext(input)] = negligible",
                  desc: "No party — including the protocol operator, the Fhenix validators, or the counterparty — can learn the plaintext value of any submitted input. Inputs are encrypted before submission and never decrypted during computation.",
                },
                {
                  guarantee: "Output Minimality",
                  formal: "Output ∈ {match, no-match} — no additional information",
                  desc: "The matching function returns only a binary result. No score, no distance metric, no partial match signal. A rejection reveals nothing about why the match failed.",
                },
                {
                  guarantee: "Bilateral Consent Requirement",
                  formal: "decrypt(salary) requires sig(candidate) ∧ sig(employer)",
                  desc: "Salary figures cannot be decrypted unilaterally. Both parties must sign a consent transaction. Neither party can force a reveal without the other's cooperation.",
                },
                {
                  guarantee: "Identity Separation",
                  formal: "match(profile_A, profile_B) ⊥ identity(A) ∧ identity(B)",
                  desc: "The matching computation is performed on encrypted profiles that contain no identity information. Names, addresses, and demographic signals are not part of the matching input.",
                },
                {
                  guarantee: "Forward Secrecy",
                  formal: "compromise(key_t) ⇏ decrypt(ciphertext_{t-1})",
                  desc: "Compromise of a future key does not enable decryption of past submissions. Each profile submission uses a fresh encryption key derived from the client's wallet.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.guarantee}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="border border-border p-5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-bold text-sm text-foreground" style={{ fontFamily: "Space Grotesk" }}>{item.guarantee}</div>
                    <div className="font-mono-cipher text-xs text-primary shrink-0">{item.formal}</div>
                  </div>
                  <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Architecture */}
          <Section id="architecture" title="7. System Architecture" tag="§ 07">
            <Para>
              Cipher CV is a three-layer system: a client layer that handles encryption, a protocol layer that handles computation, and a storage layer that handles state. Each layer has a clearly defined trust boundary.
            </Para>
            <div className="border border-border">
              {[
                {
                  layer: "Client Layer",
                  components: ["React Frontend", "CoFHE SDK", "Wallet Integration (RainbowKit + wagmi)"],
                  trust: "Trusted by user",
                  desc: "The client layer is responsible for encrypting all sensitive inputs before transmission. The CoFHE SDK generates encryption keys from the user's wallet signature, ensuring that only the wallet owner can decrypt their own data. No plaintext is transmitted over the network.",
                },
                {
                  layer: "Protocol Layer",
                  components: ["Fhenix fhEVM", "CipherCV.sol", "FHE Operators"],
                  trust: "Trustless",
                  desc: "The protocol layer executes matching logic on encrypted data. Smart contracts are immutable and publicly verifiable. The Fhenix fhEVM provides FHE primitives as EVM opcodes, enabling encrypted computation without trusted execution environments.",
                },
                {
                  layer: "Storage Layer",
                  components: ["On-chain euint256 state", "Encrypted profile registry", "Match result store"],
                  trust: "Trustless",
                  desc: "All state is stored on-chain as encrypted integers. The storage layer is append-only — submitted profiles cannot be modified or deleted. Match results are stored as encrypted booleans until both parties consent to decryption.",
                },
              ].map((layer, i) => (
                <div key={layer.layer} className={`p-6 space-y-4 ${i < 2 ? "border-b border-border" : ""}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>{layer.layer}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {layer.components.map(c => (
                          <span key={c} className="font-mono-cipher text-xs border border-border px-2 py-0.5 text-muted-foreground">{c}</span>
                        ))}
                      </div>
                    </div>
                    <span className={`font-mono-cipher text-xs px-2 py-1 border shrink-0 ${layer.trust === "Trustless" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                      {layer.trust}
                    </span>
                  </div>
                  <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{layer.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Incentive Model */}
          <Section id="tokenomics" title="8. Incentive Model" tag="§ 08">
            <Para>
              Cipher CV does not require a native token for Wave 1. The protocol operates on Fhenix's native gas token for transaction fees. The incentive model is designed to align the interests of candidates, employers, and the protocol.
            </Para>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
              {[
                {
                  actor: "Candidates",
                  incentive: "Privacy-preserving job search",
                  mechanism: "Submit encrypted profiles at zero cost. Pay gas only for on-chain commitment. Receive match notifications without revealing identity.",
                  alignment: "Candidates benefit from privacy — they have no incentive to submit false data, as false data reduces match quality.",
                },
                {
                  actor: "Employers",
                  incentive: "Higher-quality candidate pool",
                  mechanism: "Post encrypted job specs. Pay gas for on-chain commitment. Access a candidate pool that includes high-value candidates who would not participate in transparent markets.",
                  alignment: "Employers benefit from access to candidates who opt out of traditional markets due to privacy concerns.",
                },
                {
                  actor: "Protocol",
                  incentive: "Network effects",
                  mechanism: "Wave 2 introduces a protocol fee on successful matches — a small percentage of the agreed salary, paid by the employer upon mutual consent reveal. This aligns protocol revenue with successful outcomes.",
                  alignment: "Protocol revenue is tied to match quality, not volume. Incentivizes accurate matching over maximizing throughput.",
                },
              ].map((item, i) => (
                <div key={item.actor} className={`p-6 space-y-3 ${i < 2 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}>
                  <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">{item.actor}</div>
                  <div className="font-bold text-sm text-foreground" style={{ fontFamily: "Space Grotesk" }}>{item.incentive}</div>
                  <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.mechanism}</div>
                  <div className="border-t border-border pt-3 font-mono-cipher text-xs text-muted-foreground">
                    <span className="text-primary">Alignment: </span>{item.alignment}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Roadmap */}
          <Section id="roadmap" title="9. Roadmap" tag="§ 09">
            <div className="border border-border">
              {[
                {
                  wave: "Wave 1",
                  status: "Active",
                  title: "Frontend + Demo Layer",
                  items: [
                    "React frontend with Swiss Brutalist Privacy design system",
                    "Simulated FHE matching with visual encrypted computation",
                    "RainbowKit + wagmi wallet integration",
                    "Ethereum Sepolia Testnet connection",
                    "Candidate and Employer dashboard shells",
                    "Interactive demo with preset match scenarios",
                  ],
                },
                {
                  wave: "Wave 2",
                  status: "Active",
                  title: "Smart Contract Layer",
                  items: [
                    "CipherCV.sol deployment on Ethereum Sepolia Testnet",
                    "CoFHE SDK integration for client-side encryption",
                    "On-chain profile submission and storage",
                    "Blind matching computation via FHE operators",
                    "Mutual consent reveal mechanism",
                    "Match result notification system",
                  ],
                },
                {
                  wave: "Wave 3",
                  status: "Planned",
                  title: "Production Layer",
                  items: [
                    "Fhenix Mainnet deployment",
                    "Skill vector encryption and matching",
                    "Identity verification with zero-knowledge proofs",
                    "Protocol fee mechanism",
                    "Employer reputation system (encrypted)",
                    "Multi-party matching for team composition",
                  ],
                },
              ].map((wave, i) => (
                <div key={wave.wave} className={`p-6 grid grid-cols-1 md:grid-cols-4 gap-6 ${i < 2 ? "border-b border-border" : ""}`}>
                  <div className="space-y-2">
                    <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">{wave.wave}</div>
                    <div className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>{wave.title}</div>
                    <span className={`font-mono-cipher text-xs px-2 py-1 border inline-block ${
                      wave.status === "Active" ? "border-primary text-primary" :
                      wave.status === "Deploying" ? "border-muted-foreground text-muted-foreground" :
                      "border-border text-muted-foreground"
                    }`}>{wave.status}</span>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    {wave.items.map(item => (
                      <div key={item} className="flex items-start gap-2">
                        <span className={`font-mono-cipher text-xs mt-0.5 shrink-0 ${wave.status === "Active" ? "text-primary" : "text-muted-foreground"}`}>
                          {wave.status === "Active" ? "✓" : "—"}
                        </span>
                        <span className="font-mono-cipher text-xs text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Conclusion */}
          <Section id="conclusion" title="10. Conclusion" tag="§ 10">
            <Para>
              The labor market is an information market. The party that controls information controls outcomes. For decades, that party has been the employer. Cipher CV inverts this dynamic — not through regulation or policy, but through cryptographic enforcement of information boundaries.
            </Para>
            <Para>
              By building on Fhenix's fhEVM, Cipher CV achieves something that was previously impossible: a matching system that can confirm compatibility without learning the inputs that produced the match. This is not a privacy feature — it is the core mechanism of the protocol. Privacy is not added on top; it is the foundation.
            </Para>
            <Callout type="key">
              The encrypted labor market is not a niche product for privacy advocates. It is the correct design for any market where information asymmetry produces systematically unfair outcomes. Cipher CV is the first implementation of this design on a production-grade FHE blockchain.
            </Callout>
            <Para>
              Wave 1 demonstrates the user experience and interaction model. Wave 2 deploys the cryptographic infrastructure. Wave 3 scales to production. The protocol is designed to be composable — any application that requires privacy-preserving matching can build on the Cipher CV protocol layer.
            </Para>
            <div className="border border-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {[
                { label: "Fhenix Documentation", href: "https://docs.fhenix.zone", desc: "fhEVM developer docs and CoFHE SDK" },
                { label: "Sepolia Testnet", href: "https://sepolia.etherscan.io", desc: "Ethereum Sepolia — Chain ID 11155111" },
                { label: "FHE Research", href: "https://fhenix.io/whitepaper", desc: "Foundational FHE on EVM research" },
              ].map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="group space-y-1">
                  <div className="font-mono-cipher text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    {link.label} <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="font-mono-cipher text-xs text-muted-foreground">{link.desc}</div>
                </a>
              ))}
            </div>
          </Section>

          {/* Footer */}
          <div className="pt-12 pb-6 border-t border-border mt-12">
            <div className="font-mono-cipher text-xs text-muted-foreground space-y-1">
              <div>Cipher CV Protocol — Technical Whitepaper v2.0</div>
              <div>Fhenix Privacy-by-Design Buildathon — Wave 2 — {new Date().getFullYear()}</div>
              <div className="text-primary mt-2">All cryptographic guarantees are enforced by the Fhenix fhEVM. Privacy is not a policy — it is a mathematical property.</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}