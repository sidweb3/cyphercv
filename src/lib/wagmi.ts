import { createConfig, http } from 'wagmi';
import { mainnet, arbitrumSepolia, sepolia, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Safe injected connector — won't throw if window.ethereum is absent
const injectedConnector = injected({
  target() {
    return {
      id: 'injected',
      name: 'Browser Wallet',
      provider: typeof window !== 'undefined' ? (window as any).ethereum : undefined,
    };
  },
});

// Use CORS-friendly public RPCs to avoid eth.merkle.io CORS blocks
const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const ARB_SEPOLIA_RPC = import.meta.env.VITE_ARB_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const BASE_SEPOLIA_RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
const MAINNET_RPC = import.meta.env.VITE_MAINNET_RPC_URL || 'https://ethereum-rpc.publicnode.com';

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, sepolia, baseSepolia, mainnet],
  connectors: [
    injectedConnector,
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [arbitrumSepolia.id]: http(ARB_SEPOLIA_RPC),
    [sepolia.id]: http(SEPOLIA_RPC),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC),
    [mainnet.id]: http(MAINNET_RPC),
  },
});