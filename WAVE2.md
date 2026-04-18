# Wave 2 — Changes & Implementation Log

> Complete record of all Wave 2 changes to Cipher CV.
> Wave 2 focus: Real CoFHE contracts, @cofhe/sdk integration, Convex data layer, production-grade UI.

---

## CoFHE Stack Alignment (Critical Update)

Wave 2 aligns the entire stack with the **real CoFHE SDK** as documented at [cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone).

### What Changed from Wave 1

| Component | Wave 1 (Mock) | Wave 2 (Real CoFHE) |
|---|---|---|
| FHE SDK | `fhenixjs` | `@cofhe/sdk` |
| Contract imports | `@fhenixprotocol/contracts/FHE.sol` | `@fhenixprotocol/cofhe-contracts/FHE.sol` |
| Networks | Fhenix Frontier (8008135) | Arbitrum Sepolia, Ethereum Sepolia, Base Sepolia |
| Local testing | None | `cofhe-hardhat-plugin` mock environment |
| Encryption API | `client.encrypt_uint32(n)` | `client.encryptInputs([Encryptable.uint32(n)])` |
| Decryption API | `FHE.decrypt()` | `client.decryptForView().withPermit().execute()` |
| Permission model | None | `FHE.allowThis()` + `FHE.allowSender()` required |

### Supported Networks (CoFHE)

| Network | Chain ID | Explorer | Gas |
|---|---|---|---|
| Arbitrum Sepolia | 421614 | sepolia.arbiscan.io | Lowest ✅ |
| Ethereum Sepolia | 11155111 | sepolia.etherscan.io | Medium |
| Base Sepolia | 84532 | sepolia.basescan.org | Low |

---

## Smart Contracts

### 8 Contracts Implemented

All contracts updated to use `@fhenixprotocol/cofhe-contracts/FHE.sol` with proper `FHE.allowThis` / `FHE.allowSender` permission management.

| Contract | File | Key FHE Operations |
|---|---|---|
| CipherCV | `contracts/CipherCV.sol` | `FHE.lte`, `FHE.gte`, `FHE.and`, `FHE.sealoutput` |
| CipherVault | `contracts/CipherVault.sol` | `FHE.asEuint32`, `FHE.sealoutput` |
| CipherGovernance | `contracts/CipherGovernance.sol` | `FHE.add`, `FHE.gt`, `FHE.decrypt` |
| CipherEscrow | `contracts/CipherEscrow.sol` | `FHE.gte`, `FHE.asEuint32` |
| CipherCounterOffer | `contracts/CipherCounterOffer.sol` | `FHE.lt`, `FHE.gte`, `FHE.select`, `FHE.add` |
| CipherStealth | `contracts/CipherStealth.sol` | Plaintext blocklist + FHE-gated visibility |
| CipherBatchMatcher | `contracts/CipherBatchMatcher.sol` | Delegates to CipherCV |
| CipherRegistry | `contracts/CipherRegistry.sol` | None — address registry |
### Deployed Contract Addresses (Arbitrum Sepolia)

All 8 contracts are live on Arbitrum Sepolia (Chain ID: 421614).

| Contract | Address | Explorer |
|---|---|---|
| CipherCV | `0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659) |
| CipherVault | `0xeff0835318a9e6812150519321B3097Db685A361` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xeff0835318a9e6812150519321B3097Db685A361) |
| CipherGovernance | `0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707) |
| CipherEscrow | `0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6) |
| CipherCounterOffer | `0xac95Fd56a9a18A5424370528a40035F47277A13d` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xac95Fd56a9a18A5424370528a40035F47277A13d) |
| CipherStealth | `0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91) |
| CipherBatchMatcher | `0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b) |
| CipherRegistry | `0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79` | [View on Arbiscan](https://sepolia.arbiscan.io/address/0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79) |

**Env vars (paste into `.env.local`):**

```env
VITE_CIPHER_CV_CONTRACT=0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659
VITE_CIPHER_VAULT_CONTRACT=0xeff0835318a9e6812150519321B3097Db685A361
VITE_CIPHER_GOVERNANCE_CONTRACT=0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707
VITE_CIPHER_ESCROW_CONTRACT=0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6
VITE_CIPHER_COUNTER_OFFER_CONTRACT=0xac95Fd56a9a18A5424370528a40035F47277A13d
VITE_CIPHER_STEALTH_CONTRACT=0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91
VITE_CIPHER_BATCH_MATCHER_CONTRACT=0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b
VITE_CIPHER_REGISTRY_CONTRACT=0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79
```

---
### Permission Model (Required in CoFHE)

Every FHE operation must be followed by permission grants: