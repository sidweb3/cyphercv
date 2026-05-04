# Cipher CV — Encrypted Labor Matching Protocol

> Privacy-by-design job matching powered by Fully Homomorphic Encryption via CoFHE.

---

## What Is Cipher CV?

Cipher CV is a decentralized labor market where candidates and employers match **without ever revealing their data**. Salary expectations, experience, and identity are encrypted client-side using keccak256 commitment encoding (viem) before any network call. The matching engine computes compatibility on encrypted inputs — no plaintext ever leaves your browser.

Built for the **Fhenix Privacy-by-Design Buildathon**, Wave 3.

**Core Products:**
- **Stealth Mode** — Job search invisible to your current employer (FHE-encrypted blocklist + time-lock)
- **Counter-Offer Calculator** — Negotiate with encrypted market benchmarks
- **Interview Insurance** — Guaranteed interviews or your money back (escrow-backed)
- **ZK Vault** — Encrypted credential commitments with on-chain revocation
- **Protocol Governance** — Encrypted on-chain voting on protocol parameters
- **SDK** — `@cipher-cv/sdk` public TypeScript SDK for ecosystem integrations

---

## The Problem

Traditional job markets expose everything:

| Data Point | Traditional Market | Cipher CV |
|---|---|---|
| Salary History | Fully visible | `[ENCRYPTED]` |
| Current Employer | Visible | `[ENCRYPTED]` |
| Rejection Reason | "Overqualified" leaks budget | Blind rejection |
| Negotiation Position | Desperation visible | Zero knowledge |
| Bias Indicators | Name, photo, age visible | Identity hidden |

---

## How It Works

```
Candidate                    Cipher CV Protocol              Employer
─────────                    ──────────────────              ────────
Salary: $120K–$150K          keccak256(salary, salt)         Budget: $130K
Experience: 8 years    →     keccak256(exp, salt)      →     Req. Exp: 6 years
Skills: [Solidity, FHE]      keccak256(skills, salt)         Skills: [Solidity]
                                      ↓
                             FHE Circuit: lte(min, budget) && gte(max, budget)
                                      ↓
                             Match Score: 94 — Salary overlap confirmed
                                      ↓
                             Both parties consent → salary revealed
```

1. **Encrypt** — Candidate and employer inputs are hashed client-side using `keccak256(encodePacked(...))` before any network call.
2. **Match** — The FHE circuit computes salary overlap and experience compatibility on encrypted values.
3. **Consent** — Both parties must sign consent before any value is revealed.
4. **Reveal** — Only the suggested salary is revealed, only to consenting parties.

---

## Smart Contracts (8 Contracts)

All contracts use `@fhenixprotocol/cofhe-contracts/FHE.sol` with `FHE.allowThis` / `FHE.allowSender` permission management.

| Contract | File | Key FHE Operations |
|---|---|---|
| CipherCV | `contracts/CipherCV.sol` | `FHE.lte`, `FHE.gte`, `FHE.and`, `FHE.sealoutput` |
| CipherVault | `contracts/CipherVault.sol` | `FHE.asEuint32`, `FHE.sealoutput` |
| CipherGovernance | `contracts/CipherGovernance.sol` | `FHE.add`, `FHE.gt`, `FHE.decrypt` |
| CipherEscrow | `contracts/CipherEscrow.sol` | `FHE.gte`, `FHE.asEuint32` |
| CipherCounterOffer | `contracts/CipherCounterOffer.sol` | `FHE.lt`, `FHE.gte`, `FHE.select`, `FHE.add` |
| CipherStealth | `contracts/CipherStealth.sol` | Plaintext blocklist + FHE-gated visibility |
| CipherBatchMatcher | `contracts/CipherBatchMatcher.sol` | Delegates to CipherCV |
| CipherRegistry | `contracts/CipherRegistry.sol` | Address registry (no FHE) |
### Deployed Contract Addresses (Arbitrum Sepolia)

