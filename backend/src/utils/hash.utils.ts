import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Generates a keccak256 hash compatible with Solidity's keccak256(abi.encodePacked(...))
 * for license data.
 */
export function generateLicenseHash(licenseData: LicenseHashData, salt: string): string {
  const canonical = buildLicenseCanonical(licenseData, salt);
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

/**
 * Generates a keccak256 hash for violation data.
 */
export function generateViolationHash(violationData: ViolationHashData, salt: string): string {
  const canonical = buildViolationCanonical(violationData, salt);
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

/**
 * Generates a keccak256 hash for dispute data.
 */
export function generateDisputeHash(disputeData: DisputeHashData, salt: string): string {
  const canonical = buildDisputeCanonical(disputeData, salt);
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

/** Generates a cryptographically random salt string */
export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Verifies that stored data matches the on-chain hash */
export function verifyDataIntegrity(
  data: LicenseHashData | ViolationHashData | DisputeHashData,
  salt: string,
  onChainHash: string,
  type: 'license' | 'violation' | 'dispute'
): boolean {
  let computedHash: string;
  if (type === 'license') {
    computedHash = generateLicenseHash(data as LicenseHashData, salt);
  } else if (type === 'violation') {
    computedHash = generateViolationHash(data as ViolationHashData, salt);
  } else {
    computedHash = generateDisputeHash(data as DisputeHashData, salt);
  }
  return computedHash.toLowerCase() === onChainHash.toLowerCase();
}

// ── Type definitions ──────────────────────────────────────────────────────────

export interface LicenseHashData {
  licenseNumber: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;  // ISO date string
  issuedAt: string;     // ISO date string
  expiresAt: string;    // ISO date string
}

export interface ViolationHashData {
  violationId: string;
  licenseNumber: string;
  driverId: string;
  officerId: string;
  violationType: string;
  location: string;
  occurredAt: string;
  fineAmount: number;
}

export interface DisputeHashData {
  violationId: string;
  driverId: string;
  reason: string;
  submittedAt: string;
}

// ── Canonical builders ────────────────────────────────────────────────────────

function buildLicenseCanonical(data: LicenseHashData, salt: string): string {
  return JSON.stringify({
    licenseNumber: data.licenseNumber,
    userId: data.userId,
    fullName: data.fullName,
    dateOfBirth: data.dateOfBirth,
    issuedAt: data.issuedAt,
    expiresAt: data.expiresAt,
    salt,
  });
}

function buildViolationCanonical(data: ViolationHashData, salt: string): string {
  return JSON.stringify({
    violationId: data.violationId,
    licenseNumber: data.licenseNumber,
    driverId: data.driverId,
    officerId: data.officerId,
    violationType: data.violationType,
    location: data.location,
    occurredAt: data.occurredAt,
    fineAmount: data.fineAmount,
    salt,
  });
}

function buildDisputeCanonical(data: DisputeHashData, salt: string): string {
  return JSON.stringify({
    violationId: data.violationId,
    driverId: data.driverId,
    reason: data.reason,
    submittedAt: data.submittedAt,
    salt,
  });
}
