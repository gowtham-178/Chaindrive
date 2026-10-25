import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { License } from '../models/License';
import { Violation } from '../models/Violation';
import { Dispute } from '../models/Dispute';
import { Payment } from '../models/Payment';
import { User } from '../models/User';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const limit = parseInt((req.query['limit'] as string) || '30', 10);
    const targetType = req.query['targetType'] as string | undefined;

    const query: Record<string, unknown> = {};
    if (targetType) query['targetType'] = targetType;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('actorId', 'email profile role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalUsers,
      totalDrivers,
      totalOfficers,
      totalLicenses,
      issuedLicenses,
      pendingApplications,
      suspendedLicenses,
      totalViolations,
      pendingViolations,
      paidViolations,
      disputedViolations,
      payments,
      pendingDisputes,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'officer' }),
      License.countDocuments(),
      License.countDocuments({ status: 'issued' }),
      License.countDocuments({ status: 'applied' }),
      License.countDocuments({ status: 'suspended' }),
      Violation.countDocuments(),
      Violation.countDocuments({ status: 'pending' }),
      Violation.countDocuments({ status: 'paid' }),
      Violation.countDocuments({ status: 'disputed' }),
      Payment.find({ status: 'confirmed' }),
      Dispute.countDocuments({ status: 'submitted' }),
    ]);

    const totalRevenueInr = payments.reduce((acc, p) => acc + (p.amountInr || 0), 0);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          drivers: totalDrivers,
          officers: totalOfficers,
        },
        licenses: {
          total: totalLicenses,
          issued: issuedLicenses,
          pending: pendingApplications,
          suspended: suspendedLicenses,
        },
        violations: {
          total: totalViolations,
          pending: pendingViolations,
          paid: paidViolations,
          disputed: disputedViolations,
        },
        disputes: {
          pending: pendingDisputes,
        },
        financials: {
          totalRevenueInr,
          totalTransactions: payments.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
