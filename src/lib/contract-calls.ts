/**
 * Real on-chain contract call helpers.
 * Uses wagmi's writeContract to send real transactions to deployed contracts.
 * Supports Ethereum Sepolia (11155111) and Arbitrum Sepolia (421614).
 */
import { writeContract, getChainId } from "@wagmi/core";
import { wagmiConfig } from "./wagmi";
import { CONTRACTS, getTxExplorerUrl } from "./fhenix";
import { encryptUint32ForContract, toInEuint32 } from "./cofhe-client";
import type { WalletClient, PublicClient } from "viem";

// ─── Network helper ───────────────────────────────────────────────────────────

function getExplorerNetwork(): "arb-sepolia" | "eth-sepolia" | "base-sepolia" {
  try {
    const chainId = getChainId(wagmiConfig);
    if (chainId === 11155111) return "eth-sepolia";
    if (chainId === 84532) return "base-sepolia";
  } catch {}
  return "arb-sepolia";
}

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const CIPHER_CV_ABI = [
  {
    name: "submitCandidateProfile",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "inMinSalary", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "inMaxSalary", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "inExperience", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "inSkillScore", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
    ],
    outputs: [],
  },
  {
    name: "submitJobPosting",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "inBudgetMax", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "inRequiredExp", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "inRequiredSkill", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
    ],
    outputs: [],
  },
  {
    name: "candidateConsent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "employerAddr", type: "address" }],
    outputs: [],
  },
  {
    name: "employerConsent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "candidateAddr", type: "address" }],
    outputs: [],
  },
  {
    name: "computeMatch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "candidateAddr", type: "address" },
      { name: "employerAddr", type: "address" },
    ],
    outputs: [],
  },
] as const;

export const CIPHER_GOVERNANCE_ABI = [
  {
    name: "createProposal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    name: "castVote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "inVoteWeight", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "support", type: "bool" },
    ],
    outputs: [],
  },
] as const;

export const CIPHER_VAULT_ABI = [
  {
    name: "storeCredential",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "inValue", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "credType", type: "uint8" },
      { name: "label", type: "string" },
    ],
    outputs: [{ name: "index", type: "uint256" }],
  },
  {
    name: "revokeCredential",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [],
  },
] as const;

export const CIPHER_STEALTH_ABI = [
  {
    name: "setStealthMode",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "mode", type: "uint8" }],
    outputs: [],
  },
  {
    name: "setTimeLock",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "unlockDate", type: "uint256" }],
    outputs: [],
  },
  {
    name: "blockDomain",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "domainHash", type: "bytes32" }],
    outputs: [],
  },
] as const;

export const CIPHER_COUNTER_OFFER_ABI = [
  {
    name: "requestCounterOffer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "inCurrentSalary", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "inTargetIncrease", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "inYearsAtCompany", type: "tuple", components: [
        { name: "ctHash", type: "uint256" },
        { name: "securityZone", type: "uint8" },
        { name: "utype", type: "uint8" },
        { name: "signature", type: "bytes" },
      ]},
      { name: "role", type: "string" },
    ],
    outputs: [],
  },
] as const;

// ─── Contract Call Helpers ────────────────────────────────────────────────────

type TxResult = { hash: string; explorerUrl: string };

/**
 * Submit candidate profile to CipherCV contract with real FHE encryption.
 */
