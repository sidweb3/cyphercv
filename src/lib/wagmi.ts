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

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, sepolia, baseSepolia, mainnet],
  connectors: [
    injectedConnector,
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
  },
});