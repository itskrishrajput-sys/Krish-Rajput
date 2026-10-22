export type ProductStatus = 'Healthy' | 'Low Stock' | 'Out of Stock';

export function calculateStockStatus(stock: number, minimumStock: number): ProductStatus {
  if (stock <= 0) {
    return 'Out of Stock';
  }
  if (stock <= minimumStock) {
    return 'Low Stock';
  }
  return 'Healthy';
}

export interface Product {
  id: string;
  name: string;
  sku: string;                 // Stock Keeping Unit (e.g. CAB-TYPC-01)
  category: string;            // Category (e.g. Cables, Chargers, Accessories)
  stock: number;               // Current in-hand quantity
  minimum_stock: number;       // Low stock alert threshold
  bin?: string;                // Bin / Shelf Location (e.g. A-01, Rack-2)
  rate: number;                // Selling price (₹)
  costPrice?: number;          // Purchase / Cost price (₹)
  unit?: string;               // e.g. 'Pcs', 'Packet', 'Box', 'Kg'
  status?: ProductStatus;      // Auto-calculated: Healthy | Low Stock | Out of Stock
  barcode?: string;
  created_at?: number | string;
  updated_at?: number | string;

  // Backwards compatibility alias
  minStock?: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  sku?: string;
  qty: number;
  rate: number;              // Current effective selling rate for this bill
  originalRate?: number;     // Original catalog rate for comparison
  costPrice: number;
  unit: string;
  amount: number;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Udhar' | 'Split';

export interface Sale {
  id: string;
  billNo: string;        // e.g. DS-1001 or INV-1001
  timestamp: number;     // epoch ms
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  paidAmount: number;
  dueAmount: number;     // If Udhar
  note?: string;
}

export interface KhataTransaction {
  id: string;
  timestamp: number;
  type: 'DEBIT_UDHAR' | 'CREDIT_PAYMENT';
  amount: number;
  billId?: string;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalUdhar: number;    // Net balance due (₹)
  updatedAt: number;
  history: KhataTransaction[];
}

export interface SecurityConfig {
  isLockEnabled: boolean;       // whether PIN lock is required
  pin: string;                 // 4-digit PIN, default '1234'
  ownerName: string;           // default 'Krish Rajput'
  ownerPhone: string;          // for PIN recovery / forgot PIN
  autoLockMinutes: number;     // 0 = never, 5, 10, 30
  staffPin: string;            // 4-digit PIN for staff, default '0000'
}

export interface UserSession {
  isLoggedIn: boolean;
  role: 'owner' | 'staff';
  loginTime: number;
  rememberMe: boolean;
}

export interface ShopSettings {
  shopName: string;
  shopkeeperName: string;
  phone: string;
  address: string;
  gstin: string;
  upiId: string;
  upiPayeeName?: string;            // Name of payee/merchant for UPI payments
  profilePhoto?: string;            // Base64 data URL or avatar emoji/URL
  qrCodeImage?: string;             // Custom uploaded QR code image (Base64)
  enableSoundbox: boolean;
  soundboxVoice: 'hi' | 'en';
  language: 'hi' | 'en';
  receiptFooterNote: string;
  defaultLowStockThreshold: number; // default 5
  billPrefix: string;               // e.g. 'BILL-'
  defaultGstPercent: number;        // e.g. 0, 5, 12, 18
  allowDiscounts: boolean;          // true
  receiptPaperSize: '58mm' | '80mm' | 'A4';
  security: SecurityConfig;
}

export type AppTab = 'dashboard' | 'inventory' | 'billing' | 'sales' | 'parties' | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
