import { Product, Sale, Customer, ShopSettings, SecurityConfig, UserSession, calculateStockStatus } from '../types/erp';

const STORAGE_KEYS = {
  PRODUCTS: 'mobile_trade_hub_products_v4',
  SALES: 'mobile_trade_hub_sales_v4',
  CUSTOMERS: 'mobile_trade_hub_customers_v4',
  SETTINGS: 'mobile_trade_hub_settings_v4',
  BILL_COUNTER: 'mobile_trade_hub_bill_counter_v4',
  SEEDED: 'mobile_trade_hub_seeded_flag_v4',
  SESSION: 'mobile_trade_hub_user_session_v4',
};

export const DEFAULT_SECURITY: SecurityConfig = {
  isLockEnabled: true,  // Required PIN lock on link open / app start by default for privacy & security
  pin: '1234',          // Default Owner/Admin PIN
  ownerName: 'Krish Rajput',
  ownerPhone: '9876543210',
  autoLockMinutes: 0,   // 0 = never auto lock
  staffPin: '0000',     // Default Staff PIN
};

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Mobile Trade Hub ERP',
  shopkeeperName: 'Krish Rajput',
  phone: '9876543210',
  address: 'Shop No. 12, Mobile Market, City Center',
  gstin: '07AAAAA0000A1Z5',
  upiId: 'mobiletradehub@upi',
  upiPayeeName: 'Krish Rajput',
  profilePhoto: '',
  qrCodeImage: '',
  enableSoundbox: true,
  soundboxVoice: 'en',
  language: 'hi',
  receiptFooterNote: 'Thank you for shopping with Mobile Trade Hub! Replacement within 3 days with bill.',
  defaultLowStockThreshold: 5,
  billPrefix: 'BILL-',
  defaultGstPercent: 0,
  allowDiscounts: true,
  receiptPaperSize: '58mm',
  security: DEFAULT_SECURITY,
};

// Initial seed products for first time setup only
export const REQUIRED_SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-typec-cable',
    name: 'Type-C Cable',
    sku: 'CAB-TYPC-01',
    category: 'Cables',
    stock: 25,
    minimum_stock: 5,
    bin: 'A-01',
    rate: 150,
    costPrice: 70,
    unit: 'Pcs',
    status: 'Healthy',
    created_at: 1713000000000,
    updated_at: 1713000000000,
  },
  {
    id: 'prod-neckband',
    name: 'Neckband',
    sku: 'NCK-BT-02',
    category: 'Audio',
    stock: 4,
    minimum_stock: 5,
    bin: 'B-02',
    rate: 750,
    costPrice: 420,
    unit: 'Pcs',
    status: 'Low Stock', // 4 <= 5
    created_at: 1713000000000,
    updated_at: 1713000000000,
  },
  {
    id: 'prod-charger-25w',
    name: 'Fast Charger 25W',
    sku: 'CHG-25W-03',
    category: 'Chargers',
    stock: 2,
    minimum_stock: 4,
    bin: 'A-03',
    rate: 499,
    costPrice: 280,
    unit: 'Pcs',
    status: 'Low Stock', // 2 <= 4
    created_at: 1713000000000,
    updated_at: 1713000000000,
  },
  {
    id: 'prod-tempered-glass',
    name: 'Tempered Glass',
    sku: 'GL-9D-04',
    category: 'Tempered Glass',
    stock: 40,
    minimum_stock: 10,
    bin: 'C-01',
    rate: 99,
    costPrice: 25,
    unit: 'Pcs',
    status: 'Healthy',
    created_at: 1713000000000,
    updated_at: 1713000000000,
  },
  {
    id: 'prod-tws-earbuds',
    name: 'TWS Air Pro Earbuds',
    sku: 'AUD-TWS-05',
    category: 'Audio',
    stock: 0,
    minimum_stock: 3,
    bin: 'B-01',
    rate: 999,
    costPrice: 550,
    unit: 'Pcs',
    status: 'Out of Stock', // 0
    created_at: 1713000000000,
    updated_at: 1713000000000,
  },
  {
    id: 'prod-powerbank-10k',
    name: 'Power Bank 10000mAh',
    sku: 'PWR-10K-06',
    category: 'Accessories',
    stock: 12,
    minimum_stock: 3,
    bin: 'D-02',
    rate: 1199,
    costPrice: 650,
    unit: 'Pcs',
    status: 'Healthy',
    created_at: 1713000000000,
    updated_at: 1713000000000,
  },
];

