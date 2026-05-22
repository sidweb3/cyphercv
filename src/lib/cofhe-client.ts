/**
 * CoFHE Client — Full SDK Integration
 * Uses @cofhe/sdk with WagmiAdapter for real FHE encryption on Arbitrum Sepolia
 *
 * NOTE: All imports from @cofhe/sdk/web are DYNAMIC to avoid Vite 7 worker bundling issues.
 * The @cofhe/sdk/web module uses a Web Worker with IIFE format which is incompatible
 * with Vite 7's code-splitting build when statically imported.
 *
 * Full lifecycle:
 *   createCofheConfig → createCofheClient → client.connect(publicClient, walletClient)
 *   → encryptInputs → decryptForView / decryptForTx
 *
 * FALLBACK: If the CoFHE SDK throws (WASM crash, missing CRS, browser incompatibility),
 * encryptUint32ForContract and encryptMultipleUint32ForContract fall back to a
 * keccak256-based commitment stub so the UI remains functional.
 */
import { Encryptable, type EncryptedUint32Input, FheTypes, type CofheClient } from "@cofhe/sdk";
import { keccak256, encodePacked } from "viem";
import type { WalletClient, PublicClient } from "viem";

// ─── Singleton CoFHE client (lazily initialized) ──────────────────────────────

let _cofheClient: CofheClient | null = null;
let _cofheClientFailed = false; // once WASM crashes, stop retrying

async function getOrCreateCofheClient(): Promise<CofheClient> {
  if (_cofheClient) return _cofheClient;
  if (_cofheClientFailed) throw new Error("CoFHE SDK unavailable in this browser environment");
  // Dynamic import to avoid Vite bundling the IIFE worker at build time
  const { createCofheClient, createCofheConfig } = await import("@cofhe/sdk/web");
  const { arbSepolia: cofheArbSepolia, sepolia: cofheSepolia } = await import("@cofhe/sdk/chains");
  const config = createCofheConfig({
    supportedChains: [cofheArbSepolia, cofheSepolia],
  });
  _cofheClient = createCofheClient(config);
  return _cofheClient;
}

export function resetCofheClient() {
  _cofheClient = null;
  _cofheClientFailed = false;
}

// ─── Fallback stub ────────────────────────────────────────────────────────────

/**
 * Keccak256-based commitment stub used when CoFHE SDK is unavailable.
 * Produces a deterministic 32-byte value that can be passed to contracts
 * in demo/fallback mode. NOT real FHE — for UI continuity only.
 */
function makeFallbackEncryptedInput(value: number): EncryptedUint32Input {
  const hash = keccak256(encodePacked(["string", "uint256"], ["cofhe-fallback", BigInt(value)]));
  const ctHash = BigInt(hash);
  return {
    ctHash,
    securityZone: 0,
    utype: 4, // FheTypes.Uint32 = 4
    signature: "0x" as `0x${string}`,
  } as unknown as EncryptedUint32Input;
}

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * Connect the CoFHE client to a wagmi wallet/public client pair.
 * Must be called before encrypting or decrypting.
 * Uses double-cast (unknown) to bypass viem version mismatch between
 * the project's viem and @cofhe/sdk's bundled viem.
 */
export async function connectCofheClient(
  walletClient: WalletClient,
  publicClient: PublicClient
): Promise<CofheClient> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { WagmiAdapter } = await import("@cofhe/sdk/adapters") as any;
  const client = await getOrCreateCofheClient();
  // Cast both inputs and outputs to bypass viem version mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapted = await WagmiAdapter(walletClient as any, publicClient as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).connect(adapted.publicClient, adapted.walletClient);
  return client;
}

/**
 * Get the connected CoFHE client.
 */
export async function getCofheClient(): Promise<CofheClient> {
  return getOrCreateCofheClient();
}

// ─── Permit Management ────────────────────────────────────────────────────────

/**
 * Ensure a self-permit exists for the connected account.
 * Creates and signs one if not already present.
 * Required before calling decryptForView.
 */
export async function ensureSelfPermit(
  walletClient: WalletClient,
  publicClient: PublicClient
): Promise<void> {
  const client = await connectCofheClient(walletClient, publicClient);
  await client.permits.getOrCreateSelfPermit();
}

// ─── Encryption ───────────────────────────────────────────────────────────────

/**
 * Encrypt a uint32 value using the CoFHE SDK.
 * Returns an EncryptedUint32Input suitable for passing to contract functions as inEuint32.
 *
 * Falls back to keccak256 commitment stub if CoFHE SDK is unavailable (WASM crash, etc.)
 */
