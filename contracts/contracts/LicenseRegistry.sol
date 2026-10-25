// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LicenseRegistry
 * @dev Manages driving licenses on blockchain using hash-based storage
 * @notice Only stores hashes of license data, not PII
 */
contract LicenseRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum Status {
        Active,
        Suspended,
        Revoked,
        Expired
    }

    struct LicenseData {
        Status status;
        uint256 expiry;
        address owner;
        uint256 issuedAt;
    }

    // Mapping from license hash to license data
    mapping(bytes32 => LicenseData) private licenses;

    // Events
    event LicenseIssued(
        bytes32 indexed licenseHash,
        address indexed owner,
        uint256 expiry,
        uint256 issuedAt
    );

    event LicenseRenewed(
        bytes32 indexed licenseHash,
        uint256 newExpiry,
        uint256 renewedAt
    );

    event LicenseSuspended(
        bytes32 indexed licenseHash,
        string reason,
        uint256 suspendedAt
    );

    event LicenseRevoked(
        bytes32 indexed licenseHash,
        string reason,
        uint256 revokedAt
    );

    event LicenseStatusChanged(
        bytes32 indexed licenseHash,
        Status oldStatus,
        Status newStatus,
        uint256 changedAt
    );

    // Custom Errors
    error LicenseAlreadyExists(bytes32 licenseHash);
    error LicenseNotFound(bytes32 licenseHash);
    error UnauthorizedAccess();
    error InvalidExpiry();
    error LicenseAlreadyRevoked();

    /**
     * @dev Constructor sets up roles
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Issue a new license
     * @param owner Address of the license owner
     * @param licenseHash Keccak256 hash of license data
     * @param expiry Expiry timestamp
     */
    function issueLicense(
        address owner,
        bytes32 licenseHash,
        uint256 expiry
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (licenses[licenseHash].owner != address(0)) {
            revert LicenseAlreadyExists(licenseHash);
        }
        if (expiry <= block.timestamp) {
            revert InvalidExpiry();
        }

        licenses[licenseHash] = LicenseData({
            status: Status.Active,
            expiry: expiry,
            owner: owner,
            issuedAt: block.timestamp
        });

        emit LicenseIssued(licenseHash, owner, expiry, block.timestamp);
    }

    /**
     * @dev Renew an existing license
     * @param licenseHash Hash of the license to renew
     * @param newExpiry New expiry timestamp
     */
    function renewLicense(
        bytes32 licenseHash,
        uint256 newExpiry
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        LicenseData storage license = licenses[licenseHash];
        if (license.owner == address(0)) {
            revert LicenseNotFound(licenseHash);
        }
        if (license.status == Status.Revoked) {
            revert LicenseAlreadyRevoked();
        }
        if (newExpiry <= block.timestamp) {
            revert InvalidExpiry();
        }

        Status oldStatus = license.status;
        license.expiry = newExpiry;
        license.status = Status.Active;

        emit LicenseRenewed(licenseHash, newExpiry, block.timestamp);
        
        if (oldStatus != Status.Active) {
            emit LicenseStatusChanged(licenseHash, oldStatus, Status.Active, block.timestamp);
        }
    }

    /**
     * @dev Suspend a license
     * @param licenseHash Hash of the license to suspend
     * @param reason Reason for suspension
     */
    function suspendLicense(
        bytes32 licenseHash,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        LicenseData storage license = licenses[licenseHash];
        if (license.owner == address(0)) {
            revert LicenseNotFound(licenseHash);
        }
        if (license.status == Status.Revoked) {
            revert LicenseAlreadyRevoked();
        }

        Status oldStatus = license.status;
        license.status = Status.Suspended;

        emit LicenseSuspended(licenseHash, reason, block.timestamp);
        emit LicenseStatusChanged(licenseHash, oldStatus, Status.Suspended, block.timestamp);
    }

    /**
     * @dev Revoke a license permanently
     * @param licenseHash Hash of the license to revoke
     * @param reason Reason for revocation
     */
    function revokeLicense(
        bytes32 licenseHash,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        LicenseData storage license = licenses[licenseHash];
        if (license.owner == address(0)) {
            revert LicenseNotFound(licenseHash);
        }
        if (license.status == Status.Revoked) {
            revert LicenseAlreadyRevoked();
        }

        Status oldStatus = license.status;
        license.status = Status.Revoked;

        emit LicenseRevoked(licenseHash, reason, block.timestamp);
        emit LicenseStatusChanged(licenseHash, oldStatus, Status.Revoked, block.timestamp);
    }

    /**
     * @dev Get license data by hash
     * @param licenseHash Hash of the license
     * @return status Current status
     * @return expiry Expiry timestamp
     * @return owner Owner address
     * @return issuedAt Issuance timestamp
     */
    function getLicenseData(bytes32 licenseHash)
        external
        view
        returns (
            Status status,
            uint256 expiry,
            address owner,
            uint256 issuedAt
        )
    {
        LicenseData memory license = licenses[licenseHash];
        if (license.owner == address(0)) {
            revert LicenseNotFound(licenseHash);
        }

        // Check if expired
        Status currentStatus = license.status;
        if (currentStatus != Status.Revoked && block.timestamp > license.expiry) {
            currentStatus = Status.Expired;
        }

        return (currentStatus, license.expiry, license.owner, license.issuedAt);
    }

    /**
     * @dev Verify if a license is valid (active and not expired)
     * @param licenseHash Hash of the license
     * @return isValid True if license is valid
     */
    function verifyLicense(bytes32 licenseHash) external view returns (bool isValid) {
        LicenseData memory license = licenses[licenseHash];
        if (license.owner == address(0)) {
            return false;
        }

        return (
            license.status == Status.Active &&
            block.timestamp <= license.expiry
        );
    }

    /**
     * @dev Check if a license exists
     * @param licenseHash Hash of the license
     * @return exists True if license exists
     */
    function licenseExists(bytes32 licenseHash) external view returns (bool exists) {
        return licenses[licenseHash].owner != address(0);
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