export const DEFAULT_PRODUCTS = REQUIRED_SEED_PRODUCTS;

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'c-1',
    name: 'Ramesh Kumar',
    phone: '9823456781',
    address: 'Near Clock Tower, Shop 5',
    totalUdhar: 850,
    updatedAt: Date.now() - 86400000 * 2,
    history: [
      {
        id: 'h-1',
        timestamp: Date.now() - 86400000 * 5,
        type: 'DEBIT_UDHAR',
        amount: 1200,
        note: 'Charger & Neckband on credit',
      },
      {
        id: 'h-2',
        timestamp: Date.now() - 86400000 * 2,
        type: 'CREDIT_PAYMENT',
        amount: 350,
        note: 'Cash payment received',
      },
    ],
  },
  {
    id: 'c-2',
    name: 'Suresh Mobile Care',
    phone: '9811223344',
    address: 'Main Market, Road 2',
    totalUdhar: 499,
    updatedAt: Date.now() - 86400000,
    history: [
      {
        id: 'h-3',
        timestamp: Date.now() - 86400000,
        type: 'DEBIT_UDHAR',
        amount: 499,
        note: 'Fast Charger 25W on credit',
      },
    ],
  },
  {
    id: 'c-3',
    name: 'Amit Verma',
    phone: '9798765432',
    address: 'Sector 4',
    totalUdhar: 0,
    updatedAt: Date.now() - 86400000 * 4,
    history: [
      {
        id: 'h-4',
        timestamp: Date.now() - 86400000 * 7,
        type: 'DEBIT_UDHAR',
        amount: 249,
        note: 'Type-C Cable & Glass',
      },
      {
        id: 'h-5',
        timestamp: Date.now() - 86400000 * 4,
        type: 'CREDIT_PAYMENT',
        amount: 249,
        note: 'UPI Payment received',
      },
    ],
  },
];

// Normalize product to ensure minimum_stock, sku, bin, and calculated status are clean
export function normalizeProduct(p: Partial<Product> & { id: string; name: string }): Product {
  const stock = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
  const minimum_stock = typeof p.minimum_stock === 'number'
    ? Math.max(0, p.minimum_stock)
    : (typeof p.minStock === 'number' ? Math.max(0, p.minStock) : 0);
  const rate = typeof p.rate === 'number' ? Math.max(0, p.rate) : 0;
  const costPrice = typeof p.costPrice === 'number' ? Math.max(0, p.costPrice) : Math.round(rate * 0.6);
  const sku = (p.sku || p.barcode || `SKU-${p.id.slice(-6)}`).trim().toUpperCase();
  const category = (p.category || 'Accessories').trim();
  const bin = (p.bin || 'A-01').trim();
  const status = calculateStockStatus(stock, minimum_stock);

  return {
    id: p.id,
    name: p.name.trim(),
    sku,
    category,
    stock,
    minimum_stock,
    minStock: minimum_stock,
    bin,
    rate,
    costPrice,
    unit: p.unit || 'Pcs',
    status,
    barcode: p.barcode || sku,
    created_at: p.created_at || Date.now(),
    updated_at: p.updated_at || Date.now(),
  };
}

const memoryStorage: Record<string, string> = {};

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // In-memory fallback for restricted environments
  }
  return memoryStorage[key] ?? null;
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // In-memory fallback
  }
  memoryStorage[key] = value;
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // In-memory fallback
  }
  delete memoryStorage[key];
}

/**
 * Loads stored products.
 * CRITICAL FIX: Only seeds once on first install!
 * Never re-inserts deleted products across page refreshes or link openings!
 */
export function getStoredProducts(): Product[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.PRODUCTS);
    const hasSeeded = safeGetItem(STORAGE_KEYS.SEEDED);

    // If never seeded before and no raw products found, initialize with defaults once
    if (raw === null && !hasSeeded) {
      const initial = REQUIRED_SEED_PRODUCTS.map(normalizeProduct);
      safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initial));
      safeSetItem(STORAGE_KEYS.SEEDED, 'true');
      return initial;
    }

    if (!raw) {
      // User emptied the inventory explicitly
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Return the user's stored products verbatim with calculated status
    // NEVER resurrect products that the user deleted!
    return parsed.map((item) => {
      const norm = normalizeProduct(item);
      return {
        ...norm,
        status: calculateStockStatus(norm.stock, norm.minimum_stock),
      };
    });
  } catch (err) {
    console.error('Error reading stored products:', err);
    return [];
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    const normalized = products.map(normalizeProduct);
    safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(normalized));
    safeSetItem(STORAGE_KEYS.SEEDED, 'true');
  } catch (err) {
    console.error('Error saving stored products:', err);
  }
}

