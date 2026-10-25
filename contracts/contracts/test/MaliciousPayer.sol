// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFinePayment {
    function payFine(uint256 violationId) external payable;
}

/**
 * @title MaliciousPayer
 * @dev Test contract to verify reentrancy protection
 */
contract MaliciousPayer {
    IFinePayment public finePayment;
    uint256 public attackViolationId;
    uint256 public attackAmount;
    uint256 public callCount;
    bool public reentrancyFailed;

    constructor(address _finePayment) {
        finePayment = IFinePayment(_finePayment);
    }

    function attack(uint256 violationId, uint256 amount) external {
        attackViolationId = violationId;
        attackAmount = amount;
        callCount = 0;
        reentrancyFailed = false;
        finePayment.payFine{value: amount}(violationId);
        
        // If we get here and reentrancy was attempted, it must have been blocked
        require(callCount > 0 && reentrancyFailed, "Reentrancy should have failed");
    }

    receive() external payable {
        callCount++;
        if (callCount == 1) {
            // Try to reenter - this should fail
            try finePayment.payFine{value: 0}(attackViolationId) {
                // If this succeeds, reentrancy protection failed
                revert("Reentrancy protection failed!");
            } catch {
                // Reentrancy was blocked - this is expected
                reentrancyFailed = true;
            }
        }
    }
}
