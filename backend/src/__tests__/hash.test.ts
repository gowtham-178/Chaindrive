import {
  generateLicenseHash,
  generateViolationHash,
  generateDisputeHash,
  generateSalt,
  verifyDataIntegrity,
  LicenseHashData,
  ViolationHashData,
  DisputeHashData,
} from '../utils/hash.utils';

describe('Hash Utilities', () => {
  const salt = 'testsalt1234567890abcdef';

  const sampleLicense: LicenseHashData = {
    licenseNumber: 'DL-2026-0001',
    userId: '60d0fe4f5311236168a109ca',
    fullName: 'Jane Doe',
    dateOfBirth: '1995-04-12',
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2036-01-01T00:00:00.000Z',
  };

  const sampleViolation: ViolationHashData = {
    violationId: 'VIO-2026-0001',
    licenseNumber: 'DL-2026-0001',
    driverId: '60d0fe4f5311236168a109ca',
    officerId: '60d0fe4f5311236168a109cb',
    violationType: 'SPEEDING',
    location: 'MG Road, Bangalore',
    occurredAt: '2026-02-15T14:30:00.000Z',
    fineAmount: 2000,
  };

  const sampleDispute: DisputeHashData = {
    violationId: 'VIO-2026-0001',
    driverId: '60d0fe4f5311236168a109ca',
    reason: 'I was not driving that vehicle at that time.',
    submittedAt: '2026-02-16T10:00:00.000Z',
  };

  it('generates deterministic keccak256 hash for license data', () => {
    const hash1 = generateLicenseHash(sampleLicense, salt);
    const hash2 = generateLicenseHash(sampleLicense, salt);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('produces different hash with different salt', () => {
    const hash1 = generateLicenseHash(sampleLicense, salt);
    const hash2 = generateLicenseHash(sampleLicense, 'differentsalt');
    expect(hash1).not.toBe(hash2);
  });

  it('produces different hash if any field changes (tamper-evident)', () => {
    const hash1 = generateLicenseHash(sampleLicense, salt);
    const tampered = { ...sampleLicense, fullName: 'John Doe' };
    const hash2 = generateLicenseHash(tampered, salt);
    expect(hash1).not.toBe(hash2);
  });

  it('verifies data integrity correctly', () => {
    const hash = generateLicenseHash(sampleLicense, salt);
    expect(verifyDataIntegrity(sampleLicense, salt, hash, 'license')).toBe(true);

    const tampered = { ...sampleLicense, licenseNumber: 'DL-2026-9999' };
    expect(verifyDataIntegrity(tampered, salt, hash, 'license')).toBe(false);
  });

  it('generates valid violation hashes and detects changes', () => {
    const hash = generateViolationHash(sampleViolation, salt);
    expect(hash).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(verifyDataIntegrity(sampleViolation, salt, hash, 'violation')).toBe(true);

    const tampered = { ...sampleViolation, fineAmount: 500 };
    expect(verifyDataIntegrity(tampered, salt, hash, 'violation')).toBe(false);
  });

  it('generates valid dispute hashes and detects changes', () => {
    const hash = generateDisputeHash(sampleDispute, salt);
    expect(hash).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(verifyDataIntegrity(sampleDispute, salt, hash, 'dispute')).toBe(true);
  });

  it('generates random salts', () => {
    const s1 = generateSalt();
    const s2 = generateSalt();
    expect(s1).not.toBe(s2);
    expect(s1.length).toBe(64);
  });
});
