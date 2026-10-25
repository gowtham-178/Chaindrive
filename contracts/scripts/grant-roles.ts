import { ethers } from "hardhat";
import contractsData from "../../shared/contracts.json";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("Usage: npx hardhat run scripts/grant-roles.ts --network localhost <role> <address>");
    console.log("\nRoles:");
    console.log("  admin-license    - Grant ADMIN_ROLE in LicenseRegistry");
    console.log("  admin-violation  - Grant ADMIN_ROLE in ViolationManager");
    console.log("  admin-payment    - Grant ADMIN_ROLE in FinePayment");
    console.log("  officer          - Grant OFFICER_ROLE in ViolationManager");
    console.log("\nExample:");
    console.log("  npx hardhat run scripts/grant-roles.ts --network localhost officer 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
    process.exit(1);
  }

  const [role, address] = args;

  console.log("Granting role...\n");
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Validate address
  if (!ethers.isAddress(address)) {
    console.error("Error: Invalid Ethereum address");
    process.exit(1);
  }

  let contractAddress: string;
  let roleBytes: string;
  let roleName: string;

  switch (role) {
    case "admin-license":
      contractAddress = contractsData.LicenseRegistry.address;
      const licenseRegistry = await ethers.getContractAt("LicenseRegistry", contractAddress);
      roleBytes = await licenseRegistry.ADMIN_ROLE();
      roleName = "ADMIN_ROLE";
      await licenseRegistry.grantRole(roleBytes, address);
      console.log(`✓ Granted ${roleName} in LicenseRegistry to ${address}`);
      break;

    case "admin-violation":
      contractAddress = contractsData.ViolationManager.address;
      const violationManager = await ethers.getContractAt("ViolationManager", contractAddress);
      roleBytes = await violationManager.ADMIN_ROLE();
      roleName = "ADMIN_ROLE";
      await violationManager.grantRole(roleBytes, address);
      console.log(`✓ Granted ${roleName} in ViolationManager to ${address}`);
      break;

    case "admin-payment":
      contractAddress = contractsData.FinePayment.address;
      const finePayment = await ethers.getContractAt("FinePayment", contractAddress);
      roleBytes = await finePayment.ADMIN_ROLE();
      roleName = "ADMIN_ROLE";
      await finePayment.grantRole(roleBytes, address);
      console.log(`✓ Granted ${roleName} in FinePayment to ${address}`);
      break;

    case "officer":
      contractAddress = contractsData.ViolationManager.address;
      const violationMgr = await ethers.getContractAt("ViolationManager", contractAddress);
      roleBytes = await violationMgr.OFFICER_ROLE();
      roleName = "OFFICER_ROLE";
      await violationMgr.grantRole(roleBytes, address);
      console.log(`✓ Granted ${roleName} in ViolationManager to ${address}`);
      break;

    default:
      console.error(`Error: Unknown role "${role}"`);
      process.exit(1);
  }

  console.log("\nRole granted successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
