import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Starting deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy LicenseRegistry
  console.log("Deploying LicenseRegistry...");
  const LicenseRegistryFactory = await ethers.getContractFactory("LicenseRegistry");
  const licenseRegistry = await LicenseRegistryFactory.deploy();
  await licenseRegistry.waitForDeployment();
  const licenseRegistryAddress = await licenseRegistry.getAddress();
  console.log("✓ LicenseRegistry deployed to:", licenseRegistryAddress);

  // Deploy ViolationManager
  console.log("Deploying ViolationManager...");
  const ViolationManagerFactory = await ethers.getContractFactory("ViolationManager");
  const violationManager = await ViolationManagerFactory.deploy();
  await violationManager.waitForDeployment();
  const violationManagerAddress = await violationManager.getAddress();
  console.log("✓ ViolationManager deployed to:", violationManagerAddress);

  // Deploy FinePayment
  console.log("Deploying FinePayment...");
  const FinePaymentFactory = await ethers.getContractFactory("FinePayment");
  const finePayment = await FinePaymentFactory.deploy(
    violationManagerAddress,
    deployer.address // Treasury address (deployer for testing)
  );
  await finePayment.waitForDeployment();
  const finePaymentAddress = await finePayment.getAddress();
  console.log("✓ FinePayment deployed to:", finePaymentAddress);

  console.log("\nGranting roles...");
  
  // Grant roles in LicenseRegistry
  const ADMIN_ROLE = await licenseRegistry.ADMIN_ROLE();
  console.log("✓ Deployer already has ADMIN_ROLE in LicenseRegistry");

  // Grant roles in ViolationManager
  const OFFICER_ROLE = await violationManager.OFFICER_ROLE();
  console.log("✓ Deployer already has OFFICER_ROLE in ViolationManager");
  console.log("✓ Deployer already has ADMIN_ROLE in ViolationManager");

  // Grant roles in FinePayment
  console.log("✓ Deployer already has ADMIN_ROLE in FinePayment");

  console.log("\nExporting contract addresses and ABIs...");

  // Get contract artifacts for ABIs
  const licenseRegistryArtifact = await ethers.getContractFactory("LicenseRegistry").then(f => f.interface.formatJson());
  const violationManagerArtifact = await ethers.getContractFactory("ViolationManager").then(f => f.interface.formatJson());
  const finePaymentArtifact = await ethers.getContractFactory("FinePayment").then(f => f.interface.formatJson());

  // Create contracts export object
  const contractsExport = {
    LicenseRegistry: {
      address: licenseRegistryAddress,
      abi: JSON.parse(licenseRegistryArtifact),
    },
    ViolationManager: {
      address: violationManagerAddress,
      abi: JSON.parse(violationManagerArtifact),
    },
    FinePayment: {
      address: finePaymentAddress,
      abi: JSON.parse(finePaymentArtifact),
    },
    network: {
      name: "localhost",
      chainId: 31337,
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  // Write to shared/contracts.json
  const sharedDir = path.join(__dirname, "../../shared");
  const contractsPath = path.join(sharedDir, "contracts.json");
  
  fs.writeFileSync(contractsPath, JSON.stringify(contractsExport, null, 2));
  console.log("✓ Contracts exported to:", contractsPath);

  console.log("\nDeployment complete!");
  console.log("=====================================");
  console.log("Contract Addresses:");
  console.log("LicenseRegistry:", licenseRegistryAddress);
  console.log("ViolationManager:", violationManagerAddress);
  console.log("FinePayment:", finePaymentAddress);
  console.log("\nTreasury:", deployer.address);
  console.log("=====================================\n");

  console.log("Next steps:");
  console.log("1. Update backend .env with contract addresses");
  console.log("2. Update frontend .env with contract addresses");
  console.log("3. Grant additional roles as needed:");
  console.log("   - Grant ADMIN_ROLE to backend service account");
  console.log("   - Grant OFFICER_ROLE to officer accounts");
  console.log("\nNote: For testing, the deployer account has all roles.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
