# ChainDrive Smart Contracts

This directory contains the Solidity smart contracts for the ChainDrive system.

## Architecture Overview

The system consists of three main contracts that work together:

```
┌─────────────────────┐
│  LicenseRegistry    │ ← Hash-based license storage
└─────────────────────┘
           
┌─────────────────────┐
│  ViolationManager   │ ← Violation recording & disputes
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   FinePayment       │ ← Secure payment processing
└─────────────────────┘
```

## Contracts

### LicenseRegistry.sol

Manages driving licenses on-chain using hash-based storage.

**Key Features:**
- Hash-only storage (no PII on-chain)
- License lifecycle: issue → renew → suspend → revoke
- Status tracking: Active, Suspended, Revoked, Expired
- Public verification method
- Access control: ADMIN_ROLE required

**Main Functions:**
- `issueLicense(address owner, bytes32 licenseHash, uint256 expiry)`
- `renewLicense(bytes32 licenseHash, uint256 newExpiry)`
- `suspendLicense(bytes32 licenseHash, string reason)`
- `revokeLicense(bytes32 licenseHash, string reason)`
- `verifyLicense(bytes32 licenseHash) returns (bool)`
- `getLicenseData(bytes32 licenseHash)`

### ViolationManager.sol

Handles traffic violations, disputes, and resolutions.

**Key Features:**
- Violation recording by officers
- Auto-incrementing violation IDs
- Dispute submission by drivers
- Resolution by admin or issuing officer
- Status state machine: Pending → Paid/Disputed → Resolved
- Access control: OFFICER_ROLE for recording, ADMIN_ROLE for resolution

**Main Functions:**
- `recordViolation(bytes32 hash, address driver, uint256 fine, uint256 dueDate)`
- `disputeViolation(uint256 violationId, bytes32 disputeHash)`
- `resolveDispute(uint256 id, bool upheld, uint256 adjustedFine, bytes32 hash)`
- `markAsPaid(uint256 violationId)` - Called by FinePayment contract
- `getViolation(uint256 violationId)`

### FinePayment.sol

Secure payment processing with reentrancy protection.

**Key Features:**
- ReentrancyGuard for secure payments
- Exact amount checking (no over/underpayment)
- Double payment prevention
- Treasury fund forwarding
- Emergency withdrawal capability
- CEI (Checks-Effects-Interactions) pattern

**Main Functions:**
- `payFine(uint256 violationId) payable`
- `getFineAmount(uint256 violationId) returns (uint256)`
- `isViolationPaid(uint256 violationId) returns (bool)`
- `updateTreasury(address payable newTreasury)`
- `emergencyWithdraw()`

## Security Features

All contracts implement:
- **OpenZeppelin AccessControl** for role-based permissions
- **Pausable** for emergency stops
- **Custom Errors** for gas efficiency
- **ReentrancyGuard** (FinePayment only)
- **Event Emission** for off-chain indexing

## Deployment

### Prerequisites

1. Node.js >= 18.0.0
2. Hardhat local node running

### Deploy All Contracts

```bash
# Start Hardhat node (Terminal 1)
npm run dev

# Deploy contracts (Terminal 2)
npm run deploy-local
```

This will:
1. Deploy all three contracts
2. Grant deployer all roles for testing
3. Export addresses and ABIs to `../shared/contracts.json`

### Verify Deployment

```bash
npm run verify-deployment
```

### Grant Additional Roles

```bash
# Grant OFFICER_ROLE to an address
npm run grant-roles officer 0xYourAddress

# Grant ADMIN_ROLE in LicenseRegistry
npm run grant-roles admin-license 0xYourAddress

# Grant ADMIN_ROLE in ViolationManager
npm run grant-roles admin-violation 0xYourAddress

# Grant ADMIN_ROLE in FinePayment
npm run grant-roles admin-payment 0xYourAddress
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- test/LicenseRegistry.test.ts
npm test -- test/ViolationManager.test.ts
npm test -- test/FinePayment.test.ts
```

### Test Coverage

- **LicenseRegistry**: 31 tests
- **ViolationManager**: 34 tests  
- **FinePayment**: 30 tests
- **Total**: 95 tests, all passing ✓

## Data Storage Pattern

### On-Chain (Immutable Audit Trail)
- Keccak256 hashes of sensitive data
- Status flags
- Amounts (in wei)
- Timestamps
- Owner/driver addresses

### Off-Chain (MongoDB)
- Personal Identifiable Information (PII)
- Full text descriptions
- Evidence files (images, documents)
- Searchable metadata

### Hash Generation

```typescript
// Example: Generate license hash
import { ethers } from 'ethers';

const licenseData = {
  licenseNumber: "DL1234567890",
  fullName: "John Doe",
  dateOfBirth: "1990-01-01",
  // ... other fields
};

const salt = crypto.randomBytes(32).toString('hex');
const canonicalJSON = JSON.stringify(licenseData);
const hash = ethers.solidityPackedKeccak256(['string'], [canonicalJSON + salt]);

// Store hash on-chain, data + salt off-chain
```

## Gas Costs

Approximate gas costs on localhost (actual costs may vary):

| Operation | Gas Cost |
|-----------|----------|
| Issue License | ~80,000 |
| Record Violation | ~90,000 |
| Pay Fine | ~110,000 |
| Dispute Violation | ~60,000 |
| Resolve Dispute | ~70,000 |

## Network Configuration

### Hardhat Local (Development)
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Gas Price: Auto
- Block Time: Instant

### Deployed Addresses

After deployment, contract addresses are stored in `../shared/contracts.json`:

```json
{
  "LicenseRegistry": {
    "address": "0x...",
    "abi": [...]
  },
  "ViolationManager": {
    "address": "0x...",
    "abi": [...]
  },
  "FinePayment": {
    "address": "0x...",
    "abi": [...]
  }
}
```

## Development Workflow

1. **Make changes** to contracts
2. **Run tests**: `npm test`
3. **Compile**: `npm run build`
4. **Deploy locally**: `npm run deploy-local`
5. **Verify**: `npm run verify-deployment`
6. **Update backend/frontend** with new addresses from `../shared/contracts.json`

## Troubleshooting

### Contract Already Deployed Error
If you see "nonce too low" or similar errors, restart the Hardhat node:
```bash
# Stop existing node
# Start fresh node
npm run dev
# Redeploy
npm run deploy-local
```

### Role Access Denied
Ensure the caller has the required role:
```bash
npm run verify-deployment  # Check current roles
npm run grant-roles <role> <address>  # Grant missing role
```

### Transaction Reverted
Check the custom error message in the revert reason. Common errors:
- `LicenseNotFound`: Hash doesn't exist
- `ViolationNotPending`: Violation not in correct state
- `InvalidAmount`: Payment amount mismatch
- `AlreadyPaid`: Double payment attempt

## Additional Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
