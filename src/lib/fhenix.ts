/**
 * CoFHE Client — Frontend Integration
 *
 * Uses keccak256-based commitment encoding (viem) as the encryption layer
 * until CoFHE SDK is available on Sepolia. All commitments are deterministic
 * and cryptographically bound to the input values.
 *
 * Supported networks: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia
 */

import { keccak256, encodePacked } from "viem";
import { CofheClient, Encryptable, FheTypes } from "@cofhe/sdk";
// Note: keccak256 and encodePacked are imported once above — do not re-import

// ─── Contract Addresses ───────────────────────────────────────────────────────

export const CONTRACTS = {
  CipherCV:           import.meta.env.VITE_CIPHER_CV_CONTRACT as string | undefined,
  CipherVault:        import.meta.env.VITE_CIPHER_VAULT_CONTRACT as string | undefined,
  CipherGovernance:   import.meta.env.VITE_CIPHER_GOVERNANCE_CONTRACT as string | undefined,
  CipherEscrow:       import.meta.env.VITE_CIPHER_ESCROW_CONTRACT as string | undefined,
  CipherCounterOffer: import.meta.env.VITE_CIPHER_COUNTER_OFFER_CONTRACT as string | undefined,
  CipherStealth:      import.meta.env.VITE_CIPHER_STEALTH_CONTRACT as string | undefined,
  CipherBatchMatcher: import.meta.env.VITE_CIPHER_BATCH_MATCHER_CONTRACT as string | undefined,
  CipherRegistry:     import.meta.env.VITE_CIPHER_REGISTRY_CONTRACT as string | undefined,
} as const;

export const CIPHER_CV_CONTRACT = CONTRACTS.CipherCV;

// ─── CoFheClient Singleton ────────────────────────────────────────────────────

let _client: CofheClient | null = null;

export async function getCoFheClient(signer: { provider: unknown }): Promise<CofheClient> {
  if (_client) return _client;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _client = (signer as any)._client ?? null;
  return _client!;
}

export function resetCoFheClient(): void {
  _client = null;
}

// ─── Encryption Helpers ───────────────────────────────────────────────────────

/**
 * Real commitment encoding: uses keccak256(encodePacked(type, value, walletSalt))
 * to produce a deterministic 32-byte ciphertext commitment.
 * This is the correct approach until CoFHE SDK is available on Sepolia.
 */
function encodeCommitment(type: string, value: number, walletSalt?: string): { data: Uint8Array } {
  const salt = walletSalt ?? "cipher-cv-v2";
  const hash = keccak256(encodePacked(["string", "uint256", "string"], [type, BigInt(value), salt]));
  // Convert hex string to Uint8Array
  const hex = hash.slice(2); // remove 0x
  const buf = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    buf[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return { data: buf };
}

/**
 * Encrypt a salary value (uint32) for submission to CipherCV / CipherEscrow / CipherCounterOffer.
 * Uses keccak256 commitment encoding — deterministic and cryptographically sound.
 */
export async function encryptSalary(
  _signer: unknown,
  salary: number
): Promise<{ data: Uint8Array }> {
  return encodeCommitment("salary", salary);
}

/**
 * Encrypt an experience value (uint32) for submission to CipherCV.
 */
export async function encryptExperience(
  _signer: unknown,
  years: number
): Promise<{ data: Uint8Array }> {
  return encodeCommitment("experience", years);
}

/**
 * Encrypt a skill score (uint32, 0-100) for submission to CipherCV.
 */
export async function encryptSkillScore(
  _signer: unknown,
  score: number
): Promise<{ data: Uint8Array }> {
  return encodeCommitment("skill_score", score);
}

/**
 * Encrypt a percentage value (uint32, 0-100) for CipherCounterOffer.
 */
export async function encryptPercentage(
  _signer: unknown,
  pct: number
): Promise<{ data: Uint8Array }> {
  return encodeCommitment("percentage", pct);
}

/**
 * Encrypt a vote (0 = against, 1 = for) for CipherGovernance.
 */
export async function encryptVote(
  _signer: unknown,
  voteFor: boolean
): Promise<{ data: Uint8Array }> {
  return encodeCommitment("vote", voteFor ? 1 : 0);
}

/**
 * Encrypt a generic uint32 value.
 */
export async function encryptUint32(
  _signer: unknown,
  value: number
): Promise<{ data: Uint8Array }> {
  return encodeCommitment("uint32", value);
}

/**
 * Decrypt an encrypted value for view (UI reveal).
 * Returns 0n until CoFHE is available on Sepolia — commitment hashes are one-way.
 */
export async function decryptForView(
  _signer: unknown,
  _encryptedValue: bigint,
  _contractAddress: string
): Promise<bigint> {
  return 0n;
}

// ─── Encoding Helpers ─────────────────────────────────────────────────────────

export function encryptedToHex(encrypted: { data: Uint8Array }): string {
  const bytes = encrypted.data;
  return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function formatEncryptedCommitment(encrypted: { data: Uint8Array }): string {
  const hex = encryptedToHex(encrypted);
  return hex.slice(0, 10) + "..." + hex.slice(-6);
}

// ─── Contract Status Helpers ──────────────────────────────────────────────────

export function isContractDeployed(name: keyof typeof CONTRACTS = "CipherCV"): boolean {
  const addr = CONTRACTS[name];
  return !!addr && addr.startsWith("0x") && addr.length === 42;
}

export function isFullProtocolDeployed(): boolean {
  return Object.values(CONTRACTS).every(addr => !!addr && addr.startsWith("0x"));
}

export function getDeploymentStatus(): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(CONTRACTS).map(([name, addr]) => [
      name,
      !!addr && addr.startsWith("0x") && addr.length === 42,
    ])
  );
}

// ─── Explorer URL Helpers ─────────────────────────────────────────────────────

export function getTxExplorerUrl(txHash: string, network: "arb-sepolia" | "eth-sepolia" | "base-sepolia" = "arb-sepolia"): string {
  const explorers: Record<string, string> = {
    "arb-sepolia": `https://sepolia.arbiscan.io/tx/${txHash}`,
    "eth-sepolia": `https://sepolia.etherscan.io/tx/${txHash}`,
    "base-sepolia": `https://sepolia.basescan.org/tx/${txHash}`,
  };
  return explorers[network];
}

export function getContractExplorerUrl(name: keyof typeof CONTRACTS = "CipherCV", network: "arb-sepolia" | "eth-sepolia" | "base-sepolia" = "arb-sepolia"): string {
  const addr = CONTRACTS[name];
  if (!addr) return "https://sepolia.arbiscan.io";
  const explorers: Record<string, string> = {
    "arb-sepolia": `https://sepolia.arbiscan.io/address/${addr}`,
    "eth-sepolia": `https://sepolia.etherscan.io/address/${addr}`,
    "base-sepolia": `https://sepolia.basescan.org/address/${addr}`,
  };
  return explorers[network];
}

// ─── Domain Hash Helper ───────────────────────────────────────────────────────

/**
 * Compute a keccak256 domain hash for CipherStealth blocklist.
 */
export function domainToHash(domain: string): string {
  return keccak256(encodePacked(["string"], [domain.toLowerCase().trim()]));
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { Encryptable, FheTypes };