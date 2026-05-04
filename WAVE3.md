# Wave 3 — Changes & Implementation Log

> Complete record of all Wave 3 changes to Cipher CV.
> Wave 3 focus: SDK release, vault persistence, governance wiring, token rewards, ATS integrations, in-app browser resilience, and production-grade UX polish.

---

## Wave 3 Overview

Wave 3 builds on the Wave 2 CoFHE infrastructure and Convex data layer. **Testnet-first approach** — all Wave 3 features are developed and validated on Arbitrum Sepolia. Mainnet deployment is deferred to a future wave.

| Milestone | Status |
|---|---|
| `@cipher-cv/sdk` internal release | ✅ Complete |
| ZK Vault Convex persistence | ✅ Complete |
| Governance voting wired to real Convex | ✅ Complete |
| Stealth Mode UI fully wired | ✅ Complete |
| Counter-offer modal on Matches | ✅ Complete |
| Token balance widget (claim/stake) | ✅ Complete |
| ATS integration config (Greenhouse, Lever, Workday) | ✅ Complete |
| Referral tracking | ✅ Complete |
| In-app browser detection + "Open in Browser" banner | ✅ Complete |
| MetaMask/wallet error suppression | ✅ Complete |
| Schema expansion (12 tables) | ✅ Complete |
| Mainnet contract deployment | 📋 Deferred |

---

## Schema Changes

### New Tables Added (Wave 3)

**`tokenBalances`** — CipherToken reward tracking