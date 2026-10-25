import { expect } from "chai";
import { ethers } from "hardhat";
import { LicenseRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("LicenseRegistry", function () {
  let licenseRegistry: LicenseRegistry;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let licenseHash1: string;
  let licenseHash2: string;
  let futureExpiry: number;

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    const LicenseRegistryFactory = await ethers.getContractFactory("LicenseRegistry");
    licenseRegistry = await LicenseRegistryFactory.deploy();
    await licenseRegistry.waitForDeployment();

    // Create test license hashes
    licenseHash1 = ethers.keccak256(ethers.toUtf8Bytes("LICENSE-001"));
    licenseHash2 = ethers.keccak256(ethers.toUtf8Bytes("LICENSE-002"));

    // Set future expiry (1 year from now)
    futureExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      const ADMIN_ROLE = await licenseRegistry.ADMIN_ROLE();
      expect(await licenseRegistry.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should start unpaused", async function () {
      expect(await licenseRegistry.paused()).to.be.false;
    });
  });

  describe("License Issuance", function () {
    it("Should issue a new license by admin", async function () {
      const tx = await licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      await expect(tx)
        .to.emit(licenseRegistry, "LicenseIssued")
        .withArgs(licenseHash1, user1.address, futureExpiry, block!.timestamp);

      const [status, expiry, owner, issuedAt] = await licenseRegistry.getLicenseData(licenseHash1);
      expect(status).to.equal(0); // Active
      expect(expiry).to.equal(futureExpiry);
      expect(owner).to.equal(user1.address);
      expect(issuedAt).to.be.greaterThan(0);
    });

    it("Should fail when non-admin tries to issue license", async function () {
      await expect(
        licenseRegistry.connect(user1).issueLicense(user2.address, licenseHash1, futureExpiry)
      ).to.be.reverted;
    });

    it("Should fail when issuing duplicate license", async function () {
      await licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry);
      
      await expect(
        licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry)
      ).to.be.revertedWithCustomError(licenseRegistry, "LicenseAlreadyExists");
    });

    it("Should fail when expiry is in the past", async function () {
      const pastExpiry = Math.floor(Date.now() / 1000) - 1000;
      
      await expect(
        licenseRegistry.issueLicense(user1.address, licenseHash1, pastExpiry)
      ).to.be.revertedWithCustomError(licenseRegistry, "InvalidExpiry");
    });
  });

  describe("License Renewal", function () {
    beforeEach(async function () {
      await licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry);
    });

    it("Should renew an existing license", async function () {
      const newExpiry = futureExpiry + 365 * 24 * 60 * 60; // Add another year
      
      const tx = await licenseRegistry.renewLicense(licenseHash1, newExpiry);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      await expect(tx)
        .to.emit(licenseRegistry, "LicenseRenewed")
        .withArgs(licenseHash1, newExpiry, block!.timestamp);

      const [, expiry] = await licenseRegistry.getLicenseData(licenseHash1);
      expect(expiry).to.equal(newExpiry);
    });

    it("Should fail when renewing non-existent license", async function () {
      const newExpiry = futureExpiry + 365 * 24 * 60 * 60;
      
      await expect(
        licenseRegistry.renewLicense(licenseHash2, newExpiry)
      ).to.be.revertedWithCustomError(licenseRegistry, "LicenseNotFound");
    });

    it("Should reactivate a suspended license when renewed", async function () {
      await licenseRegistry.suspendLicense(licenseHash1, "Test suspension");
      
      const newExpiry = futureExpiry + 365 * 24 * 60 * 60;
      await licenseRegistry.renewLicense(licenseHash1, newExpiry);

      const [status] = await licenseRegistry.getLicenseData(licenseHash1);
      expect(status).to.equal(0); // Active
    });

    it("Should fail when renewing revoked license", async function () {
      await licenseRegistry.revokeLicense(licenseHash1, "Test revocation");
      
      const newExpiry = futureExpiry + 365 * 24 * 60 * 60;
      await expect(
        licenseRegistry.renewLicense(licenseHash1, newExpiry)
      ).to.be.revertedWithCustomError(licenseRegistry, "LicenseAlreadyRevoked");
    });
  });

  describe("License Suspension", function () {
    beforeEach(async function () {
      await licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry);
    });

    it("Should suspend a license", async function () {
      const reason = "Traffic violation";
      
      const tx = await licenseRegistry.suspendLicense(licenseHash1, reason);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      await expect(tx)
        .to.emit(licenseRegistry, "LicenseSuspended")
        .withArgs(licenseHash1, reason, block!.timestamp);

      const [status] = await licenseRegistry.getLicenseData(licenseHash1);
      expect(status).to.equal(1); // Suspended
    });

    it("Should emit status changed event", async function () {
      const tx = await licenseRegistry.suspendLicense(licenseHash1, "Test");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      await expect(tx)
        .to.emit(licenseRegistry, "LicenseStatusChanged")
        .withArgs(licenseHash1, 0, 1, block!.timestamp); // Active to Suspended
    });

    it("Should fail when suspending non-existent license", async function () {
      await expect(
        licenseRegistry.suspendLicense(licenseHash2, "Test")
      ).to.be.revertedWithCustomError(licenseRegistry, "LicenseNotFound");
    });

    it("Should fail when suspending revoked license", async function () {
      await licenseRegistry.revokeLicense(licenseHash1, "Test");
      
      await expect(
        licenseRegistry.suspendLicense(licenseHash1, "Test")
      ).to.be.revertedWithCustomError(licenseRegistry, "LicenseAlreadyRevoked");
    });
  });

  describe("License Revocation", function () {
    beforeEach(async function () {
      await licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry);
    });

    it("Should revoke a license", async function () {
      const reason = "Fraudulent license";
      
      const tx = await licenseRegistry.revokeLicense(licenseHash1, reason);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      await expect(tx)
        .to.emit(licenseRegistry, "LicenseRevoked")
        .withArgs(licenseHash1, reason, block!.timestamp);

      const [status] = await licenseRegistry.getLicenseData(licenseHash1);
      expect(status).to.equal(2); // Revoked
    });

    it("Should fail when revoking already revoked license", async function () {
      await licenseRegistry.revokeLicense(licenseHash1, "Test");
      
      await expect(
        licenseRegistry.revokeLicense(licenseHash1, "Test again")
      ).to.be.revertedWithCustomError(licenseRegistry, "LicenseAlreadyRevoked");
    });

    it("Should fail when revoking non-existent license", async function () {
      await expect(
        licenseRegistry.revokeLicense(licenseHash2, "Test")
      ).to.be.revertedWithCustomError(licenseRegistry, "LicenseNotFound");
    });
  });

  describe("License Verification", function () {
    beforeEach(async function () {
      await licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry);
    });

    it("Should verify active license as valid", async function () {
      expect(await licenseRegistry.verifyLicense(licenseHash1)).to.be.true;
    });

    it("Should verify suspended license as invalid", async function () {
      await licenseRegistry.suspendLicense(licenseHash1, "Test");
      expect(await licenseRegistry.verifyLicense(licenseHash1)).to.be.false;
    });

    it("Should verify revoked license as invalid", async function () {
      await licenseRegistry.revokeLicense(licenseHash1, "Test");
      expect(await licenseRegistry.verifyLicense(licenseHash1)).to.be.false;
    });

    it("Should verify expired license as invalid", async function () {
      const shortExpiry = (await time.latest()) + 100;
      await licenseRegistry.issueLicense(user2.address, licenseHash2, shortExpiry);
      
      // Fast forward time
      await time.increase(101);
      
      expect(await licenseRegistry.verifyLicense(licenseHash2)).to.be.false;
    });

    it("Should verify non-existent license as invalid", async function () {
      expect(await licenseRegistry.verifyLicense(licenseHash2)).to.be.false;
    });
  });

  describe("License Data Retrieval", function () {
    it("Should get license data correctly", async function () {
      await licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry);
      
      const [status, expiry, owner, issuedAt] = await licenseRegistry.getLicenseData(licenseHash1);
      
      expect(status).to.equal(0); // Active
      expect(expiry).to.equal(futureExpiry);
      expect(owner).to.equal(user1.address);
      expect(issuedAt).to.be.greaterThan(0);
    });

    it("Should return Expired status for expired license", async function () {
      const shortExpiry = (await time.latest()) + 100;
      await licenseRegistry.issueLicense(user1.address, licenseHash1, shortExpiry);
      
      // Fast forward time
      await time.increase(101);
      
      const [status] = await licenseRegistry.getLicenseData(licenseHash1);
      expect(status).to.equal(3); // Expired
    });

    it("Should fail when getting non-existent license", async function () {
      await expect(
        licenseRegistry.getLicenseData(licenseHash1)
      ).to.be.revertedWithCustomError(licenseRegistry, "LicenseNotFound");
    });

    it("Should check if license exists", async function () {
      expect(await licenseRegistry.licenseExists(licenseHash1)).to.be.false;
      
      await licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry);
      
      expect(await licenseRegistry.licenseExists(licenseHash1)).to.be.true;
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause by admin", async function () {
      await licenseRegistry.pause();
      expect(await licenseRegistry.paused()).to.be.true;
      
      await licenseRegistry.unpause();
      expect(await licenseRegistry.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      await licenseRegistry.pause();
      
      await expect(
        licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry)
      ).to.be.revertedWithCustomError(licenseRegistry, "EnforcedPause");
    });

    it("Should allow operations after unpause", async function () {
      await licenseRegistry.pause();
      await licenseRegistry.unpause();
      
      await expect(
        licenseRegistry.issueLicense(user1.address, licenseHash1, futureExpiry)
      ).to.not.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("Should grant ADMIN_ROLE to new address", async function () {
      const ADMIN_ROLE = await licenseRegistry.ADMIN_ROLE();
      await licenseRegistry.grantRole(ADMIN_ROLE, user1.address);
      
      expect(await licenseRegistry.hasRole(ADMIN_ROLE, user1.address)).to.be.true;
      
      // user1 should now be able to issue licenses
      await expect(
        licenseRegistry.connect(user1).issueLicense(user2.address, licenseHash1, futureExpiry)
      ).to.not.be.reverted;
    });

    it("Should revoke ADMIN_ROLE from address", async function () {
      const ADMIN_ROLE = await licenseRegistry.ADMIN_ROLE();
      await licenseRegistry.grantRole(ADMIN_ROLE, user1.address);
      await licenseRegistry.revokeRole(ADMIN_ROLE, user1.address);
      
      expect(await licenseRegistry.hasRole(ADMIN_ROLE, user1.address)).to.be.false;
      
      await expect(
        licenseRegistry.connect(user1).issueLicense(user2.address, licenseHash1, futureExpiry)
      ).to.be.reverted;
    });
  });
});
