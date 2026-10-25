import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { License } from '../models/License';
import { Violation } from '../models/Violation';
import { Dispute } from '../models/Dispute';
import { Payment } from '../models/Payment';
import { AuditLog } from '../models/AuditLog';
import { config } from '../config';
import {
  generateLicenseHash,
  generateViolationHash,
  generateDisputeHash,
  generateSalt,
} from '../utils/hash.utils';

async function seed() {
  console.log('Connecting to MongoDB at:', config.mongodbUri);
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB.');

  // Clean existing collections
  await Promise.all([
    User.deleteMany({}),
    License.deleteMany({}),
    Violation.deleteMany({}),
    Dispute.deleteMany({}),
    Payment.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('Cleaned existing collections.');

  // Password hashes
  const adminHash = await bcrypt.hash('AdminPass123!', 10);
  const officerHash = await bcrypt.hash('OfficerPass123!', 10);
  const driverHash = await bcrypt.hash('DriverPass123!', 10);

  // 1. Create Users
  console.log('Creating demo users...');
  const admin = await User.create({
    email: 'admin@chaindrive.gov',
    passwordHash: adminHash,
    role: 'admin',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat Account #0 (Deployer)
    profile: {
      fullName: 'Vikramaditya Roy (Director General)',
      phone: '+91 98110 00001',
    },
  });

  const officer = await User.create({
    email: 'officer.sharma@police.gov',
    passwordHash: officerHash,
    role: 'officer',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Hardhat Account #2
    profile: {
      fullName: 'Inspector Rajesh Sharma (Badge #TRF-402)',
      phone: '+91 98110 00002',
    },
  });

  const driver1 = await User.create({
    email: 'driver.rahul@example.com',
    passwordHash: driverHash,
    role: 'driver',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat Account #1
    profile: {
      fullName: 'Rahul Verma',
      phone: '+91 98110 00003',
      dateOfBirth: '1996-05-15',
      address: {
        street: '42 Indiranagar 100ft Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560038',
      },
    },
  });

  const driver2 = await User.create({
    email: 'driver.priya@example.com',
    passwordHash: driverHash,
    role: 'driver',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Hardhat Account #3
    profile: {
      fullName: 'Priya Sundaram',
      phone: '+91 98110 00004',
      dateOfBirth: '1999-08-22',
      address: {
        street: '7 Koramangala 4th Block',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560034',
      },
    },
  });

  const driver3 = await User.create({
    email: 'driver.vikram@example.com',
    passwordHash: driverHash,
    role: 'driver',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Hardhat Account #4
    profile: {
      fullName: 'Vikram Malhotra',
      phone: '+91 98110 00005',
      dateOfBirth: '1992-11-03',
      address: {
        street: '15 Whitefield Main Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560066',
      },
    },
  });

  // 2. Create Licenses
  console.log('Creating demo licenses...');
  const salt1 = generateSalt();
  const issuedAt1 = new Date('2024-01-10T00:00:00.000Z');
  const expiresAt1 = new Date('2044-01-10T00:00:00.000Z');
  const licNum1 = 'DL-IND-2024-849201';
  const licHash1 = generateLicenseHash(
    {
      licenseNumber: licNum1,
      userId: (driver1._id as mongoose.Types.ObjectId).toString(),
      fullName: driver1.profile.fullName,
      dateOfBirth: '1996-05-15',
      issuedAt: issuedAt1.toISOString(),
      expiresAt: expiresAt1.toISOString(),
    },
    salt1
  );

  const toLicenseAddress = (addr: any) => ({
    street: addr?.street || '123 Main Street',
    city: addr?.city || 'Bangalore',
    state: addr?.state || 'Karnataka',
    postalCode: addr?.postalCode || addr?.pincode || '560001',
  });

  const license1 = await License.create({
    licenseNumber: licNum1,
    userId: driver1._id,
    fullName: driver1.profile.fullName,
    dateOfBirth: new Date('1996-05-15'),
    gender: 'Male',
    bloodGroup: 'B+',
    address: toLicenseAddress(driver1.profile.address),
    vehicleClasses: ['MCWG', 'LMV'],
    status: 'issued',
    onChainHash: licHash1,
    salt: salt1,
    issuedAt: issuedAt1,
    expiresAt: expiresAt1,
    qrCode: JSON.stringify({
      licenseNumber: licNum1,
      holder: driver1.profile.fullName,
      hash: licHash1,
      verifyUrl: `/verify?number=${licNum1}`,
    }),
    history: [
      {
        action: 'APPLICATION_SUBMITTED',
        actorId: driver1._id,
        actorRole: 'driver',
        timestamp: new Date('2024-01-05T10:00:00.000Z'),
        notes: 'Initial application submitted',
      },
      {
        action: 'APPLICATION_APPROVED',
        actorId: admin._id,
        actorRole: 'admin',
        timestamp: new Date('2024-01-08T14:00:00.000Z'),
        notes: 'Documents verified',
      },
      {
        action: 'LICENSE_ISSUED_ON_CHAIN',
        actorId: admin._id,
        actorRole: 'admin',
        timestamp: issuedAt1,
        notes: `Minted on-chain: ${licHash1}`,
        txHash: '0x4f128bc4167e89ab2d83749e75c6d354b02319efb7291a0391cbef9294e77218',
      },
    ],
  });

  // Pending application for Driver 2
  const license2 = await License.create({
    userId: driver2._id,
    fullName: driver2.profile.fullName,
    dateOfBirth: new Date('1999-08-22'),
    gender: 'Female',
    bloodGroup: 'O+',
    address: toLicenseAddress(driver2.profile.address),
    vehicleClasses: ['LMV'],
    status: 'applied',
    applicationDate: new Date(),
    applicationNotes: 'Passed learner road test at Indiranagar RTO',
    history: [
      {
        action: 'APPLICATION_SUBMITTED',
        actorId: driver2._id,
        actorRole: 'driver',
        timestamp: new Date(),
        notes: 'Submitted application with ID proof',
      },
    ],
  });

  // Suspended license for Driver 3
  const salt3 = generateSalt();
  const issuedAt3 = new Date('2023-06-01T00:00:00.000Z');
  const expiresAt3 = new Date('2043-06-01T00:00:00.000Z');
  const licNum3 = 'DL-IND-2023-559102';
  const licHash3 = generateLicenseHash(
    {
      licenseNumber: licNum3,
      userId: (driver3._id as mongoose.Types.ObjectId).toString(),
      fullName: driver3.profile.fullName,
      dateOfBirth: '1992-11-03',
      issuedAt: issuedAt3.toISOString(),
      expiresAt: expiresAt3.toISOString(),
    },
    salt3
  );

  const license3 = await License.create({
    licenseNumber: licNum3,
    userId: driver3._id,
    fullName: driver3.profile.fullName,
    dateOfBirth: new Date('1992-11-03'),
    gender: 'Male',
    bloodGroup: 'A+',
    address: toLicenseAddress(driver3.profile.address),
    vehicleClasses: ['MCWG', 'LMV', 'HMV'],
    status: 'suspended',
    onChainHash: licHash3,
    salt: salt3,
    issuedAt: issuedAt3,
    expiresAt: expiresAt3,
    suspensionReason: 'Exceeded maximum penalty points; reckless driving under alcohol influence.',
    history: [
      {
        action: 'LICENSE_SUSPENDED',
        actorId: admin._id,
        actorRole: 'admin',
        timestamp: new Date(),
        notes: 'Dangerous driving citation suspension',
      },
    ],
  });

  // 3. Create Violations
  console.log('Creating demo violations...');
  // Violation 1: Speeding for Rahul (Pending)
  const vioId1 = 'VIO-2026-10492';
  const saltVio1 = generateSalt();
  const occurredAt1 = new Date('2026-02-10T14:30:00.000Z');
  const vioHash1 = generateViolationHash(
    {
      violationId: vioId1,
      licenseNumber: licNum1,
      driverId: (driver1._id as mongoose.Types.ObjectId).toString(),
      officerId: (officer._id as mongoose.Types.ObjectId).toString(),
      violationType: 'SPEEDING',
      location: 'MG Road Expressway, Bangalore',
      occurredAt: occurredAt1.toISOString(),
      fineAmount: 2000,
    },
    saltVio1
  );

  const violation1 = await Violation.create({
    violationId: vioId1,
    onChainViolationId: 10492,
    licenseNumber: licNum1,
    driverId: driver1._id,
    driverAddress: driver1.walletAddress,
    officerId: officer._id,
    officerBadgeNumber: 'TRF-402',
    violationType: 'SPEEDING',
    description: 'Vehicle clocked at 85 km/h in 50 km/h urban arterial corridor.',
    location: 'MG Road Expressway, Bangalore',
    occurredAt: occurredAt1,
    fineAmountInr: 2000,
    fineAmountWei: '666666666666666',
    dueDate: new Date(Date.now() + 25 * 24 * 3600 * 1000),
    status: 'pending',
    onChainHash: vioHash1,
    salt: saltVio1,
    vehiclePlate: 'KA-01-MJ-4920',
    history: [
      {
        action: 'VIOLATION_RECORDED',
        actorId: officer._id,
        actorRole: 'officer',
        timestamp: occurredAt1,
        notes: 'Recorded via automated speed radar',
        txHash: '0x1ab8394ef882190cd93751a03958bf628172901b0028198f8291a1a729b12850',
      },
    ],
  });

  // Violation 2: Red Light for Rahul (Paid via MetaMask)
  const vioId2 = 'VIO-2026-09281';
  const saltVio2 = generateSalt();
  const occurredAt2 = new Date('2026-01-18T18:15:00.000Z');
  const vioHash2 = generateViolationHash(
    {
      violationId: vioId2,
      licenseNumber: licNum1,
      driverId: (driver1._id as mongoose.Types.ObjectId).toString(),
      officerId: (officer._id as mongoose.Types.ObjectId).toString(),
      violationType: 'RED_LIGHT',
      location: 'Sony World Junction, Koramangala',
      occurredAt: occurredAt2.toISOString(),
      fineAmount: 1500,
    },
    saltVio2
  );

  const violation2 = await Violation.create({
    violationId: vioId2,
    onChainViolationId: 9281,
    licenseNumber: licNum1,
    driverId: driver1._id,
    driverAddress: driver1.walletAddress,
    officerId: officer._id,
    officerBadgeNumber: 'TRF-402',
    violationType: 'RED_LIGHT',
    description: 'Failure to comply with red traffic signal at major intersection.',
    location: 'Sony World Junction, Koramangala',
    occurredAt: occurredAt2,
    fineAmountInr: 1500,
    fineAmountWei: '500000000000000',
    dueDate: new Date('2026-02-18'),
    status: 'paid',
    onChainHash: vioHash2,
    salt: saltVio2,
    vehiclePlate: 'KA-01-MJ-4920',
    paidAt: new Date('2026-01-20T11:00:00.000Z'),
    paidTxHash: '0x7b928193a02938475f8291039847291a039b2847192837465928172948192837',
    history: [
      {
        action: 'VIOLATION_RECORDED',
        actorId: officer._id,
        actorRole: 'officer',
        timestamp: occurredAt2,
      },
      {
        action: 'FINE_PAID',
        actorId: driver1._id,
        actorRole: 'driver',
        timestamp: new Date('2026-01-20T11:00:00.000Z'),
        notes: 'Paid via MetaMask Web3',
        txHash: '0x7b928193a02938475f8291039847291a039b2847192837465928172948192837',
      },
    ],
  });

  // 4. Payment record for Violation 2
  await Payment.create({
    paymentId: 'PAY-1705748400000-8492',
    violationId: vioId2,
    onChainViolationId: 9281,
    payerAddress: driver1.walletAddress!,
    amountWei: '500000000000000',
    amountInr: 1500,
    txHash: '0x7b928193a02938475f8291039847291a039b2847192837465928172948192837',
    blockNumber: 42,
    timestamp: new Date('2026-01-20T11:00:00.000Z'),
    status: 'confirmed',
  });

  // Violation 3: Disputed citation for Vikram
  const vioId3 = 'VIO-2026-11849';
  const saltVio3 = generateSalt();
  const occurredAt3 = new Date('2026-02-05T23:10:00.000Z');
  const vioHash3 = generateViolationHash(
    {
      violationId: vioId3,
      licenseNumber: licNum3,
      driverId: (driver3._id as mongoose.Types.ObjectId).toString(),
      officerId: (officer._id as mongoose.Types.ObjectId).toString(),
      violationType: 'RECKLESS_DRIVING',
      location: 'Outer Ring Road, Marathahalli',
      occurredAt: occurredAt3.toISOString(),
      fineAmount: 5000,
    },
    saltVio3
  );

  const violation3 = await Violation.create({
    violationId: vioId3,
    onChainViolationId: 11849,
    licenseNumber: licNum3,
    driverId: driver3._id,
    driverAddress: driver3.walletAddress,
    officerId: officer._id,
    officerBadgeNumber: 'TRF-402',
    violationType: 'RECKLESS_DRIVING',
    description: 'Vehicle observed swerving rapidly across multiple highway lanes without indicators.',
    location: 'Outer Ring Road, Marathahalli',
    occurredAt: occurredAt3,
    fineAmountInr: 5000,
    fineAmountWei: '1666666666666666',
    dueDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
    status: 'disputed',
    onChainHash: vioHash3,
    salt: saltVio3,
    vehiclePlate: 'KA-03-NV-1928',
    history: [
      {
        action: 'VIOLATION_RECORDED',
        actorId: officer._id,
        actorRole: 'officer',
        timestamp: occurredAt3,
      },
      {
        action: 'DISPUTE_SUBMITTED',
        actorId: driver3._id,
        actorRole: 'driver',
        timestamp: new Date('2026-02-06T09:00:00.000Z'),
        notes: 'Driver contends vehicle was operated by valet service at the time',
      },
    ],
  });

  // 5. Create Dispute for Violation 3
  const dispHash = generateDisputeHash(
    {
      violationId: vioId3,
      driverId: (driver3._id as mongoose.Types.ObjectId).toString(),
      reason: 'I was attending a wedding banquet at that hour; my vehicle was parked with hotel valet.',
      submittedAt: '2026-02-06T09:00:00.000Z',
    },
    generateSalt()
  );

  await Dispute.create({
    disputeId: 'DISP-1707210000000',
    violationId: vioId3,
    onChainViolationId: 11849,
    driverId: driver3._id,
    driverAddress: driver3.walletAddress,
    reason: 'I was attending a wedding banquet at that hour; my vehicle was parked with hotel valet.',
    status: 'submitted',
    submittedAt: new Date('2026-02-06T09:00:00.000Z'),
    onChainHash: dispHash,
    txHash: '0x9fa1820398471928374650192847192837465019284719283746501928471928',
  });

  // 6. Audit Logs
  console.log('Creating initial audit trail...');
  await AuditLog.create([
    {
      action: 'SYSTEM_INITIALIZATION',
      targetType: 'system',
      details: { version: '1.0.0', network: 'Hardhat Localhost' },
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      action: 'USER_REGISTERED',
      actorRole: 'admin',
      targetType: 'user',
      targetId: (admin._id as mongoose.Types.ObjectId).toString(),
      details: { email: admin.email, role: 'admin' },
      timestamp: new Date('2024-01-02T00:00:00.000Z'),
    },
    {
      action: 'LICENSE_ISSUED_ON_CHAIN',
      actorRole: 'admin',
      targetType: 'license',
      targetId: licNum1,
      details: { licenseNumber: licNum1, onChainHash: licHash1 },
      timestamp: issuedAt1,
    },
    {
      action: 'VIOLATION_RECORDED',
      actorRole: 'officer',
      targetType: 'violation',
      targetId: vioId1,
      details: { fineAmountInr: 2000, violationType: 'SPEEDING' },
      timestamp: occurredAt1,
    },
    {
      action: 'FINE_PAID',
      actorRole: 'driver',
      targetType: 'payment',
      targetId: 'PAY-1705748400000-8492',
      details: { violationId: vioId2, amountInr: 1500 },
      timestamp: new Date('2026-01-20T11:00:00.000Z'),
    },
  ]);

  console.log('\n======================================================');
  console.log('✅ Demo Seed Data successfully created in MongoDB!');
  console.log('======================================================');
  console.log('Demo Credentials:');
  console.log('  Admin:   admin@chaindrive.gov       / AdminPass123!');
  console.log('  Officer: officer.sharma@police.gov  / OfficerPass123!');
  console.log('  Driver:  driver.rahul@example.com   / DriverPass123!');
  console.log('  Driver2: driver.priya@example.com   / DriverPass123!');
  console.log('  Driver3: driver.vikram@example.com  / DriverPass123!');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
