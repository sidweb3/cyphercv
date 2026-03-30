import { defineChain } from 'viem';

export const fhenixTestnet = defineChain({
  id: 8008135,
  name: 'Fhenix Frontier Testnet',
  nativeCurrency: { name: 'tFHX', symbol: 'tFHX', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.fhenix.zone'],
    },
    public: {
      http: ['https://rpc.testnet.fhenix.zone'],
    },
  },
  blockExplorers: {
    default: { name: 'Fhenix Explorer', url: 'https://explorer.testnet.fhenix.zone' },
  },
  testnet: true,
});
