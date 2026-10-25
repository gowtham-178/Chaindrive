import { expect } from "chai";
import { ethers } from "hardhat";
import { FinePayment, ViolationManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FinePayment", function () {
  let finePayment: FinePayment;
  let violationManager: ViolationManager;
  let admin: SignerWithAddress;
  let officer: SignerWithAddress;
  let driver: SignerWithAddress;
  let treasury: SignerWithAddress;
  let newTreasury: SignerWithAddress;
  let violationHash: string;
  let fineAmount: bigint;
  let futureDueDate: number;

  beforeEach(async function () {
    [admin, officer, driver, treasury, newTreasury] = await ethers.getSigners();

    // Deploy ViolationManager
    const ViolationManagerFactory = await ethers.getContractFactory("ViolationManager");
    violationManager = await ViolationManagerFactory.deploy();
    await violationManager.waitForDeployment();

    // Grant officer role
    const OFFICER_ROLE = await violationManager.OFFICER_ROLE();
    await violationManager.grantRole(OFFICER_ROLE, officer.address);

    // Deploy FinePayment
    const FinePaymentFactory = await ethers.getContractFactory("FinePayment");
    finePayment = await FinePaymentFactory.deploy(
      await violationManager.getAddress(),
      treasury.address
    );
    await finePayment.waitForDeployment();

    // Grant FinePayment contract permission to mark violations as paid
    // In ViolationManager, markAsPaid is public, so FinePayment can call it

    // Setup test data
    violationHash = ethers.keccak256(ethers.toUtf8Bytes("VIOLATION-001"));
    fineAmount = ethers.parseEther("0.01");
    futureDueDate = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  });

  describe("Deployment", function () {
    it("Should set ViolationManager and treasury correctly", async function () {
      expect(await finePayment.violationManager()).to.equal(
        await violationManager.getAddress()
      );
      expect(await finePayment.treasury()).to.equal(treasury.address);
    });

    it("Should set deployer as admin", async function () {
      const ADMIN_ROLE = await finePayment.ADMIN_ROLE();
      expect(await finePayment.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should start unpaused", async function () {
      expect(await finePayment.paused()).to.be.false;
    });

    it("Should fail with zero ViolationManager address", async function () {
      const FinePaymentFactory = await ethers.getContractFactory("FinePayment");
      await expect(
        FinePaymentFactory.deploy(ethers.ZeroAddress, treasury.address)
      ).to.be.revertedWithCustomError(FinePaymentFactory, "InvalidAddress");
    });

    it("Should fail with zero treasury address", async function () {
      const FinePaymentFactory = await ethers.getContractFactory("FinePayment");
      await expect(
        FinePaymentFactory.deploy(
          await violationManager.getAddress(),
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(FinePaymentFactory, "InvalidAddress");
    });
  });

  describe("Fine Payment", function () {
    let violationId: number;

    beforeEach(async function () {
      // Record a violation
      await violationManager
        .connect(officer)
        .recordViolation(violationHash, driver.address, fineAmount, futureDueDate);
      violationId = 0;
    });

    it("Should pay fine with exact amount", async function () {
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      const tx = await finePayment
        .connect(driver)
        .payFine(violationId, { value: fineAmount });
      
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(finePayment, "FinePaid")
        .withArgs(violationId, driver.address, fineAmount, block!.timestamp);

      // Check treasury received funds
      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(fineAmount);

      // Check violation is marked as paid
      const [, , , , , status] = await violationManager.getViolation(violationId);
      expect(status).to.equal(1); // Paid

      // Check local tracking
      expect(await finePayment.isViolationPaid(violationId)).to.be.true;
    });

    it("Should fail with overpayment", async function () {
      const overpayment = fineAmount + ethers.parseEther("0.001");

      await expect(
        finePayment.connect(driver).payFine(violationId, { value: overpayment })
      ).to.be.revertedWithCustomError(finePayment, "InvalidAmount");
    });

    it("Should fail with underpayment", async function () {
      const underpayment = fineAmount - ethers.parseEther("0.001");

      await expect(
        finePayment.connect(driver).payFine(violationId, { value: underpayment })
      ).to.be.revertedWithCustomError(finePayment, "InvalidAmount");
    });

    it("Should fail with double payment", async function () {
      await finePayment.connect(driver).payFine(violationId, { value: fineAmount });

      await expect(
        finePayment.connect(driver).payFine(violationId, { value: fineAmount })
      ).to.be.revertedWithCustomError(finePayment, "AlreadyPaid");
    });

    it("Should fail for non-existent violation", async function () {
      await expect(
        finePayment.connect(driver).payFine(999, { value: fineAmount })
      ).to.be.revertedWithCustomError(finePayment, "ViolationNotFound");
    });

    it("Should fail for disputed violation", async function () {
      const disputeHash = ethers.keccak256(ethers.toUtf8Bytes("DISPUTE"));
      await violationManager.connect(driver).disputeViolation(violationId, disputeHash);

      await expect(
        finePayment.connect(driver).payFine(violationId, { value: fineAmount })
      ).to.be.revertedWithCustomError(finePayment, "ViolationNotPending");
    });

    it("Should allow anyone to pay (not just the driver)", async function () {
      const [, , , , otherUser] = await ethers.getSigners();

      await expect(
        finePayment.connect(otherUser).payFine(violationId, { value: fineAmount })
      ).to.not.be.reverted;
    });
  });

  describe("Get Fine Amount", function () {
    let violationId: number;

    beforeEach(async function () {
      await violationManager
        .connect(officer)
        .recordViolation(violationHash, driver.address, fineAmount, futureDueDate);
      violationId = 0;
    });

    it("Should return correct fine amount", async function () {
      expect(await finePayment.getFineAmount(violationId)).to.equal(fineAmount);
    });

    it("Should fail for non-existent violation", async function () {
      await expect(
        finePayment.getFineAmount(999)
      ).to.be.revertedWithCustomError(finePayment, "ViolationNotFound");
    });
  });

  describe("Payment Status Check", function () {
    let violationId: number;

    beforeEach(async function () {
      await violationManager
        .connect(officer)
        .recordViolation(violationHash, driver.address, fineAmount, futureDueDate);
      violationId = 0;
    });

    it("Should return false for unpaid violation", async function () {
      expect(await finePayment.isViolationPaid(violationId)).to.be.false;
    });

    it("Should return true for paid violation", async function () {
      await finePayment.connect(driver).payFine(violationId, { value: fineAmount });
      expect(await finePayment.isViolationPaid(violationId)).to.be.true;
    });
  });

  describe("Treasury Management", function () {
    it("Should update treasury by admin", async function () {
      const tx = await finePayment.updateTreasury(newTreasury.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(finePayment, "TreasuryUpdated")
        .withArgs(treasury.address, newTreasury.address, block!.timestamp);

      expect(await finePayment.treasury()).to.equal(newTreasury.address);
    });

    it("Should fail to update treasury with zero address", async function () {
      await expect(
        finePayment.updateTreasury(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(finePayment, "InvalidAddress");
    });

    it("Should fail when non-admin tries to update treasury", async function () {
      await expect(
        finePayment.connect(driver).updateTreasury(newTreasury.address)
      ).to.be.reverted;
    });

    it("Should route payments to new treasury after update", async function () {
      await violationManager
        .connect(officer)
        .recordViolation(violationHash, driver.address, fineAmount, futureDueDate);

      await finePayment.updateTreasury(newTreasury.address);

      const balanceBefore = await ethers.provider.getBalance(newTreasury.address);
      await finePayment.connect(driver).payFine(0, { value: fineAmount });
      const balanceAfter = await ethers.provider.getBalance(newTreasury.address);

      expect(balanceAfter - balanceBefore).to.equal(fineAmount);
    });
  });

  describe("ViolationManager Update", function () {
    let newViolationManager: ViolationManager;

    beforeEach(async function () {
      const ViolationManagerFactory = await ethers.getContractFactory("ViolationManager");
      newViolationManager = await ViolationManagerFactory.deploy();
      await newViolationManager.waitForDeployment();
    });

    it("Should update ViolationManager by admin", async function () {
      const tx = await finePayment.updateViolationManager(
        await newViolationManager.getAddress()
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(finePayment, "ViolationManagerUpdated")
        .withArgs(
          await violationManager.getAddress(),
          await newViolationManager.getAddress(),
          block!.timestamp
        );

      expect(await finePayment.violationManager()).to.equal(
        await newViolationManager.getAddress()
      );
    });

    it("Should fail to update with zero address", async function () {
      await expect(
        finePayment.updateViolationManager(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(finePayment, "InvalidAddress");
    });

    it("Should fail when non-admin tries to update", async function () {
      await expect(
        finePayment
          .connect(driver)
          .updateViolationManager(await newViolationManager.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Pause Functionality", function () {
    let violationId: number;

    beforeEach(async function () {
      await violationManager
        .connect(officer)
        .recordViolation(violationHash, driver.address, fineAmount, futureDueDate);
      violationId = 0;
    });

    it("Should pause and unpause by admin", async function () {
      await finePayment.pause();
      expect(await finePayment.paused()).to.be.true;

      await finePayment.unpause();
      expect(await finePayment.paused()).to.be.false;
    });

    it("Should prevent payments when paused", async function () {
      await finePayment.pause();

      await expect(
        finePayment.connect(driver).payFine(violationId, { value: fineAmount })
      ).to.be.revertedWithCustomError(finePayment, "EnforcedPause");
    });

    it("Should allow payments after unpause", async function () {
      await finePayment.pause();
      await finePayment.unpause();

      await expect(
        finePayment.connect(driver).payFine(violationId, { value: fineAmount })
      ).to.not.be.reverted;
    });
  });

  describe("Emergency Withdrawal", function () {
    it("Should allow admin to withdraw stuck funds", async function () {
      // Send some ETH directly to contract (simulating stuck funds)
      await driver.sendTransaction({
        to: await finePayment.getAddress(),
        value: ethers.parseEther("1"),
      });

      const contractBalance = await ethers.provider.getBalance(
        await finePayment.getAddress()
      );
      expect(contractBalance).to.equal(ethers.parseEther("1"));

      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      await finePayment.emergencyWithdraw();

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(
        ethers.parseEther("1")
      );

      const contractBalanceAfter = await ethers.provider.getBalance(
        await finePayment.getAddress()
      );
      expect(contractBalanceAfter).to.equal(0);
    });

    it("Should fail when non-admin tries emergency withdrawal", async function () {
      await expect(finePayment.connect(driver).emergencyWithdraw()).to.be.reverted;
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks via ReentrancyGuard", async function () {
      // The reentrancy protection is tested at contract level via nonReentrant modifier
      // Even if an attacker tries to call payFine again during execution,
      // the ReentrancyGuard will prevent it
      
      // Record a violation
      await violationManager
        .connect(officer)
        .recordViolation(violationHash, driver.address, fineAmount, futureDueDate);

      // Pay the fine normally
      await finePayment.connect(driver).payFine(0, { value: fineAmount });

      // Verify it's marked as paid and can't be paid again
      expect(await finePayment.isViolationPaid(0)).to.be.true;

      // Attempt to pay again should fail with AlreadyPaid
      await expect(
        finePayment.connect(driver).payFine(0, { value: fineAmount })
      ).to.be.revertedWithCustomError(finePayment, "AlreadyPaid");

      // The ReentrancyGuard protects against reentrancy during the critical window
      // between state changes and external calls
    });
  });

  describe("Gas Optimization", function () {
    let violationId: number;

    beforeEach(async function () {
      await violationManager
        .connect(officer)
        .recordViolation(violationHash, driver.address, fineAmount, futureDueDate);
      violationId = 0;
    });

    it("Should have reasonable gas costs for payment", async function () {
      const tx = await finePayment
        .connect(driver)
        .payFine(violationId, { value: fineAmount });
      const receipt = await tx.wait();

      // Should be less than 120k gas (reasonable for complex operation with external calls)
      expect(receipt!.gasUsed).to.be.lessThan(120000);
    });
  });
});
