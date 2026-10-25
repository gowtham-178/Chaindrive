// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ViolationManager
 * @dev Manages traffic violations, disputes, and resolutions
 * @notice Only stores hashes of violation data, not PII
 */
contract ViolationManager is AccessControl, Pausable {
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum Status {
        Pending,
        Paid,
        Disputed,
        Resolved
    }

    struct Violation {
        bytes32 violationHash;
        address driver;
        address officer;
        uint256 fineAmount;
        uint256 dueDate;
        Status status;
        bytes32 disputeHash;
        uint256 recordedAt;
    }

    // Auto-incrementing violation ID
    uint256 private _violationCounter;
    
    // Mapping from violation ID to violation data
    mapping(uint256 => Violation) private violations;

    // Events
    event ViolationRecorded(
        uint256 indexed violationId,
        bytes32 violationHash,
        address indexed driver,
        address indexed officer,
        uint256 fineAmount,
        uint256 dueDate,
        uint256 recordedAt
    );

    event ViolationDisputed(
        uint256 indexed violationId,
        bytes32 disputeHash,
        uint256 disputedAt
    );

    event DisputeResolved(
        uint256 indexed violationId,
        bool upheld,
        uint256 adjustedFine,
        bytes32 resolutionHash,
        uint256 resolvedAt
    );

    event ViolationPaid(
        uint256 indexed violationId,
        uint256 paidAt
    );

    // Custom Errors
    error ViolationNotFound(uint256 violationId);
    error UnauthorizedAccess();
    error InvalidStatus();
    error CannotDisputePaidViolation();
    error CannotDisputeResolvedViolation();
    error ViolationNotPending();
    error InvalidFineAmount();

    /**
     * @dev Constructor sets up roles
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OFFICER_ROLE, msg.sender);
    }

    /**
     * @dev Record a new violation
     * @param violationHash Keccak256 hash of violation data
     * @param driver Address of the driver
     * @param fineAmount Fine amount in wei
     * @param dueDate Payment due date timestamp
     */
    function recordViolation(
        bytes32 violationHash,
        address driver,
        uint256 fineAmount,
        uint256 dueDate
    ) external onlyRole(OFFICER_ROLE) whenNotPaused returns (uint256) {
        if (fineAmount == 0) {
            revert InvalidFineAmount();
        }
        if (driver == address(0)) {
            revert UnauthorizedAccess();
        }
        if (dueDate <= block.timestamp) {
            revert InvalidStatus();
        }

        uint256 violationId = _violationCounter++;

        violations[violationId] = Violation({
            violationHash: violationHash,
            driver: driver,
            officer: msg.sender,
            fineAmount: fineAmount,
            dueDate: dueDate,
            status: Status.Pending,
            disputeHash: bytes32(0),
            recordedAt: block.timestamp
        });

        emit ViolationRecorded(
            violationId,
            violationHash,
            driver,
            msg.sender,
            fineAmount,
            dueDate,
            block.timestamp
        );

        return violationId;
    }

    /**
     * @dev Dispute a violation
     * @param violationId ID of the violation to dispute
     * @param disputeHash Hash of dispute data (reason + evidence)
     */
    function disputeViolation(
        uint256 violationId,
        bytes32 disputeHash
    ) external whenNotPaused {
        Violation storage violation = violations[violationId];
        
        if (violation.driver == address(0)) {
            revert ViolationNotFound(violationId);
        }
        if (violation.driver != msg.sender) {
            revert UnauthorizedAccess();
        }
        if (violation.status == Status.Paid) {
            revert CannotDisputePaidViolation();
        }
        if (violation.status == Status.Resolved) {
            revert CannotDisputeResolvedViolation();
        }

        violation.status = Status.Disputed;
        violation.disputeHash = disputeHash;

        emit ViolationDisputed(violationId, disputeHash, block.timestamp);
    }

    /**
     * @dev Resolve a dispute
     * @param violationId ID of the violation
     * @param upheld True if dispute is upheld (violation dismissed)
     * @param adjustedFine Adjusted fine amount (0 if upheld)
     * @param resolutionHash Hash of resolution data
     */
    function resolveDispute(
        uint256 violationId,
        bool upheld,
        uint256 adjustedFine,
        bytes32 resolutionHash
    ) external whenNotPaused {
        Violation storage violation = violations[violationId];
        
        // Only admin or the officer who recorded the violation can resolve
        if (!hasRole(ADMIN_ROLE, msg.sender)) {
            if (violation.officer != msg.sender) {
                revert UnauthorizedAccess();
            }
        }
        
        if (violation.driver == address(0)) {
            revert ViolationNotFound(violationId);
        }
        if (violation.status != Status.Disputed) {
            revert InvalidStatus();
        }

        violation.status = Status.Resolved;
        
        if (!upheld) {
            // Dispute dismissed, adjust fine if provided
            if (adjustedFine > 0) {
                violation.fineAmount = adjustedFine;
            }
            // Set back to pending for payment
            violation.status = Status.Pending;
        }

        emit DisputeResolved(
            violationId,
            upheld,
            adjustedFine,
            resolutionHash,
            block.timestamp
        );
    }

    /**
     * @dev Mark violation as paid (called by FinePayment contract)
     * @param violationId ID of the violation
     */
    function markAsPaid(uint256 violationId) external whenNotPaused {
        Violation storage violation = violations[violationId];
        
        if (violation.driver == address(0)) {
            revert ViolationNotFound(violationId);
        }
        if (violation.status != Status.Pending) {
            revert ViolationNotPending();
        }

        violation.status = Status.Paid;

        emit ViolationPaid(violationId, block.timestamp);
    }

    /**
     * @dev Get violation data
     * @param violationId ID of the violation
     */
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
        )
    {
        Violation memory violation = violations[violationId];
        
        if (violation.driver == address(0)) {
            revert ViolationNotFound(violationId);
        }

        return (
            violation.violationHash,
            violation.driver,
            violation.officer,
            violation.fineAmount,
            violation.dueDate,
            violation.status,
            violation.disputeHash,
            violation.recordedAt
        );
    }

    /**
     * @dev Check if violation exists
     * @param violationId ID of the violation
     */
    function violationExists(uint256 violationId) external view returns (bool) {
        return violations[violationId].driver != address(0);
    }

    /**
     * @dev Get total number of violations recorded
     */
    function getTotalViolations() external view returns (uint256) {
        return _violationCounter;
    }

    /**
     * @dev Pause the contract (emergency stop)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