export async function onChainSubmitCandidateProfile(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    minSalary: number;
    maxSalary: number;
    experience: number;
    skillScore: number;
  }
): Promise<TxResult> {
  const addr = CONTRACTS.CipherCV;
  if (!addr) throw new Error("CipherCV contract not deployed");

  const [encMin, encMax, encExp, encSkill] = await Promise.all([
    encryptUint32ForContract(walletClient, publicClient, params.minSalary),
    encryptUint32ForContract(walletClient, publicClient, params.maxSalary),
    encryptUint32ForContract(walletClient, publicClient, params.experience),
    encryptUint32ForContract(walletClient, publicClient, params.skillScore),
  ]);

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_CV_ABI,
    functionName: "submitCandidateProfile",
    args: [toInEuint32(encMin), toInEuint32(encMax), toInEuint32(encExp), toInEuint32(encSkill)],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Submit job posting to CipherCV contract with real FHE encryption.
 */
export async function onChainSubmitJobPosting(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    budget: number;
    requiredExp: number;
    requiredSkillScore: number;
  }
): Promise<TxResult> {
  const addr = CONTRACTS.CipherCV;
  if (!addr) throw new Error("CipherCV contract not deployed");

  const [encBudget, encExp, encSkill] = await Promise.all([
    encryptUint32ForContract(walletClient, publicClient, params.budget),
    encryptUint32ForContract(walletClient, publicClient, params.requiredExp),
    encryptUint32ForContract(walletClient, publicClient, params.requiredSkillScore),
  ]);

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_CV_ABI,
    functionName: "submitJobPosting",
    args: [toInEuint32(encBudget), toInEuint32(encExp), toInEuint32(encSkill)],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Cast a vote on a governance proposal with real FHE encryption.
 */
export async function onChainCastVote(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    proposalId: number;
    support: boolean;
    voteWeight?: number;
  }
): Promise<TxResult> {
  const addr = CONTRACTS.CipherGovernance;
  if (!addr) throw new Error("CipherGovernance contract not deployed");

  const encWeight = await encryptUint32ForContract(
    walletClient,
    publicClient,
    params.voteWeight ?? 1
  );

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_GOVERNANCE_ABI,
    functionName: "castVote",
    args: [BigInt(params.proposalId), toInEuint32(encWeight), params.support],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Create a governance proposal on-chain.
 */
export async function onChainCreateProposal(
  params: { title: string; description: string }
): Promise<TxResult> {
  const addr = CONTRACTS.CipherGovernance;
  if (!addr) throw new Error("CipherGovernance contract not deployed");

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_GOVERNANCE_ABI,
    functionName: "createProposal",
    args: [params.title, params.description],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Store a credential in the CipherVault with real FHE encryption.
 * credType: 0=Salary, 1=Experience, 2=SkillScore, 3=Custom
 */
export async function onChainStoreCredential(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    value: number;
    credType: 0 | 1 | 2 | 3;
    label: string;
  }
): Promise<TxResult> {
  const addr = CONTRACTS.CipherVault;
  if (!addr) throw new Error("CipherVault contract not deployed");

  const encValue = await encryptUint32ForContract(walletClient, publicClient, params.value);

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_VAULT_ABI,
    functionName: "storeCredential",
    args: [toInEuint32(encValue), params.credType, params.label],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Revoke a credential from the CipherVault.
 */
export async function onChainRevokeCredential(index: number): Promise<TxResult> {
  const addr = CONTRACTS.CipherVault;
  if (!addr) throw new Error("CipherVault contract not deployed");

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_VAULT_ABI,
    functionName: "revokeCredential",
    args: [BigInt(index)],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Set stealth mode on CipherStealth contract.
 * mode: 0=None, 1=FullStealth, 2=TimeLocked, 3=Allowlist
 */
export async function onChainSetStealthMode(mode: 0 | 1 | 2 | 3): Promise<TxResult> {
  const addr = CONTRACTS.CipherStealth;
  if (!addr) throw new Error("CipherStealth contract not deployed");

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_STEALTH_ABI,
    functionName: "setStealthMode",
    args: [mode],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Set a time lock on CipherStealth contract.
 */
export async function onChainSetTimeLock(unlockDate: Date): Promise<TxResult> {
  const addr = CONTRACTS.CipherStealth;
  if (!addr) throw new Error("CipherStealth contract not deployed");

  const unlockTimestamp = BigInt(Math.floor(unlockDate.getTime() / 1000));

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_STEALTH_ABI,
    functionName: "setTimeLock",
    args: [unlockTimestamp],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Block a domain hash on CipherStealth contract.
 */
export async function onChainBlockDomain(domainHash: `0x${string}`): Promise<TxResult> {
  const addr = CONTRACTS.CipherStealth;
  if (!addr) throw new Error("CipherStealth contract not deployed");

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_STEALTH_ABI,
    functionName: "blockDomain",
    args: [domainHash],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Give candidate consent on CipherCV contract.
 */
export async function onChainCandidateConsent(employerAddr: `0x${string}`): Promise<TxResult> {
  const addr = CONTRACTS.CipherCV;
  if (!addr) throw new Error("CipherCV contract not deployed");

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_CV_ABI,
    functionName: "candidateConsent",
    args: [employerAddr],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Give employer consent on CipherCV contract.
 */
export async function onChainEmployerConsent(candidateAddr: `0x${string}`): Promise<TxResult> {
  const addr = CONTRACTS.CipherCV;
  if (!addr) throw new Error("CipherCV contract not deployed");

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_CV_ABI,
    functionName: "employerConsent",
    args: [candidateAddr],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}

/**
 * Request a counter-offer computation on CipherCounterOffer contract with real FHE encryption.
 */
export async function onChainRequestCounterOffer(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    currentSalary: number;
    targetIncrease: number;
    yearsAtCompany: number;
    role: string;
  }
): Promise<TxResult> {
  const addr = CONTRACTS.CipherCounterOffer;
  if (!addr) throw new Error("CipherCounterOffer contract not deployed");

  const [encSalary, encIncrease, encYears] = await Promise.all([
    encryptUint32ForContract(walletClient, publicClient, params.currentSalary),
    encryptUint32ForContract(walletClient, publicClient, params.targetIncrease),
    encryptUint32ForContract(walletClient, publicClient, params.yearsAtCompany),
  ]);

  const hash = await writeContract(wagmiConfig, {
    address: addr as `0x${string}`,
    abi: CIPHER_COUNTER_OFFER_ABI,
    functionName: "requestCounterOffer",
    args: [toInEuint32(encSalary), toInEuint32(encIncrease), toInEuint32(encYears), params.role],
  });

  return { hash, explorerUrl: getTxExplorerUrl(hash, getExplorerNetwork()) };
}