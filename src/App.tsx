import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Product,
  Sale,
  Customer,
  ShopSettings,
  AppTab,
  ToastMessage,
  UserSession,
  calculateStockStatus,
} from './types/erp';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredSales,
  saveStoredSales,
  getStoredCustomers,
  saveStoredCustomers,
  getStoredSettings,
  saveStoredSettings,
  getNextBillNumber,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
} from './utils/storage';
import {
  subscribeToProducts,
  saveProductToCloud,
  deleteProductFromCloud,
  subscribeToSales,
  saveSaleToCloud,
  subscribeToCustomers,
  saveCustomerToCloud,
  subscribeToSettings,
  saveSettingsToCloud,
  seedInitialFirestoreData,
} from './firebase/firestoreService';
import { testFirestoreConnection } from './firebase/config';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';
import { LoginScreen } from './components/LoginScreen';

// Lazy load non-critical tabs and heavy modals to achieve instant sub-second initial load on mobile
const DashboardPage = React.lazy(() => import('./components/DashboardPage').then(m => ({ default: m.DashboardPage })));
const InventoryPage = React.lazy(() => import('./components/InventoryPage').then(m => ({ default: m.InventoryPage })));
const BillingTab = React.lazy(() => import('./components/BillingTab').then(m => ({ default: m.BillingTab })));
const KhataTab = React.lazy(() => import('./components/KhataTab').then(m => ({ default: m.KhataTab })));
const ReportsTab = React.lazy(() => import('./components/ReportsTab').then(m => ({ default: m.ReportsTab })));
const SettingsTab = React.lazy(() => import('./components/SettingsTab').then(m => ({ default: m.SettingsTab })));
const ReceiptModal = React.lazy(() => import('./components/ReceiptModal').then(m => ({ default: m.ReceiptModal })));
const ProductFormModal = React.lazy(() => import('./components/ProductFormModal').then(m => ({ default: m.ProductFormModal })));
const DeleteConfirmationModal = React.lazy(() => import('./components/DeleteConfirmationModal').then(m => ({ default: m.DeleteConfirmationModal })));
const ReceivePaymentModal = React.lazy(() => import('./components/ReceivePaymentModal').then(m => ({ default: m.ReceivePaymentModal })));
const ShareLinkModal = React.lazy(() => import('./components/ShareLinkModal').then(m => ({ default: m.ShareLinkModal })));
const ChangePinModal = React.lazy(() => import('./components/ChangePinModal').then(m => ({ default: m.ChangePinModal })));

