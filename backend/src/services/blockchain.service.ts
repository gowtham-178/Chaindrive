import { ethers, Contract, TransactionReceipt } from 'ethers';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// ── Contract ABIs & addresses ─────────────────────────────────────────────────

interface ContractInfo {
  address: string;
  abi: ethers.InterfaceAbi;
}

interface ContractsJson {
  LicenseRegistry: ContractInfo;
  ViolationManager: ContractInfo;
  FinePayment: ContractInfo;
}

function loadContracts(): ContractsJson {
  // Try multiple paths (local dev vs deployed)
  const candidates = [
    path.join(__dirname, '../../../shared/contracts.json'),
    path.join(__dirname, '../../shared/contracts.json'),
    path.join(process.cwd(), 'shared/contracts.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8')) as ContractsJson;
    }
  }
  throw new Error('contracts.json not found. Run `npm run deploy-local` in /contracts first.');
}

// ── Provider & signer ─────────────────────────────────────────────────────────

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private licenseRegistry: Contract;
  private violationManager: Contract;
  private finePayment: Contract;

  constructor() {
    const contracts = loadContracts();

    this.provider = new ethers.JsonRpcProvider(config.hardhatRpcUrl);
    this.signer = new ethers.Wallet(config.deployerPrivateKey, this.provider);

    this.licenseRegistry = new Contract(
      contracts.LicenseRegistry.address,
      contracts.LicenseRegistry.abi,
      this.signer
    );
    this.violationManager = new Contract(
      contracts.ViolationManager.address,
      contracts.ViolationManager.abi,
      this.signer
    );
    this.finePayment = new Contract(
      contracts.FinePayment.address,
      contracts.FinePayment.abi,
      this.signer
    );
  }

  // ── LicenseRegistry ────────────────────────────────────────────────────────

  async issueLicense(
    ownerAddress: string,
    licenseHash: string,
    expiryTimestamp: number
  ): Promise<TransactionReceipt> {
    const tx = await this.licenseRegistry['issueLicense'](
      ownerAddress,
      licenseHash,
      expiryTimestamp
    );
    const receipt = await tx.wait();
    return receipt;
  }

  async renewLicense(
    licenseHash: string,
    newExpiryTimestamp: number
  ): Promise<TransactionReceipt> {
    const tx = await this.licenseRegistry['renewLicense'](licenseHash, newExpiryTimestamp);
    return await tx.wait();
  }

  async suspendLicense(licenseHash: string, reason: string): Promise<TransactionReceipt> {
    const tx = await this.licenseRegistry['suspendLicense'](licenseHash, reason);
    return await tx.wait();
  }

  async revokeLicense(licenseHash: string, reason: string): Promise<TransactionReceipt> {
    const tx = await this.licenseRegistry['revokeLicense'](licenseHash, reason);
    return await tx.wait();
  }

  async getLicenseData(licenseHash: string): Promise<{
    status: number;
    expiry: bigint;
    owner: string;
    issuedAt: bigint;
    isValid: boolean;
  }> {
    const [status, expiry, owner, issuedAt, isValid] =
      await this.licenseRegistry['getLicenseData'](licenseHash);
    return { status: Number(status), expiry, owner, issuedAt, isValid };
  }

  async verifyLicense(licenseHash: string): Promise<boolean> {
    return await this.licenseRegistry['verifyLicense'](licenseHash);
  }

  // ── ViolationManager ───────────────────────────────────────────────────────

  async recordViolation(
    violationHash: string,
    driverAddress: string,
    fineAmountWei: bigint,
    dueDateTimestamp: number
  ): Promise<{ receipt: TransactionReceipt; violationId: number }> {
    const tx = await this.violationManager['recordViolation'](
      violationHash,
      driverAddress,
      fineAmountWei,
      dueDateTimestamp
    );
    const receipt = await tx.wait();

    // Parse ViolationRecorded event to get on-chain ID
    const iface = this.violationManager.interface;
    let violationId = 0;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'ViolationRecorded') {
          violationId = Number(parsed.args['violationId']);
          break;
        }
      } catch {
        // skip unparseable logs
      }
    }

    return { receipt, violationId };
  }

  async disputeViolation(
    violationId: number,
    disputeHash: string
  ): Promise<TransactionReceipt> {
    const tx = await this.violationManager['disputeViolation'](violationId, disputeHash);
    return await tx.wait();
  }

  async resolveDispute(
    violationId: number,
    upheld: boolean,
    adjustedFineWei: bigint,
    resolutionHash: string
  ): Promise<TransactionReceipt> {
    const tx = await this.violationManager['resolveDispute'](
      violationId,
      upheld,
      adjustedFineWei,
      resolutionHash
    );
    return await tx.wait();
  }

  async getViolationData(violationId: number): Promise<{
    violationHash: string;
    driver: string;
    officer: string;
    fineAmount: bigint;
    dueDate: bigint;
    status: number;
  }> {
    const v = await this.violationManager['getViolationData'](violationId);
    return {
      violationHash: v[0],
      driver: v[1],
      officer: v[2],
      fineAmount: v[3],
      dueDate: v[4],
      status: Number(v[5]),
    };
  }

  // ── FinePayment ────────────────────────────────────────────────────────────

  async getFineAmountWei(violationId: number): Promise<bigint> {
    return await this.finePayment['getFineAmount'](violationId);
  }

  async isViolationPaid(violationId: number): Promise<boolean> {
    return await this.finePayment['isViolationPaid'](violationId);
  }

  // ── Role management ────────────────────────────────────────────────────────

  async grantOfficerRole(address: string): Promise<TransactionReceipt> {
    const role = await this.violationManager['OFFICER_ROLE']();
    const tx = await this.violationManager['grantRole'](role, address);
    return await tx.wait();
  }

  async revokeOfficerRole(address: string): Promise<TransactionReceipt> {
    const role = await this.violationManager['OFFICER_ROLE']();
    const tx = await this.violationManager['revokeRole'](role, address);
    return await tx.wait();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getSignerAddress(): string {
    return this.signer.address;
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /** Convert INR to ETH (wei) using the configured exchange rate */
  inrToWei(inrAmount: number): bigint {
    const eth = inrAmount * config.inrToEthRate;
    return ethers.parseEther(eth.toFixed(18));
  }

  /** Convert wei to ETH string */
  weiToEth(wei: bigint): string {
    return ethers.formatEther(wei);
  }
}

// Singleton instance
let _instance: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!_instance) {
    _instance = new BlockchainService();
  }
  return _instance;
}
