import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// CoFHE Hardhat plugin — deploys mock contracts and exposes cofhe utilities
// Install: pnpm add -D cofhe-hardhat-plugin
// import "cofhe-hardhat-plugin";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const ARB_SEPOLIA_RPC_URL = process.env.ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // ─── CoFHE Supported Testnets ─────────────────────────────────────────────
    // Arbitrum Sepolia — recommended (lowest gas costs)
    arbSepolia: {
      url: ARB_SEPOLIA_RPC_URL,
      chainId: 421614,
      accounts: [PRIVATE_KEY],
    },
    // Ethereum Sepolia — main Ethereum testnet
    ethSepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },
    // Base Sepolia — Coinbase L2 testnet
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: [PRIVATE_KEY],
    },
    // ─── Local Mock Environment ───────────────────────────────────────────────
    // Uses cofhe-mock-contracts for rapid local development
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;