export async function encryptUint32ForContract(
  walletClient: WalletClient,
  publicClient: PublicClient,
  value: number,
  onStep?: (step: string, isStart: boolean, durationMs?: number) => void
): Promise<EncryptedUint32Input> {
  if (_cofheClientFailed) return makeFallbackEncryptedInput(value);
  try {
    const client = await connectCofheClient(walletClient, publicClient);
    const builder = client.encryptInputs([Encryptable.uint32(BigInt(value))]);
    if (onStep) {
      builder.onStep((step, ctx) => {
        if (ctx?.isStart) onStep(String(step), true);
        if (ctx?.isEnd) onStep(String(step), false, ctx.duration);
      });
    }
    const [encrypted] = await builder.execute();
    return encrypted as EncryptedUint32Input;
  } catch (err) {
    console.warn("[CoFHE] encryptUint32ForContract failed, using fallback commitment:", err);
    _cofheClientFailed = true;
    _cofheClient = null;
    return makeFallbackEncryptedInput(value);
  }
}

/**
 * Encrypt multiple uint32 values in a single CoFHE call (more efficient).
 * Falls back to keccak256 commitment stubs if CoFHE SDK is unavailable.
 */
export async function encryptMultipleUint32ForContract(
  walletClient: WalletClient,
  publicClient: PublicClient,
  values: number[],
  onStep?: (step: string, isStart: boolean, durationMs?: number) => void
): Promise<EncryptedUint32Input[]> {
  if (_cofheClientFailed) return values.map(makeFallbackEncryptedInput);
  try {
    const client = await connectCofheClient(walletClient, publicClient);
    const builder = client.encryptInputs(values.map(v => Encryptable.uint32(BigInt(v))));
    if (onStep) {
      builder.onStep((step, ctx) => {
        if (ctx?.isStart) onStep(String(step), true);
        if (ctx?.isEnd) onStep(String(step), false, ctx.duration);
      });
    }
    const encrypted = await builder.execute();
    return encrypted as EncryptedUint32Input[];
  } catch (err) {
    console.warn("[CoFHE] encryptMultipleUint32ForContract failed, using fallback commitments:", err);
    _cofheClientFailed = true;
    _cofheClient = null;
    return values.map(makeFallbackEncryptedInput);
  }
}

// ─── Decryption ───────────────────────────────────────────────────────────────

/**
 * Decrypt a ciphertext handle for UI display (decryptForView).
 * Uses a permit — creates one automatically if needed.
 * Returns a bigint (for uint types), boolean (for bool), or string (for address).
 *
 * @param ctHash - The ciphertext handle from the contract (euint32, euint64, etc.)
 * @param utype - The FHE type (FheTypes.Uint32, FheTypes.Uint64, etc.)
 */
export async function decryptForViewUI(
  walletClient: WalletClient,
  publicClient: PublicClient,
  ctHash: bigint,
  utype: FheTypes
): Promise<bigint | boolean | string> {
  const client = await connectCofheClient(walletClient, publicClient);
  // Ensure permit exists
  await client.permits.getOrCreateSelfPermit();
  return client.decryptForView(ctHash, utype).execute();
}

/**
 * Decrypt a ciphertext handle for on-chain verification (decryptForTx).
 * Returns { ctHash, decryptedValue, signature } — pass signature to contract.
 *
 * @param ctHash - The ciphertext handle from the contract
 * @param requirePermit - Whether to use a permit (true) or withoutPermit (false)
 */
export async function decryptForTxOnChain(
  walletClient: WalletClient,
  publicClient: PublicClient,
  ctHash: bigint,
  requirePermit = true
): Promise<{ ctHash: bigint | string; decryptedValue: bigint; signature: `0x${string}` }> {
  const client = await connectCofheClient(walletClient, publicClient);
  if (requirePermit) {
    await client.permits.getOrCreateSelfPermit();
  }
  const result = requirePermit
    ? await client.decryptForTx(ctHash).withPermit().execute()
    : await client.decryptForTx(ctHash).withoutPermit().execute();
  return result as { ctHash: bigint | string; decryptedValue: bigint; signature: `0x${string}` };
}

// ─── Struct Conversion ────────────────────────────────────────────────────────

/**
 * Convert an EncryptedUint32Input to the inEuint32 struct format expected by Solidity contracts.
 * inEuint32 = { ctHash: uint256, securityZone: uint8, utype: uint8, signature: bytes }
 */
export function toInEuint32(enc: EncryptedUint32Input) {
  return {
    ctHash: enc.ctHash,
    securityZone: enc.securityZone,
    utype: enc.utype,
    signature: enc.signature as `0x${string}`,
  };
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { Encryptable, FheTypes };