import { createConfig, http } from 'wagmi';
import { mainnet, arbitrumSepolia, sepolia, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, sepolia, baseSepolia, mainnet],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
  },
});