const TabFallback = () => (
  <div className="flex flex-col items-center justify-center p-16 space-y-3">
    <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    <span className="text-xs font-medium text-slate-500">लोड हो रहा है...</span>
  </div>
);

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [sales, setSales] = useState<Sale[]>(() => getStoredSales());
  const [customers, setCustomers] = useState<Customer[]>(() => getStoredCustomers());
  const [settings, setSettings] = useState<ShopSettings>(() => getStoredSettings());
  const [activeTab, setActiveTab] = useState<AppTab>('inventory');
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Security & Authentication State
  const [session, setSession] = useState<UserSession | null>(() => getStoredSession());
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const stored = getStoredSettings();
    const storedSess = getStoredSession();
    // If lock is enabled and no active valid session, lock app on start
    if (stored.security?.isLockEnabled !== false) {
      return !storedSess?.isLoggedIn;
    }
    return false;
  });

  // Share Link & Change PIN Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);

  // Modals state
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false);
  const [customerForPayment, setCustomerForPayment] = useState<Customer | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Cloud Sync and Real-time Listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initializeCloud = async () => {
      // 1. Attach Real-time Listeners immediately without waiting for slow server ping
      try {
        const unsubProducts = subscribeToProducts((cloudProducts) => {
          if (cloudProducts.length > 0) {
            setProducts(cloudProducts);
            saveStoredProducts(cloudProducts);
          }
        });

        const unsubSales = subscribeToSales((cloudSales) => {
          if (cloudSales.length > 0) {
            setSales(cloudSales);
            saveStoredSales(cloudSales);
          }
        });

        const unsubCustomers = subscribeToCustomers((cloudCustomers) => {
          if (cloudCustomers.length > 0) {
            setCustomers(cloudCustomers);
            saveStoredCustomers(cloudCustomers);
          }
        });

        const unsubSettings = subscribeToSettings((cloudSettings) => {
          if (cloudSettings && cloudSettings.shopName) {
            setSettings(cloudSettings);
            saveStoredSettings(cloudSettings);
          }
        });

        unsubs = [unsubProducts, unsubSales, unsubCustomers, unsubSettings];
        setIsCloudConnected(true);
      } catch (err) {
        console.warn('Real-time listener setup error (offline mode):', err);
        setIsCloudConnected(false);
      }

      // 2. Non-blocking connectivity test with 3.5s timeout guard so mobile links never stall
      try {
        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3500));
        const isConnected = await Promise.race([testFirestoreConnection(), timeoutPromise]);
        setIsCloudConnected(isConnected);

        // 3. Background non-blocking initial seed
        seedInitialFirestoreData(products, customers, settings).catch(() => {});
      } catch (err) {
        console.warn('Non-blocking cloud verification notice:', err);
      }
    };

    initializeCloud();

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
    };
  }, []);

  // Sync local changes to localStorage as offline safety layer
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredSales(sales);
  }, [sales]);

  useEffect(() => {
    saveStoredCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveStoredSettings(settings);
    saveSettingsToCloud(settings).catch(() => {});
  }, [settings]);

  // Derived metrics
  const todaySalesCount = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return sales.filter((s) => s.timestamp >= startOfToday.getTime()).length;
  }, [sales]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= (p.minimum_stock ?? 0)).length;
  }, [products]);

  const allCategories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  // Handle Login
  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    if (newSession.rememberMe) {
      saveStoredSession(newSession);
    }
    setIsAppLocked(false);
    addToast('success', settings.language === 'hi' ? 'लॉगिन सफल!' : 'Unlocked successfully!');
  };

  const handleLockApp = () => {
    setIsAppLocked(true);
    addToast('info', settings.language === 'hi' ? 'ऐप लॉक कर दिया गया है।' : 'Application locked.');
  };

  const handleResetPin = (newPin: string) => {
    setSettings((prev) => {
      const nextSettings = {
        ...prev,
        security: {
          ...(prev.security || {}),
          pin: newPin,
        },
      };
      saveStoredSettings(nextSettings);
      saveSettingsToCloud(nextSettings).catch(() => {});
      return nextSettings;
    });
    addToast('success', settings.language === 'hi' ? `पिन रीसेट हो गया: ${newPin}` : `PIN reset to ${newPin}`);
  };

  // Product Add / Edit Handler - LIVE PERSISTENCE TO LOCAL + FIRESTORE CLOUD
  const handleSaveProduct = async (productData: Product) => {
    // Check SKU duplicate safety
    const duplicate = products.find(
      (p) =>
        p.sku.toUpperCase() === productData.sku.toUpperCase() &&
        p.id !== productData.id
    );

    if (duplicate) {
      addToast('error', `SKU "${productData.sku}" is already assigned to "${duplicate.name}".`);
      throw new Error('Duplicate SKU');
    }

    const idx = products.findIndex((p) => p.id === productData.id);
    let nextList: Product[];
    let normalizedProduct: Product;

    if (idx >= 0) {
      normalizedProduct = {
        ...productData,
        status: calculateStockStatus(productData.stock, productData.minimum_stock ?? 0),
        updated_at: Date.now(),
      };
      nextList = [...products];
      nextList[idx] = normalizedProduct;
    } else {
      normalizedProduct = {
        ...productData,
        status: calculateStockStatus(productData.stock, productData.minimum_stock ?? 0),
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      nextList = [normalizedProduct, ...products];
    }

    // Immediate local persistence
    setProducts(nextList);
    saveStoredProducts(nextList);

    // Cloud persistence
    saveProductToCloud(normalizedProduct).catch((err) => {
      console.warn('Cloud product save queued:', err);
    });

    if (editingProduct) {
      addToast(
        'success',
        settings.language === 'hi'
          ? `प्रोडक्ट "${productData.name}" अपडेट हो गया।`
          : `Product "${productData.name}" updated successfully.`
      );
    } else {
      addToast(
        'success',
        settings.language === 'hi'
          ? `नया प्रोडक्ट "${productData.name}" जुड़ गया (क्लाउड सिंक)।`
          : `Product "${productData.name}" added successfully.`
      );
    }
  };

  // Delete product execution - LIVE PERSISTENCE WITHOUT BOUNCE BACK
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const nextList = products.filter((p) => p.id !== productToDelete.id);
      setProducts(nextList);
      saveStoredProducts(nextList);

      // Delete from Firestore Cloud permanently!
      await deleteProductFromCloud(productToDelete.id);

      addToast(
        'success',
        settings.language === 'hi'
          ? `प्रोडक्ट "${productToDelete.name}" हमेशा के लिए हटा दिया गया।`
          : `Product "${productToDelete.name}" deleted permanently.`
      );
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch {
      addToast(
        'error',
        settings.language === 'hi'
          ? 'प्रोडक्ट हटाने में त्रुटि हुई।'
          : 'Failed to delete product.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Record Payment for Khata customer
  const handleRecordKhataPayment = (customerId: string, amount: number, note: string) => {
    let updatedCust: Customer | null = null;
    setCustomers((prev) => {
      const nextCusts = prev.map((c) => {
        if (c.id === customerId) {
          const newUdhar = Math.max(0, c.totalUdhar - amount);
          updatedCust = {
            ...c,
            totalUdhar: newUdhar,
            updatedAt: Date.now(),
            history: [
              {
                id: `h-${Date.now()}`,
                timestamp: Date.now(),
                type: 'CREDIT_PAYMENT' as const,
                amount,
                note: note || 'Payment received',
              },
              ...c.history,
            ],
          };
          return updatedCust;
        }
        return c;
      });
      saveStoredCustomers(nextCusts);
      return nextCusts;
    });

    if (updatedCust) {
      saveCustomerToCloud(updatedCust).catch(() => {});
    }
    addToast('success', `Recorded payment of ₹${amount} in customer ledger.`);
  };

  // Strict App Lock for shared links & visitors: Zero data exposure without Owner PIN
  if (isAppLocked) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <LoginScreen
          settings={settings}
          onLoginSuccess={handleLoginSuccess}
          onResetPin={handleResetPin}
          onOpenChangePinModal={() => setIsChangePinModalOpen(true)}
        />
        {isChangePinModalOpen && (
          <React.Suspense fallback={null}>
            <ChangePinModal
              isOpen={isChangePinModalOpen}
              onClose={() => setIsChangePinModalOpen(false)}
              settings={settings}
              onUpdatePin={handleResetPin}
              onShowToast={addToast}
            />
          </React.Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col pb-20 md:pb-8 font-sans">
      
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Bar Header */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        setSettings={(newSettings) => {
          setSettings(newSettings);
          if (typeof newSettings === 'function') {
            // handle functional update
          } else {
            saveSettingsToCloud(newSettings).catch(() => {});
          }
        }}
        todaySalesCount={todaySalesCount}
        session={session}
        onLockApp={handleLockApp}
        isCloudConnected={isCloudConnected}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenChangePin={() => setIsChangePinModalOpen(true)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 w-full">
        <React.Suspense fallback={<TabFallback />}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              products={products}
              sales={sales}
              customers={customers}
              settings={settings}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenReceipt={(sale) => setActiveReceiptSale(sale)}
              onOpenAddProductModal={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenEditProductModal={(product) => {
                setEditingProduct(product);
                setIsProductModalOpen(true);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              products={products}
              setProducts={setProducts}
              settings={settings}
              onOpenAddModal={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenEditModal={(product) => {
                setEditingProduct(product);
                setIsProductModalOpen(true);
              }}
              onOpenDeleteModal={(product) => {
                setProductToDelete(product);
                setIsDeleteModalOpen(true);
              }}
            />
          )}

          {activeTab === 'billing' && (
            <BillingTab
              products={products}
              setProducts={setProducts}
              customers={customers}
              setCustomers={setCustomers}
              sales={sales}
              setSales={setSales}
              settings={settings}
              onOpenReceipt={(sale) => setActiveReceiptSale(sale)}
              getNextBillNo={() => getNextBillNumber(settings.billPrefix || 'BILL-')}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'sales' && (
            <ReportsTab
              sales={sales}
              setSales={setSales}
              settings={settings}
              onOpenReceipt={(sale) => setActiveReceiptSale(sale)}
            />
          )}

          {activeTab === 'parties' && (
            <KhataTab
              customers={customers}
              setCustomers={setCustomers}
              settings={settings}
              onOpenReceivePayment={(customer) => {
                setCustomerForPayment(customer);
                setIsReceivePaymentOpen(true);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              products={products}
              sales={sales}
              settings={settings}
              setSettings={(val) => {
                setSettings(val);
                if (typeof val !== 'function') {
                  saveSettingsToCloud(val).catch(() => {});
                }
              }}
              setProducts={setProducts}
              setCustomers={setCustomers}
              setSales={setSales}
              onLockApp={handleLockApp}
              onShowToast={addToast}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onOpenChangePin={() => setIsChangePinModalOpen(true)}
            />
          )}
        </React.Suspense>
      </main>

      {/* Mobile Bottom Sticky Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={settings.language}
        lowStockCount={lowStockCount}
      />

      {/* Lazy Modals */}
      <React.Suspense fallback={null}>
        {/* Printable Receipt & WhatsApp Share Modal */}
        {activeReceiptSale && (
          <ReceiptModal
            sale={activeReceiptSale}
            settings={settings}
            onClose={() => setActiveReceiptSale(null)}
          />
        )}

        {/* Add / Edit Product Modal */}
        {isProductModalOpen && (
          <ProductFormModal
            isOpen={isProductModalOpen}
            onClose={() => {
              setIsProductModalOpen(false);
              setEditingProduct(null);
            }}
            onSave={handleSaveProduct}
            editingProduct={editingProduct}
            existingProducts={products}
            categories={allCategories}
            language={settings.language}
          />
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && productToDelete && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            product={productToDelete}
            isDeleting={isDeleting}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setIsDeleteModalOpen(false);
              setProductToDelete(null);
            }}
            language={settings.language}
          />
        )}

        {/* Receive Udhar Payment Modal */}
        {isReceivePaymentOpen && customerForPayment && (
          <ReceivePaymentModal
            isOpen={isReceivePaymentOpen}
            onClose={() => {
              setIsReceivePaymentOpen(false);
              setCustomerForPayment(null);
            }}
            customer={customerForPayment}
            onRecordPayment={handleRecordKhataPayment}
            language={settings.language}
          />
        )}

        {/* Share Shop Link & PIN Modal */}
        {isShareModalOpen && (
          <ShareLinkModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            settings={settings}
            onOpenChangePin={() => {
              setIsShareModalOpen(false);
              setIsChangePinModalOpen(true);
            }}
            onShowToast={addToast}
          />
        )}

        {/* Change Security PIN / Password Modal */}
        {isChangePinModalOpen && (
          <ChangePinModal
            isOpen={isChangePinModalOpen}
            onClose={() => setIsChangePinModalOpen(false)}
            settings={settings}
            onUpdatePin={handleResetPin}
            onShowToast={addToast}
          />
        )}
      </React.Suspense>

    </div>
  );
}
