require("@nomicfoundation/hardhat-ethers");

const rawPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const PRIVATE_KEY = rawPrivateKey
    ? (rawPrivateKey.startsWith("0x") ? rawPrivateKey : `0x${rawPrivateKey}`)
    : "0x" + "0".repeat(64);
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const ARB_SEPOLIA_RPC_URL = process.env.ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            evmVersion: "cancun",
        },
    },
    networks: {
        arbSepolia: {
            url: ARB_SEPOLIA_RPC_URL,
            chainId: 421614,
            accounts: [PRIVATE_KEY],
        },
        ethSepolia: {
            url: SEPOLIA_RPC_URL,
            chainId: 11155111,
            accounts: [PRIVATE_KEY],
        },
        baseSepolia: {
            url: BASE_SEPOLIA_RPC_URL,
            chainId: 84532,
            accounts: [PRIVATE_KEY],
        },
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