| Contract | Address | Explorer |
|---|---|---|
| CipherCV | `0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659` | [View](https://sepolia.arbiscan.io/address/0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659) |
| CipherVault | `0xeff0835318a9e6812150519321B3097Db685A361` | [View](https://sepolia.arbiscan.io/address/0xeff0835318a9e6812150519321B3097Db685A361) |
| CipherGovernance | `0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707` | [View](https://sepolia.arbiscan.io/address/0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707) |
| CipherEscrow | `0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6` | [View](https://sepolia.arbiscan.io/address/0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6) |
| CipherCounterOffer | `0xac95Fd56a9a18A5424370528a40035F47277A13d` | [View](https://sepolia.arbiscan.io/address/0xac95Fd56a9a18A5424370528a40035F47277A13d) |
| CipherStealth | `0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91` | [View](https://sepolia.arbiscan.io/address/0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91) |
| CipherBatchMatcher | `0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b` | [View](https://sepolia.arbiscan.io/address/0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b) |
| CipherRegistry | `0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79` | [View](https://sepolia.arbiscan.io/address/0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79) |

### Supported Networks

| Network | Chain ID | Explorer |
|---|---|---|
| Arbitrum Sepolia | 421614 | sepolia.arbiscan.io |
| Ethereum Sepolia | 11155111 | sepolia.etherscan.io |
| Base Sepolia | 84532 | sepolia.basescan.org |
| Hardhat Local | 31337 | localhost |

---

## Convex Data Schema (8 Tables)

```
encryptedProfiles        — Candidate profiles (hash commitments only)
jobPostings              — Employer job specs (hash commitments only)
matchRequests            — Match state + consent tracking
counterOfferRequests     — Counter-offer calculator sessions
interviewInsuranceOrders — Interview insurance escrow orders
notifications            — Per-wallet notification feed
governanceProposals      — On-chain governance proposals
governanceVotes          — Encrypted governance votes
```

---

## Frontend Encryption Path

```typescript
// src/lib/fhenix.ts
// Deterministic keccak256 commitment — no plaintext transmitted
keccak256(encodePacked(["string", "uint256", "string"], [type, BigInt(value), salt]))
```

All encryption helpers (`encryptSalary`, `encryptExperience`, `encryptSkillScore`, `encryptPercentage`, `encryptVote`, `encryptUint32`) produce a `{ data: Uint8Array }` commitment that is safe to store on-chain or in Convex.

---

## App Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Hero, stealth demo, MoaiTransmission animation |
| `/app` | Dashboard | Overview, stats, quick actions |
| `/app/candidate` | Candidate | Encrypt profile, stealth mode, counter-offer |
| `/app/employer` | Employer | Post job spec, pipeline, FHE circuit |
| `/app/matches` | Matches | Match list, consent reveal, salary reveal |
| `/app/vault` | Vault | ZK credential management |
| `/app/governance` | Governance | Encrypted voting on protocol proposals |
| `/app/analytics` | Analytics | Privacy-preserving aggregate analytics |
| `/app/proofs` | Proof Explorer | On-chain proof verification |
| `/app/protocol` | Protocol | Technical architecture docs |
| `/app/whitepaper` | Whitepaper | Full protocol whitepaper |

---

## Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.2
- [Node.js](https://nodejs.org) >= 20
- A Convex account (free at [convex.dev](https://convex.dev))
- A WalletConnect project ID (free at [cloud.walletconnect.com](https://cloud.walletconnect.com))

### Install & Run

```bash
# Clone and install
git clone <repo>
cd cipher-cv
bun install

# Start Convex dev server (first time: follow prompts to create deployment)
npx convex dev

# In a separate terminal, start the frontend
bun run dev
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Convex (auto-generated by npx convex dev)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# WalletConnect (get from cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract addresses — deployed on Arbitrum Sepolia
VITE_CIPHER_CV_CONTRACT=0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659
VITE_CIPHER_VAULT_CONTRACT=0xeff0835318a9e6812150519321B3097Db685A361
VITE_CIPHER_GOVERNANCE_CONTRACT=0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707
VITE_CIPHER_ESCROW_CONTRACT=0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6
VITE_CIPHER_COUNTER_OFFER_CONTRACT=0xac95Fd56a9a18A5424370528a40035F47277A13d
VITE_CIPHER_STEALTH_CONTRACT=0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91
VITE_CIPHER_BATCH_MATCHER_CONTRACT=0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b
VITE_CIPHER_REGISTRY_CONTRACT=0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79
```

> **Note:** Contract address env vars are optional. The app runs in demo mode without them. The deployment script prints the exact env var names after deploying.

---

## Deploy Contracts

```bash
# Set deployer private key
export PRIVATE_KEY=0x<your_private_key>

# Deploy to Arbitrum Sepolia (recommended — lowest gas)
npx hardhat run scripts/deploy.ts --network arbitrum-sepolia

# Or deploy to Ethereum Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Or deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network base-sepolia
```

The deployment script deploys all 8 contracts, registers them in CipherRegistry, and prints the env var block to paste into `.env.local`.

---

## Build & Type Check

```bash
# Type check
bun run type-check

# Production build
bun run build

# Preview production build
bun run preview
```

---

## Extract from Tarball

```bash
# Download and extract
tar -xzf cipher-match.tar.gz
cd cipher-cv
bun install
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Animation | Framer Motion, Canvas API |
| Routing | React Router v7 |
| Wallet | RainbowKit, wagmi, viem |
| Backend | Convex (real-time database + functions) |
| Auth | Convex Auth (email OTP + anonymous) |
| FHE SDK | @cofhe/sdk (CoFHE), keccak256 commitments |
| Contracts | Hardhat, Solidity, @fhenixprotocol/cofhe-contracts |

---

## Wave Status

| Wave | Status | Description |
|---|---|---|
| Wave 1 | ✅ Complete | Landing, app shell, mocked FHE demo, wallet gating |
| Wave 2 | ✅ Complete | 8 CoFHE contracts live on Arbitrum Sepolia, Convex data layer |
| Wave 3 | 🔄 In Progress | Mainnet deployment, DAO governance, public SDK, ecosystem integrations |

### Wave 2 Highlights
- 8 CoFHE smart contracts with real FHE operations
- Convex-backed data layer with 8 tables
- keccak256 commitment encoding (deterministic, cryptographically sound)
- Stealth Mode with employer domain blocklist
- Counter-Offer Calculator with encrypted market benchmarks
- Interview Insurance with escrow hash commitments
- Encrypted governance voting
- MoaiTransmission animation as privacy-by-motion centerpiece

---

## License

MIT — see LICENSE file.