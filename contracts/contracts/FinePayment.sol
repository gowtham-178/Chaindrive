// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IViolationManager {
    enum Status {
        Pending,
        Paid,
        Disputed,
        Resolved
    }

    function getViolation(uint256 violationId)
        external
        view
        returns (
            bytes32 violationHash,
            address driver,
            address officer,
            uint256 fineAmount,
            uint256 dueDate,
            Status status,
            bytes32 disputeHash,
            uint256 recordedAt
        );

    function markAsPaid(uint256 violationId) external;
    function violationExists(uint256 violationId) external view returns (bool);
}

/**
 * @title FinePayment
 * @dev Handles fine payments with reentrancy protection
 * @notice Ensures exact payment amounts and prevents double payments
 */
contract FinePayment is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IViolationManager public violationManager;
    address payable public treasury;

    // Track paid violations to prevent double payment
    mapping(uint256 => bool) private paidViolations;

    // Events
    event FinePaid(
        uint256 indexed violationId,
        address indexed payer,
        uint256 amount,
        uint256 paidAt
    );

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury,
        uint256 updatedAt
    );

    event ViolationManagerUpdated(
        address indexed oldManager,
        address indexed newManager,
        uint256 updatedAt
    );

    // Custom Errors
    error ViolationNotFound(uint256 violationId);
    error InvalidAmount(uint256 expected, uint256 received);
    error AlreadyPaid(uint256 violationId);
    error ViolationNotPending(uint256 violationId);
    error InvalidAddress();
    error TransferFailed();

    /**
     * @dev Constructor
     * @param _violationManager Address of ViolationManager contract
     * @param _treasury Address to receive fine payments
     */
    constructor(address _violationManager, address payable _treasury) {
        if (_violationManager == address(0) || _treasury == address(0)) {
            revert InvalidAddress();
        }

        violationManager = IViolationManager(_violationManager);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Pay a fine for a violation
     * @param violationId ID of the violation to pay
     */
    function payFine(uint256 violationId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        // Check if violation exists
        if (!violationManager.violationExists(violationId)) {
            revert ViolationNotFound(violationId);
        }

        // Check if already paid
        if (paidViolations[violationId]) {
            revert AlreadyPaid(violationId);
        }

        // Get violation details
        (
            ,
            ,
            ,
            uint256 fineAmount,
            ,
            IViolationManager.Status status,
            ,
        ) = violationManager.getViolation(violationId);

        // Check status is pending
        if (status != IViolationManager.Status.Pending) {
            revert ViolationNotPending(violationId);
        }

        // Check exact amount
        if (msg.value != fineAmount) {
            revert InvalidAmount(fineAmount, msg.value);
        }

        // Mark as paid locally first (CEI pattern)
        paidViolations[violationId] = true;

        // Update violation status in ViolationManager
        violationManager.markAsPaid(violationId);

        // Transfer funds to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        if (!success) {
            revert TransferFailed();
        }

        emit FinePaid(violationId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Get fine amount for a violation
     * @param violationId ID of the violation
     * @return amount Fine amount in wei
     */
    function getFineAmount(uint256 violationId) 
        external 
        view 
        returns (uint256 amount) 
    {
        if (!violationManager.violationExists(violationId)) {
            revert ViolationNotFound(violationId);
        }

        (
            ,
            ,
            ,
            uint256 fineAmount,
            ,
            ,
            ,
        ) = violationManager.getViolation(violationId);

        return fineAmount;
    }

    /**
     * @dev Check if a violation has been paid
     * @param violationId ID of the violation
     * @return isPaid True if violation has been paid
     */
    function isViolationPaid(uint256 violationId) 
        external 
        view 
        returns (bool isPaid) 
    {
        return paidViolations[violationId];
    }

    /**
     * @dev Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address payable newTreasury) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (newTreasury == address(0)) {
            revert InvalidAddress();
        }

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury, block.timestamp);
    }

    /**
     * @dev Update ViolationManager address
     * @param newManager New ViolationManager address
     */
    function updateViolationManager(address newManager) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (newManager == address(0)) {
            revert InvalidAddress();
        }

        address oldManager = address(violationManager);
        violationManager = IViolationManager(newManager);

        emit ViolationManagerUpdated(oldManager, newManager, block.timestamp);
    }

    /**
     * @dev Pause the contract (emergency stop)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (only for stuck funds, not normal operation)
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        (bool success, ) = treasury.call{value: balance}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @dev Receive function to accept ETH (for emergency scenarios)
     */
    receive() external payable {}
}
