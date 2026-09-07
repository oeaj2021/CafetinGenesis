export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  barcode?: string | null;
  description?: string;
  categoryId: string;
  category?: Category;
  costUSD: number;
  costVES?: number;
  priceUSD: number;
  priceVES?: number;
  stock: number;
  minStock: number;
  image?: string;
  isActive: boolean;
}

export interface ExchangeRate {
  id: string;
  name: string;
  rate: number;
  symbol: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  idNumber: string;
  phone: string;
  address?: string;
  email?: string;
  notes?: string;
  totalPendingDebtUSD?: number;
  totalPendingDebtVES?: number;
  _count?: { invoices: number; debts: number };
}

export interface InvoiceItem {
  id?: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPriceUSD: number;
  unitPriceVES: number;
  totalUSD: number;
  totalVES: number;
}

export interface PaymentBreakdownItem {
  method: string;
  amountUSD: number;
  amountVES: number;
  reference?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId?: string | null;
  client?: Client | null;
  clientName: string;
  clientIdNumber: string;
  clientPhone?: string | null;
  subtotalUSD: number;
  totalUSD: number;
  exchangeRate: number;
  totalVES: number;
  paymentMethod: 'CASH_USD' | 'CASH_VES' | 'PAGO_MOVIL' | 'CARD' | 'ZELLE' | 'CREDIT' | 'MIXED';
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  amountPaidUSD?: number;
  changeUSD?: number;
  paymentBreakdown?: string | null;
  notes?: string;
  createdAt: string;
  items: InvoiceItem[];
  debt?: Debt | null;
}

export interface PurchaseItem {
  id?: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitCostUSD: number;
  unitCostVES: number;
  totalUSD: number;
  totalVES: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  supplierRif?: string | null;
  totalUSD: number;
  exchangeRate: number;
  totalVES: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  items: PurchaseItem[];
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amountUSD: number;
  amountVES: number;
  exchangeRate: number;
  paymentMethod: string;
  reference?: string;
  note?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  clientId: string;
  client?: Client;
  invoiceId?: string | null;
  invoice?: Invoice | null;
  totalUSD: number;
  totalVES: number;
  remainingUSD: number;
  remainingVES: number;
  currentRemainingVES?: number;
  currentRate?: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  description?: string;
  dueDate?: string;
  createdAt: string;
  payments?: DebtPayment[];
}

export interface CashShift {
  id: string;
  cashierId: string;
  cashierName: string;
  status: 'OPEN' | 'CLOSED';
  initialCashUSD: number;
  initialCashVES: number;
  closedCashUSD?: number | null;
  closedCashVES?: number | null;
  expectedCashUSD?: number | null;
  expectedCashVES?: number | null;
  differenceUSD?: number | null;
  differenceVES?: number | null;
  totalSalesUSD: number;
  totalSalesVES: number;
  notes?: string | null;
  openedAt: string;
  closedAt?: string | null;
}

export interface DashboardStats {
  period: 'day' | 'month' | 'year';
  startDate: string;
  endDate: string;
  activeRate: ExchangeRate;
  sales: {
    count: number;
    totalUSD: number;
    totalVES: number;
    averageTicketUSD: number;
    byPaymentMethod: Record<string, { count: number; totalUSD: number }>;
    byHour?: Array<{ hour: number; label: string; count: number; totalUSD: number }>;
  };
  purchases: {
    count: number;
    totalUSD: number;
    totalVES: number;
  };
  netBalance: {
    profitUSD: number;
    profitVES: number;
    marginPercent?: number;
  };
  debts: {
    count: number;
    totalUSD: number;
    totalVES: number;
    topDebtors?: any[];
  };
  inventory: {
    totalActiveProducts: number;
    lowStockCount: number;
    lowStockItems: Product[];
  };
  totalClients: number;
  topProducts: {
    name: string;
    totalQuantity: number;
    totalUSD: number;
  }[];
}

export interface DailyMenuItem {
  id: string;
  name: string;
  description?: string;
  priceUSD: number;
  available: boolean;
  image?: string;
}

export interface DailyMenuData {
  id?: string;
  title: string;
  date: string;
  subtitle?: string;
  chefNote?: string;
  bannerImage?: string;
  isActive: boolean;
  basePriceUSD?: number;
  soupOrStarter?: string;
  soupImage?: string;
  mainDishes: DailyMenuItem[];
  sideDishes: string[];
  drinks: string[];
  desserts?: string[];
  includesSoup: boolean;
  includesDrink: boolean;
  contactPhone?: string;
  deliveryAvailable: boolean;
}

