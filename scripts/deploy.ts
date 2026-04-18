import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  const networkNames: Record<string, string> = {
    "421614": "Arbitrum Sepolia",
    "11155111": "Ethereum Sepolia",
    "84532": "Base Sepolia",
    "31337": "Hardhat Local (Mock)",
  };

  const explorerBases: Record<string, string> = {
    "421614": "https://sepolia.arbiscan.io/address/",
    "11155111": "https://sepolia.etherscan.io/address/",
    "84532": "https://sepolia.basescan.org/address/",
    "31337": "http://localhost/address/",
  };

  const chainId = network.chainId.toString();
  const networkName = networkNames[chainId] || `Chain ${chainId}`;
  const explorerBase = explorerBases[chainId] || "";

  console.log("═══════════════════════════════════════════════════════");
  console.log("  Cipher CV — Full Protocol Deployment");
  console.log(`  Network: ${networkName} (Chain ID ${chainId})`);
  console.log("═══════════════════════════════════════════════════════");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("");

  const deployed: Record<string, string> = {};

  // ─── 1. CipherRegistry ────────────────────────────────────────────────────
  console.log("1/8 Deploying CipherRegistry...");
  const CipherRegistry = await ethers.getContractFactory("CipherRegistry");
  const registry = await CipherRegistry.deploy();
  await registry.waitForDeployment();
  deployed.CipherRegistry = await registry.getAddress();
  console.log("   ✅ CipherRegistry:", deployed.CipherRegistry);

  // ─── 2. CipherCV ─────────────────────────────────────────────────────────
  console.log("2/8 Deploying CipherCV...");
  const CipherCV = await ethers.getContractFactory("CipherCV");
  const cipherCV = await CipherCV.deploy();
  await cipherCV.waitForDeployment();
  deployed.CipherCV = await cipherCV.getAddress();
  console.log("   ✅ CipherCV:", deployed.CipherCV);

  // ─── 3. CipherVault ───────────────────────────────────────────────────────
  console.log("3/8 Deploying CipherVault...");
  const CipherVault = await ethers.getContractFactory("CipherVault");
  const vault = await CipherVault.deploy();
  await vault.waitForDeployment();
  deployed.CipherVault = await vault.getAddress();
  console.log("   ✅ CipherVault:", deployed.CipherVault);

  // ─── 4. CipherGovernance ──────────────────────────────────────────────────
  console.log("4/8 Deploying CipherGovernance...");
  const CipherGovernance = await ethers.getContractFactory("CipherGovernance");
  const governance = await CipherGovernance.deploy();
  await governance.waitForDeployment();
  deployed.CipherGovernance = await governance.getAddress();
  console.log("   ✅ CipherGovernance:", deployed.CipherGovernance);

  // ─── 5. CipherEscrow ──────────────────────────────────────────────────────
  console.log("5/8 Deploying CipherEscrow...");
  const CipherEscrow = await ethers.getContractFactory("CipherEscrow");
  const escrow = await CipherEscrow.deploy(deployer.address);
  await escrow.waitForDeployment();
  deployed.CipherEscrow = await escrow.getAddress();
  console.log("   ✅ CipherEscrow:", deployed.CipherEscrow);

  // ─── 6. CipherCounterOffer ────────────────────────────────────────────────
  console.log("6/8 Deploying CipherCounterOffer...");
  const CipherCounterOffer = await ethers.getContractFactory("CipherCounterOffer");
  const counterOffer = await CipherCounterOffer.deploy();
  await counterOffer.waitForDeployment();
  deployed.CipherCounterOffer = await counterOffer.getAddress();
  console.log("   ✅ CipherCounterOffer:", deployed.CipherCounterOffer);

  // ─── 7. CipherStealth ─────────────────────────────────────────────────────
  console.log("7/8 Deploying CipherStealth...");
  const CipherStealth = await ethers.getContractFactory("CipherStealth");
  const stealth = await CipherStealth.deploy();
  await stealth.waitForDeployment();
  deployed.CipherStealth = await stealth.getAddress();
  console.log("   ✅ CipherStealth:", deployed.CipherStealth);

  // ─── 8. CipherBatchMatcher ────────────────────────────────────────────────
  console.log("8/8 Deploying CipherBatchMatcher...");
  const CipherBatchMatcher = await ethers.getContractFactory("CipherBatchMatcher");
  const batchMatcher = await CipherBatchMatcher.deploy(deployed.CipherCV);
  await batchMatcher.waitForDeployment();
  deployed.CipherBatchMatcher = await batchMatcher.getAddress();
  console.log("   ✅ CipherBatchMatcher:", deployed.CipherBatchMatcher);

  // ─── Register all contracts in CipherRegistry ────────────────────────────
  console.log("\nRegistering contracts in CipherRegistry...");
  const contractsToRegister = [
    { name: "CipherCV", version: "1.0.0", address: deployed.CipherCV },
    { name: "CipherVault", version: "1.0.0", address: deployed.CipherVault },
    { name: "CipherGovernance", version: "1.0.0", address: deployed.CipherGovernance },
    { name: "CipherEscrow", version: "1.0.0", address: deployed.CipherEscrow },
    { name: "CipherCounterOffer", version: "1.0.0", address: deployed.CipherCounterOffer },
    { name: "CipherStealth", version: "1.0.0", address: deployed.CipherStealth },
    { name: "CipherBatchMatcher", version: "1.0.0", address: deployed.CipherBatchMatcher },
  ];

  for (const contract of contractsToRegister) {
    await registry.register(contract.name, contract.version, contract.address);
    console.log(`   ✅ Registered ${contract.name} v${contract.version}`);
  }

  // ─── Output ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Deployment Complete!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\nAdd these to your .env.local:\n");
  for (const [name, address] of Object.entries(deployed)) {
    const envKey = `VITE_${name.replace(/([A-Z])/g, '_$1').toUpperCase().slice(1)}_CONTRACT`;
    console.log(`${envKey}=${address}`);
  }

  console.log("\nExplorer links:");
  for (const [name, address] of Object.entries(deployed)) {
    console.log(`  ${name}: ${explorerBase}${address}`);
  }

  console.log("\nCipherRegistry (source of truth):", deployed.CipherRegistry);
  console.log("  → Frontend can discover all addresses via registry.getAddress(name)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
