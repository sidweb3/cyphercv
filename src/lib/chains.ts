import { defineChain } from 'viem';
import { arbitrumSepolia, sepolia, baseSepolia } from 'wagmi/chains';

// CoFHE supported testnets
export { arbitrumSepolia, sepolia as ethereumSepolia, baseSepolia };

// Default CoFHE chain (Arbitrum Sepolia — lowest gas costs)
export const defaultCoFheChain = arbitrumSepolia;

// Legacy: Fhenix Frontier (kept for backward compat, no longer primary)
export const fhenixTestnet = defineChain({
  id: 8008135,
  name: 'Fhenix Frontier Testnet (Legacy)',
  nativeCurrency: { name: 'tFHX', symbol: 'tFHX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.fhenix.zone'] },
    public: { http: ['https://rpc.testnet.fhenix.zone'] },
  },
  blockExplorers: {
    default: { name: 'Fhenix Explorer', url: 'https://explorer.testnet.fhenix.zone' },
  },
  testnet: true,
});