export function getStoredSales(): Sale[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.SALES);
    if (!raw) {
      const initialSales: Sale[] = [
        {
          id: 'sale-1',
          billNo: '1001',
          timestamp: Date.now() - 1000 * 60 * 90,
          customerName: 'Sunil Gupta',
          customerPhone: '9870001122',
          items: [
            { productId: 'prod-typec-cable', sku: 'CAB-TYPC-01', name: 'Type-C Cable', qty: 2, rate: 150, costPrice: 70, unit: 'Pcs', amount: 300 },
            { productId: 'prod-tempered-glass', sku: 'GL-9D-04', name: 'Tempered Glass', qty: 1, rate: 99, costPrice: 25, unit: 'Pcs', amount: 99 },
          ],
          subtotal: 399,
          discountAmount: 19,
          taxAmount: 0,
          grandTotal: 380,
          paymentMode: 'UPI',
          paidAmount: 380,
          dueAmount: 0,
          note: 'Paid via GPay',
        },
        {
          id: 'sale-2',
          billNo: '1002',
          timestamp: Date.now() - 1000 * 60 * 25,
          customerName: 'Deepak Sharma',
          customerPhone: '9812345670',
          items: [
            { productId: 'prod-charger-25w', sku: 'CHG-25W-03', name: 'Fast Charger 25W', qty: 1, rate: 499, costPrice: 280, unit: 'Pcs', amount: 499 },
          ],
          subtotal: 499,
          discountAmount: 0,
          taxAmount: 0,
          grandTotal: 499,
          paymentMode: 'Cash',
          paidAmount: 499,
          dueAmount: 0,
        },
      ];
      safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(initialSales));
      return initialSales;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredSales(sales: Sale[]): void {
  try {
    safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch {
    // Storage quota fallback
  }
}

export function getStoredCustomers(): Customer[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) return DEFAULT_CUSTOMERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_CUSTOMERS;
  } catch {
    return DEFAULT_CUSTOMERS;
  }
}

export function saveStoredCustomers(customers: Customer[]): void {
  try {
    safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch {
    // Storage quota fallback
  }
}

export function getStoredSettings(): ShopSettings {
  try {
    const raw = safeGetItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      security: {
        ...DEFAULT_SECURITY,
        ...(parsed.security || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: ShopSettings): void {
  try {
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Storage quota fallback
  }
}

export function getStoredSession(): UserSession | null {
  try {
    const raw = safeGetItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSession(session: UserSession): void {
  try {
    safeSetItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch {
    // Storage fallback
  }
}

export function clearStoredSession(): void {
  safeRemoveItem(STORAGE_KEYS.SESSION);
}

export function getNextBillNumber(prefix: string = 'BILL-'): string {
  try {
    const current = parseInt(safeGetItem(STORAGE_KEYS.BILL_COUNTER) || '1002', 10);
    const next = current + 1;
    safeSetItem(STORAGE_KEYS.BILL_COUNTER, next.toString());
    return `${prefix}${next}`;
  } catch {
    return `${prefix}${Math.floor(Math.random() * 9000) + 1000}`;
  }
}

export function exportFullBackup(): string {
  const data = {
    appName: 'Mobile Trade Hub ERP',
    version: '4.0',
    exportDate: new Date().toISOString(),
    settings: getStoredSettings(),
    products: getStoredProducts(),
    sales: getStoredSales(),
    customers: getStoredCustomers(),
  };
  return JSON.stringify(data, null, 2);
}

export function restoreFullBackup(jsonContent: string): boolean {
  try {
    const parsed = JSON.parse(jsonContent);
    if (parsed.products && Array.isArray(parsed.products)) {
      saveStoredProducts(parsed.products);
    }
    if (parsed.sales && Array.isArray(parsed.sales)) {
      saveStoredSales(parsed.sales);
    }
    if (parsed.customers && Array.isArray(parsed.customers)) {
      saveStoredCustomers(parsed.customers);
    }
    if (parsed.settings && typeof parsed.settings === 'object') {
      saveStoredSettings(parsed.settings);
    }
    return true;
  } catch {
    return false;
  }
}
