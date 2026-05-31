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
    <AppLayout publicAccess>
      <div className="flex min-h-full">
        {/* TOC Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
          <div className="px-4 py-5 border-b border-border">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Whitepaper</div>
            <div className="font-mono-cipher text-xs text-muted-foreground mt-1">Production — Live</div>
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
              Fhenix Privacy-by-Design
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 p-6 md:p-10 max-w-4xl space-y-0">
          {/* Header */}
          <div className="pb-12 space-y-4">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
              Technical Whitepaper — Production
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "Space Grotesk" }}>
              Cipher CV:<br />
              <span className="text-primary">Privacy-Preserving</span><br />
              Labor Market Protocol
            </h1>
            <div className="font-mono-cipher text-xs text-muted-foreground space-y-1">
              <div>Authors: Cipher CV Core Team</div>
              <div>Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}</div>
              <div>Primary Network: Arbitrum Sepolia (Chain ID: 421614)</div>
              <div>Also Deployed: Ethereum Sepolia (Chain ID: 11155111)</div>
              <div>Status: Live — 8 Contracts Deployed · Convex Backend Active · SDK Available</div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {["FHE", "Privacy", "Labor Markets", "Fhenix", "fhEVM", "Encrypted Matching", "Arbitrum", "CoFHE"].map(tag => (
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
              Cipher CV resolves this by moving all sensitive computation on-chain using FHE operators. Salary ranges, experience levels, and skill vectors are encrypted client-side using the @cofhe/sdk and submitted as ciphertext. The Fhenix fhEVM computes the intersection of these encrypted sets and returns an encrypted boolean — match or no match — without ever decrypting the inputs. Eight smart contracts are live on Arbitrum Sepolia, with a Convex real-time backend handling off-chain state, notifications, and match coordination.
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
                { prop: "Stealth Mode", desc: "Candidates can add their current employer's domain to an encrypted blocklist. The employer is mathematically invisible to the search." },
                { prop: "Counter-Offer Privacy", desc: "Market benchmarks and leverage scores are computed on encrypted data via FHE.select() and returned as sealed output." },
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
              Fhenix implements FHE on an EVM-compatible blockchain, exposing FHE operations as Solidity primitives. This allows smart contracts to perform encrypted arithmetic and comparison operations natively, without requiring off-chain computation or trusted execution environments. The @cofhe/sdk (CoFHE) handles client-side encryption, with the Threshold Network providing decryption services.
            </Para>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
              {[
                { op: "FHE.add(a, b)", desc: "Homomorphic addition of two encrypted integers. Used for computing salary midpoints and aggregate statistics." },
                { op: "FHE.gte(a, b)", desc: "Encrypted greater-than-or-equal comparison. Core operator for salary overlap detection." },
                { op: "FHE.and(a, b)", desc: "Logical AND on encrypted booleans. Combines salary and experience match signals." },
                { op: "FHE.asEuint32(x)", desc: "Converts an inEuint32 input (submitted by client via @cofhe/sdk) to an on-chain encrypted integer." },
                { op: "FHE.select(cond, a, b)", desc: "Encrypted conditional (ternary). Used in CipherCounterOffer to compute leverage scores without branching on plaintext." },
                { op: "FHE.sealoutput(x, pk)", desc: "Re-encrypts a ciphertext for a specific public key. Used in CipherVault and CipherCounterOffer for private sealed viewing." },
                { op: "decryptForView()", desc: "@cofhe/sdk method for UI display. Returns plaintext to the authorized viewer without publishing on-chain." },
                { op: "decryptForTx()", desc: "@cofhe/sdk method that returns a Threshold Network signature for FHE.publishDecryptResult() on-chain." },
                { op: "FHE.publishDecryptResult()", desc: "On-chain method to publish a decrypted value with Threshold Network signature. Used in mutual consent reveal." },
              ].map((item, i) => (
                <div key={item.op} className={`p-4 space-y-2 ${i % 3 !== 2 ? "border-b md:border-b-0 md:border-r border-border" : ""} ${i < 6 ? "border-b border-border" : ""}`}>
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
                  desc: "The client-side @cofhe/sdk encrypts all sensitive inputs — salary range, experience, skill vectors — before any network transmission. The encrypted values (inEuint32) are submitted to the Fhenix blockchain. Plaintext never leaves the browser.",
                },
                {
                  phase: "02",
                  name: "On-Chain Storage",
                  actor: "CipherCV Contract",
                  desc: "The CipherCV contract receives inEuint32 inputs and converts them to euint32 via FHE.asEuint32(). These encrypted values are stored in on-chain mappings. No plaintext is ever stored — only ciphertext.",
                },
                {
                  phase: "03",
                  name: "Blind Matching",
                  actor: "CipherCV Contract",
                  desc: "computeMatch() runs FHE.gte() and FHE.and() on the encrypted inputs. The result is an ebool — an encrypted boolean. Neither party's salary range or experience level is revealed. The match result is stored as ciphertext.",
                },
                {
                  phase: "04",
                  name: "Consent Signing",
                  actor: "Candidate + Employer",
                  desc: "Both parties must sign a consent transaction to initiate reveal. candidateConsent() and employerConsent() are called separately. Neither party can unilaterally reveal the other's data.",
                },
                {
                  phase: "05",
                  name: "Salary Reveal",
                  actor: "Threshold Network + Both Parties",
                  desc: "Upon mutual consent, the client calls decryptForTx() to obtain a Threshold Network signature. FHE.publishDecryptResult() is called on-chain with the decrypted value and signature. The suggested salary midpoint is revealed — and nothing else.",
                },
              ].map((phase, i) => (
                <div key={phase.phase} className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-6 ${i < 4 ? "border-b border-border" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="font-mono-cipher text-2xl font-bold text-muted-foreground opacity-20">{phase.phase}</span>
                    <div>
                      <div className="font-bold text-foreground text-sm" style={{ fontFamily: "Space Grotesk" }}>{phase.name}</div>
                      <div className="font-mono-cipher text-xs text-primary mt-0.5">{phase.actor}</div>
                    </div>
                  </div>
                  <div className="md:col-span-3 font-mono-cipher text-xs text-muted-foreground leading-relaxed">{phase.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Matching Algorithm */}
          <Section id="matching" title="5. Matching Algorithm" tag="§ 05">
            <Para>
              The core matching algorithm is implemented in CipherCV.sol. It takes encrypted salary ranges and experience levels from both parties and computes compatibility using FHE operators. The algorithm is deterministic, non-interactive, and produces no side-channel information.
            </Para>
            <CodeBlock code={MATCH_ALGO} label="CipherCV.sol — computeMatch()" />
            <Para>
              The algorithm has three key properties. First, it is symmetric: the same computation is performed regardless of which party initiates the match. Second, it is non-interactive: neither party needs to be online during computation. Third, it is zero-knowledge: a rejection reveals no information about the magnitude of the mismatch.
            </Para>
            <Callout type="info">
              The matching algorithm currently operates on salary range and experience. Skill vector matching is implemented via CipherBatchMatcher, which supports up to 50 candidate × employer pairs per transaction using a tournament-style matching algorithm.
            </Callout>
          </Section>

          {/* Privacy Guarantees */}
          <Section id="privacy" title="6. Privacy Guarantees" tag="§ 06">
            <Para>
              The privacy guarantees of Cipher CV are derived from the mathematical properties of FHE, not from policy or trust assumptions. The following guarantees hold unconditionally, assuming the security of the underlying FHE scheme.
            </Para>
            <div className="space-y-4">
              {[
                {
                  guarantee: "Input Privacy",
                  formal: "∀ adversary A: Pr[A learns plaintext(input)] = negligible",
                  desc: "No party — including the Fhenix validators, the Cipher CV team, or any on-chain observer — can learn the plaintext value of any encrypted input. This holds even if the adversary controls all parties except the input owner.",
                },
                {
                  guarantee: "Output Privacy",
                  formal: "match(a, b) = ebool — decryptable only by authorized party",
                  desc: "The match result is an encrypted boolean. It can only be decrypted by the party holding the corresponding decryption key. An on-chain observer can see that a match computation occurred, but not whether it produced true or false.",
                },
                {
                  guarantee: "Rejection Privacy",
                  formal: "reject(a, b) reveals 0 bits about a or b",
                  desc: "A rejection reveals no information about why the match failed. An adversary cannot distinguish a salary mismatch from an experience mismatch from a skill mismatch. All rejections are cryptographically identical.",
                },
                {
                  guarantee: "Reveal Atomicity",
                  formal: "reveal(a, b) requires consent(a) ∧ consent(b)",
                  desc: "Salary reveal requires both parties to sign consent transactions. Neither party can unilaterally reveal the other's data. The consent requirement is enforced by the smart contract, not by policy.",
                },
                {
                  guarantee: "Stealth Indistinguishability",
                  formal: "blocklist(domain) is computationally indistinguishable from ∅",
                  desc: "An employer on the blocklist cannot distinguish between 'I am blocked' and 'there are no matching candidates'. The blocklist is stored as an encrypted hash — the employer cannot determine whether they are blocked.",
                },
              ].map((item, i) => (
                <div key={item.guarantee} className="border border-border p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-bold text-foreground text-sm" style={{ fontFamily: "Space Grotesk" }}>{item.guarantee}</div>
                    <div className="font-mono-cipher text-xs text-primary border border-primary/30 px-2 py-1 shrink-0">{item.formal}</div>
                  </div>
                  <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Architecture */}
          <Section id="architecture" title="7. System Architecture" tag="§ 07">
            <Para>
              Cipher CV is composed of three layers: a client layer (React + @cofhe/sdk), a protocol layer (Fhenix fhEVM + 8 smart contracts), and a coordination layer (Convex real-time backend). Each layer has clearly defined responsibilities and information boundaries.
            </Para>
            <div className="border border-border">
              {[
                {
                  contract: "CipherRegistry",
                  address: "0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79",
                  desc: "Protocol address registry. Single source of truth for all deployed contract addresses. Supports upgrades, pausing, and admin transfer.",
                },
                {
                  contract: "CipherCV",
                  address: "0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659",
                  desc: "Core FHE matching engine. Candidates and employers submit encrypted profiles. Compatibility computed on ciphertext via FHE.gte() and FHE.and(). Mutual consent reveal via FHE.publishDecryptResult().",
                },
                {
                  contract: "CipherVault",
                  address: "0xeff0835318a9e6812150519321B3097Db685A361",
                  desc: "Encrypted credential vault. Multi-credential storage with versioning, revocation, sealed output via FHE.sealoutput(), and access logging.",
                },
                {
                  contract: "CipherGovernance",
                  address: "0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707",
                  desc: "On-chain governance with encrypted vote weights. Proposals, encrypted tallying, quorum enforcement, timelock, and parameter execution.",
                },
                {
                  contract: "CipherEscrow",
                  address: "0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6",
                  desc: "Interview Insurance escrow. ETH premium with FHE-gated release. Auto-refund if interview target not met. Protocol fee on completion.",
                },
                {
                  contract: "CipherCounterOffer",
                  address: "0xac95Fd56a9a18A5424370528a40035F47277A13d",
                  desc: "Counter-offer calculator. Encrypted salary vs market benchmarks. Leverage score computation via FHE.select(). Sealed output for private viewing.",
                },
                {
                  contract: "CipherStealth",
                  address: "0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91",
                  desc: "Stealth mode employer blocklist. Encrypted blocklist/allowlist. Time-locked profiles. Domain-level blocking. Full stealth mode toggle.",
                },
                {
                  contract: "CipherBatchMatcher",
                  address: "0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b",
                  desc: "Batch tournament matching. Up to 50 candidate × employer pairs per transaction. Tournament mode for N×M matching. Gas-optimized.",
                },
              ].map((c, i) => (
                <div key={c.contract} className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-5 ${i < 7 ? "border-b border-border" : ""} hover:bg-secondary/10 transition-colors`}>
                  <div>
                    <div className="font-bold text-foreground text-sm" style={{ fontFamily: "Space Grotesk" }}>{c.contract}</div>
                    <a
                      href={`https://sepolia.arbiscan.io/address/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono-cipher text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {c.address.slice(0, 10)}...{c.address.slice(-6)}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="md:col-span-3 font-mono-cipher text-xs text-muted-foreground leading-relaxed">{c.desc}</div>
                </div>
              ))}
            </div>
            <Para>
              The Convex backend stores hash commitments, match state, notifications, governance proposals, vault credentials, and token balances. It never stores plaintext salary or experience values — only keccak256 commitments that are safe to store off-chain.
            </Para>
            <CodeBlock code={REVEAL_CODE} label="CipherCV.sol — revealSalary() + @cofhe/sdk client" />
          </Section>

          {/* Tokenomics */}
          <Section id="tokenomics" title="8. Incentive Model" tag="§ 08">
            <Para>
              The Cipher CV protocol uses a CIPHER token to align incentives between candidates, employers, and protocol contributors. Token holders participate in governance, earn rewards for protocol participation, and stake tokens to increase voting weight.
            </Para>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
              {[
                {
                  mechanism: "Participation Rewards",
                  desc: "Candidates and employers earn CIPHER tokens for submitting encrypted profiles, running matches, and signing consent transactions. Rewards are proportional to protocol activity.",
                },
                {
                  mechanism: "Governance Staking",
                  desc: "Token holders stake CIPHER to participate in governance. Staked tokens increase voting weight. Proposals require a minimum quorum of staked tokens to pass.",
                },
                {
                  mechanism: "Referral Program",
                  desc: "Existing users earn CIPHER tokens for referring new candidates and employers. Referral rewards are tracked on-chain via keccak256 commitment hashes.",
                },
                {
                  mechanism: "Protocol Fee",
                  desc: "A small protocol fee (denominated in ETH) is charged on successful salary reveals. Fees are distributed to staked token holders and the protocol treasury.",
                },
                {
                  mechanism: "Interview Insurance",
                  desc: "Candidates pay an ETH premium to the CipherEscrow contract. If the target number of interviews is not reached within the time window, the premium is auto-refunded.",
                },
                {
                  mechanism: "ATS Integration",
                  desc: "Employers can connect Greenhouse, Lever, or Workday ATS systems. API key hashes are stored encrypted. Integration activity earns protocol rewards.",
                },
              ].map((item, i) => (
                <div key={item.mechanism} className={`p-5 space-y-2 ${i % 2 === 0 ? "border-b md:border-b-0 md:border-r border-border" : "border-b border-border"} ${i >= 4 ? "border-b-0" : ""}`}>
                  <div className="font-mono-cipher text-xs text-primary">{item.mechanism}</div>
                  <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Roadmap */}
          <Section id="roadmap" title="9. Roadmap" tag="§ 09">
            <Para>
              The Cipher CV protocol has been developed in three phases, each building on the previous. The current state reflects Phase 3 — all 8 contracts live on Arbitrum Sepolia, full on-chain wiring across all surfaces, and a public SDK.
            </Para>
            <div className="border border-border">
              {[
                {
                  wave: "Phase 1",
                  status: "Complete",
                  title: "Foundation Layer",
                  items: [
                    "React frontend with Swiss Brutalist Privacy design system",
                    "Simulated FHE matching with visual encrypted computation",
                    "RainbowKit + wagmi wallet integration",
                    "Ethereum Sepolia Testnet connection",
                    "Candidate and Employer dashboard shells",
                    "Interactive demo with preset match scenarios",
                    "MoaiTransmission animation as privacy-by-motion centerpiece",
                  ],
                },
                {
                  wave: "Phase 2",
                  status: "Complete",
                  title: "Smart Contract Layer",
                  items: [
                    "8 CoFHE contracts deployed on Arbitrum Sepolia (Chain ID: 421614)",
                    "@cofhe/sdk integration for client-side encryption",
                    "On-chain profile submission and storage (euint32 mappings)",
                    "Blind matching computation via FHE.gte() and FHE.and()",
                    "Mutual consent reveal via FHE.publishDecryptResult()",
                    "Convex real-time backend with 12 tables",
                    "Stealth Mode, Counter-Offer, Interview Insurance, Governance",
                  ],
                },
                {
                  wave: "Phase 3",
                  status: "Live",
                  title: "Production Layer",
                  items: [
                    "Full on-chain wiring across all 8 surfaces",
                    "Multi-network support: Arbitrum Sepolia + Ethereum Sepolia",
                    "TxProgressBar for multi-step on-chain actions",
                    "Explorer links for all on-chain transactions",
                    "Public SDK with 24+ methods",
                    "Batch tournament matching (CipherBatchMatcher)",
                    "ZK Vault with sealed output credentials",
                    "Encrypted governance voting with quorum enforcement",
                    "ATS integrations: Greenhouse, Lever, Workday",
                    "CIPHER token rewards and referral program",
                  ],
                },
                {
                  wave: "Phase 4",
                  status: "Planned",
                  title: "Mainnet & Ecosystem",
                  items: [
                    "Fhenix Mainnet deployment",
                    "Skill vector encryption and matching (euint32 arrays)",
                    "Identity verification with zero-knowledge proofs",
                    "Multi-party matching for team composition",
                    "Employer reputation system (encrypted)",
                    "Cross-chain matching via LayerZero",
                    "Mobile SDK for iOS and Android",
                  ],
                },
              ].map((wave, i) => (
                <div key={wave.wave} className={`p-6 grid grid-cols-1 md:grid-cols-4 gap-6 ${i < 3 ? "border-b border-border" : ""}`}>
                  <div className="space-y-2">
                    <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">{wave.wave}</div>
                    <div className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>{wave.title}</div>
                    <span className={`font-mono-cipher text-xs px-2 py-1 border inline-block ${
                      wave.status === "Live" ? "border-primary text-primary" :
                      wave.status === "Complete" ? "border-primary/50 text-primary/70" :
                      "border-border text-muted-foreground"
                    }`}>{wave.status}</span>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    {wave.items.map(item => (
                      <div key={item} className="flex items-start gap-2">
                        <span className={`font-mono-cipher text-xs mt-0.5 shrink-0 ${wave.status === "Live" || wave.status === "Complete" ? "text-primary" : "text-muted-foreground"}`}>
                          {wave.status === "Live" || wave.status === "Complete" ? "✓" : "—"}
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
              The encrypted labor market is not a niche product for privacy advocates. It is the correct design for any market where information asymmetry produces systematically unfair outcomes. Cipher CV is the first implementation of this design on a production-grade FHE blockchain, with 8 live contracts on Arbitrum Sepolia and a full-stack application serving real users.
            </Callout>
            <Para>
              Phase 1 demonstrated the user experience and interaction model. Phase 2 deployed the cryptographic infrastructure. Phase 3 wired all surfaces to on-chain paths with full explorer visibility. Phase 4 scales to mainnet. The protocol is designed to be composable — any application that requires privacy-preserving matching can build on the Cipher CV protocol layer.
            </Para>
            <div className="border border-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {[
                { label: "Fhenix Documentation", href: "https://docs.fhenix.zone", desc: "fhEVM developer docs and CoFHE SDK" },
                { label: "Arbitrum Sepolia Explorer", href: "https://sepolia.arbiscan.io", desc: "Arbitrum Sepolia — Chain ID 421614" },
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
              <div>Cipher CV Protocol — Technical Whitepaper</div>
              <div>Cipher CV Protocol — {new Date().getFullYear()}</div>
              <div className="text-primary mt-2">All cryptographic guarantees are enforced by the Fhenix fhEVM. Privacy is not a policy — it is a mathematical property.</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}