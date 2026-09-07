import { prisma } from '../config/prisma';

export interface CreateAuditLogParams {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CASH_OPEN' | 'CASH_CLOSE' | 'RATE_SYNC' | 'PAYMENT' | 'EXPORT';
  module: 'AUTH' | 'PRODUCTS' | 'CATEGORIES' | 'INVOICES' | 'PURCHASES' | 'USERS' | 'SETTINGS' | 'RATES' | 'CASH' | 'CLIENTS' | 'DAILY_MENU';
  description: string;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

export const logAudit = async (params: CreateAuditLogParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        module: params.module,
        description: params.description,
        userId: params.userId || null,
        userName: params.userName || null,
        userRole: params.userRole || null,
        ipAddress: params.ipAddress || null,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null
      }
    });
  } catch (error) {
    console.error('Error al registrar evento de auditoría:', error);
  }
};
