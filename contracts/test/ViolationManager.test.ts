import { expect } from "chai";
import { ethers } from "hardhat";
import { ViolationManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ViolationManager", function () {
  let violationManager: ViolationManager;
  let admin: SignerWithAddress;
  let officer1: SignerWithAddress;
  let officer2: SignerWithAddress;
  let driver1: SignerWithAddress;
  let driver2: SignerWithAddress;
  let violationHash1: string;
  let violationHash2: string;
  let disputeHash: string;
  let resolutionHash: string;
  let fineAmount: bigint;
  let futureDueDate: number;

  beforeEach(async function () {
    [admin, officer1, officer2, driver1, driver2] = await ethers.getSigners();

    const ViolationManagerFactory = await ethers.getContractFactory("ViolationManager");
    violationManager = await ViolationManagerFactory.deploy();
    await violationManager.waitForDeployment();

    // Grant officer role
    const OFFICER_ROLE = await violationManager.OFFICER_ROLE();
    await violationManager.grantRole(OFFICER_ROLE, officer1.address);
    await violationManager.grantRole(OFFICER_ROLE, officer2.address);

    // Create test hashes
    violationHash1 = ethers.keccak256(ethers.toUtf8Bytes("VIOLATION-001"));
    violationHash2 = ethers.keccak256(ethers.toUtf8Bytes("VIOLATION-002"));
    disputeHash = ethers.keccak256(ethers.toUtf8Bytes("DISPUTE-001"));
    resolutionHash = ethers.keccak256(ethers.toUtf8Bytes("RESOLUTION-001"));

    // Set fine amount and due date
    fineAmount = ethers.parseEther("0.01"); // 0.01 ETH
    futureDueDate = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin and officer", async function () {
      const ADMIN_ROLE = await violationManager.ADMIN_ROLE();
      const OFFICER_ROLE = await violationManager.OFFICER_ROLE();
      
      expect(await violationManager.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await violationManager.hasRole(OFFICER_ROLE, admin.address)).to.be.true;
    });

    it("Should start with zero violations", async function () {
      expect(await violationManager.getTotalViolations()).to.equal(0);
    });

    it("Should start unpaused", async function () {
      expect(await violationManager.paused()).to.be.false;
    });
  });

  describe("Violation Recording", function () {
    it("Should record a violation by officer", async function () {
      const tx = await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);
      
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(violationManager, "ViolationRecorded")
        .withArgs(
          0, // violationId
          violationHash1,
          driver1.address,
          officer1.address,
          fineAmount,
          futureDueDate,
          block!.timestamp
        );

      const [hash, driver, officer, fine, dueDate, status] = 
        await violationManager.getViolation(0);

      expect(hash).to.equal(violationHash1);
      expect(driver).to.equal(driver1.address);
      expect(officer).to.equal(officer1.address);
      expect(fine).to.equal(fineAmount);
      expect(dueDate).to.equal(futureDueDate);
      expect(status).to.equal(0); // Pending
    });

    it("Should increment violation counter", async function () {
      await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);

      expect(await violationManager.getTotalViolations()).to.equal(1);

      await violationManager
        .connect(officer1)
        .recordViolation(violationHash2, driver2.address, fineAmount, futureDueDate);

      expect(await violationManager.getTotalViolations()).to.equal(2);
    });

    it("Should fail when non-officer tries to record", async function () {
      await expect(
        violationManager
          .connect(driver1)
          .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate)
      ).to.be.reverted;
    });

    it("Should fail with zero fine amount", async function () {
      await expect(
        violationManager
          .connect(officer1)
          .recordViolation(violationHash1, driver1.address, 0, futureDueDate)
      ).to.be.revertedWithCustomError(violationManager, "InvalidFineAmount");
    });

    it("Should fail with zero driver address", async function () {
      await expect(
        violationManager
          .connect(officer1)
          .recordViolation(violationHash1, ethers.ZeroAddress, fineAmount, futureDueDate)
      ).to.be.revertedWithCustomError(violationManager, "UnauthorizedAccess");
    });

    it("Should fail with past due date", async function () {
      const pastDueDate = Math.floor(Date.now() / 1000) - 1000;

      await expect(
        violationManager
          .connect(officer1)
          .recordViolation(violationHash1, driver1.address, fineAmount, pastDueDate)
      ).to.be.revertedWithCustomError(violationManager, "InvalidStatus");
    });
  });

  describe("Violation Dispute", function () {
    let violationId: number;

    beforeEach(async function () {
      const tx = await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);
      await tx.wait();
      violationId = 0;
    });

    it("Should allow driver to dispute their violation", async function () {
      const tx = await violationManager
        .connect(driver1)
        .disputeViolation(violationId, disputeHash);
      
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(violationManager, "ViolationDisputed")
        .withArgs(violationId, disputeHash, block!.timestamp);

      const [, , , , , status, storedDisputeHash] = 
        await violationManager.getViolation(violationId);
      
      expect(status).to.equal(2); // Disputed
      expect(storedDisputeHash).to.equal(disputeHash);
    });

    it("Should fail when non-driver tries to dispute", async function () {
      await expect(
        violationManager
          .connect(driver2)
          .disputeViolation(violationId, disputeHash)
      ).to.be.revertedWithCustomError(violationManager, "UnauthorizedAccess");
    });

    it("Should fail when disputing non-existent violation", async function () {
      await expect(
        violationManager
          .connect(driver1)
          .disputeViolation(999, disputeHash)
      ).to.be.revertedWithCustomError(violationManager, "ViolationNotFound");
    });

    it("Should fail when disputing paid violation", async function () {
      await violationManager.markAsPaid(violationId);

      await expect(
        violationManager
          .connect(driver1)
          .disputeViolation(violationId, disputeHash)
      ).to.be.revertedWithCustomError(violationManager, "CannotDisputePaidViolation");
    });

    it("Should allow disputing already disputed violation", async function () {
      await violationManager
        .connect(driver1)
        .disputeViolation(violationId, disputeHash);

      // Should not revert
      await expect(
        violationManager
          .connect(driver1)
          .disputeViolation(violationId, ethers.keccak256(ethers.toUtf8Bytes("NEW-DISPUTE")))
      ).to.not.be.reverted;
    });
  });

  describe("Dispute Resolution", function () {
    let violationId: number;

    beforeEach(async function () {
      const tx = await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);
      await tx.wait();
      violationId = 0;

      await violationManager
        .connect(driver1)
        .disputeViolation(violationId, disputeHash);
    });

    it("Should resolve dispute as upheld by admin", async function () {
      const tx = await violationManager
        .connect(admin)
        .resolveDispute(violationId, true, 0, resolutionHash);
      
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(violationManager, "DisputeResolved")
        .withArgs(violationId, true, 0, resolutionHash, block!.timestamp);

      const [, , , , , status] = await violationManager.getViolation(violationId);
      expect(status).to.equal(3); // Resolved
    });

    it("Should resolve dispute as dismissed by admin", async function () {
      const tx = await violationManager
        .connect(admin)
        .resolveDispute(violationId, false, 0, resolutionHash);

      await expect(tx)
        .to.emit(violationManager, "DisputeResolved")
        .withArgs(violationId, false, 0, resolutionHash, await time.latest());

      const [, , , , , status] = await violationManager.getViolation(violationId);
      expect(status).to.equal(0); // Pending (for payment)
    });

    it("Should resolve dispute with adjusted fine", async function () {
      const adjustedFine = ethers.parseEther("0.005"); // Reduced fine

      await violationManager
        .connect(admin)
        .resolveDispute(violationId, false, adjustedFine, resolutionHash);

      const [, , , fine, , status] = await violationManager.getViolation(violationId);
      expect(status).to.equal(0); // Pending
      expect(fine).to.equal(adjustedFine);
    });

    it("Should allow officer who recorded violation to resolve", async function () {
      await expect(
        violationManager
          .connect(officer1)
          .resolveDispute(violationId, false, 0, resolutionHash)
      ).to.not.be.reverted;
    });

    it("Should fail when different officer tries to resolve", async function () {
      await expect(
        violationManager
          .connect(officer2)
          .resolveDispute(violationId, false, 0, resolutionHash)
      ).to.be.revertedWithCustomError(violationManager, "UnauthorizedAccess");
    });

    it("Should fail when resolving non-disputed violation", async function () {
      // Create a new pending violation
      await violationManager
        .connect(officer1)
        .recordViolation(violationHash2, driver2.address, fineAmount, futureDueDate);

      await expect(
        violationManager
          .connect(admin)
          .resolveDispute(1, false, 0, resolutionHash)
      ).to.be.revertedWithCustomError(violationManager, "InvalidStatus");
    });

    it("Should fail when resolving non-existent violation", async function () {
      await expect(
        violationManager
          .connect(admin)
          .resolveDispute(999, false, 0, resolutionHash)
      ).to.be.revertedWithCustomError(violationManager, "ViolationNotFound");
    });
  });

  describe("Payment Marking", function () {
    let violationId: number;

    beforeEach(async function () {
      const tx = await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);
      await tx.wait();
      violationId = 0;
    });

    it("Should mark violation as paid", async function () {
      const tx = await violationManager.markAsPaid(violationId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(violationManager, "ViolationPaid")
        .withArgs(violationId, block!.timestamp);

      const [, , , , , status] = await violationManager.getViolation(violationId);
      expect(status).to.equal(1); // Paid
    });

    it("Should fail when marking non-existent violation", async function () {
      await expect(
        violationManager.markAsPaid(999)
      ).to.be.revertedWithCustomError(violationManager, "ViolationNotFound");
    });

    it("Should fail when marking non-pending violation", async function () {
      await violationManager.markAsPaid(violationId);

      await expect(
        violationManager.markAsPaid(violationId)
      ).to.be.revertedWithCustomError(violationManager, "ViolationNotPending");
    });

    it("Should fail when marking disputed violation", async function () {
      await violationManager
        .connect(driver1)
        .disputeViolation(violationId, disputeHash);

      await expect(
        violationManager.markAsPaid(violationId)
      ).to.be.revertedWithCustomError(violationManager, "ViolationNotPending");
    });
  });

  describe("Violation Data Retrieval", function () {
    it("Should get violation data correctly", async function () {
      await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);

      const [hash, driver, officer, fine, dueDate, status, dispute, recordedAt] = 
        await violationManager.getViolation(0);

      expect(hash).to.equal(violationHash1);
      expect(driver).to.equal(driver1.address);
      expect(officer).to.equal(officer1.address);
      expect(fine).to.equal(fineAmount);
      expect(dueDate).to.equal(futureDueDate);
      expect(status).to.equal(0); // Pending
      expect(dispute).to.equal(ethers.ZeroHash);
      expect(recordedAt).to.be.greaterThan(0);
    });

    it("Should fail when getting non-existent violation", async function () {
      await expect(
        violationManager.getViolation(0)
      ).to.be.revertedWithCustomError(violationManager, "ViolationNotFound");
    });

    it("Should check if violation exists", async function () {
      expect(await violationManager.violationExists(0)).to.be.false;

      await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);

      expect(await violationManager.violationExists(0)).to.be.true;
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause by admin", async function () {
      await violationManager.pause();
      expect(await violationManager.paused()).to.be.true;

      await violationManager.unpause();
      expect(await violationManager.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      await violationManager.pause();

      await expect(
        violationManager
          .connect(officer1)
          .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate)
      ).to.be.revertedWithCustomError(violationManager, "EnforcedPause");
    });
  });

  describe("Access Control", function () {
    it("Should grant OFFICER_ROLE to new address", async function () {
      const OFFICER_ROLE = await violationManager.OFFICER_ROLE();
      await violationManager.grantRole(OFFICER_ROLE, driver1.address);

      expect(await violationManager.hasRole(OFFICER_ROLE, driver1.address)).to.be.true;

      // driver1 should now be able to record violations
      await expect(
        violationManager
          .connect(driver1)
          .recordViolation(violationHash1, driver2.address, fineAmount, futureDueDate)
      ).to.not.be.reverted;
    });

    it("Should revoke OFFICER_ROLE from address", async function () {
      const OFFICER_ROLE = await violationManager.OFFICER_ROLE();
      await violationManager.revokeRole(OFFICER_ROLE, officer1.address);

      expect(await violationManager.hasRole(OFFICER_ROLE, officer1.address)).to.be.false;

      await expect(
        violationManager
          .connect(officer1)
          .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate)
      ).to.be.reverted;
    });
  });

  describe("Complex Workflows", function () {
    it("Should handle complete violation lifecycle", async function () {
      // 1. Record violation
      await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);

      let [, , , , , status] = await violationManager.getViolation(0);
      expect(status).to.equal(0); // Pending

      // 2. Dispute violation
      await violationManager
        .connect(driver1)
        .disputeViolation(0, disputeHash);

      [, , , , , status] = await violationManager.getViolation(0);
      expect(status).to.equal(2); // Disputed

      // 3. Resolve dispute (dismissed with adjusted fine)
      const adjustedFine = ethers.parseEther("0.005");
      await violationManager
        .connect(admin)
        .resolveDispute(0, false, adjustedFine, resolutionHash);

      const violation3 = await violationManager.getViolation(0);
      expect(violation3[5]).to.equal(0); // Pending again
      expect(violation3[3]).to.equal(adjustedFine);

      // 4. Mark as paid
      await violationManager.markAsPaid(0);

      const violation4 = await violationManager.getViolation(0);
      expect(violation4[5]).to.equal(1); // Paid
    });

    it("Should handle multiple violations for same driver", async function () {
      await violationManager
        .connect(officer1)
        .recordViolation(violationHash1, driver1.address, fineAmount, futureDueDate);

      await violationManager
        .connect(officer1)
        .recordViolation(violationHash2, driver1.address, fineAmount, futureDueDate);

      expect(await violationManager.getTotalViolations()).to.equal(2);

      const [, driver1_v1] = await violationManager.getViolation(0);
      const [, driver1_v2] = await violationManager.getViolation(1);

      expect(driver1_v1).to.equal(driver1.address);
      expect(driver1_v2).to.equal(driver1.address);
    });
  });
});
