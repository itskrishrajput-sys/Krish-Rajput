import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { Product, Sale, Customer, ShopSettings, calculateStockStatus } from '../types/erp';
import { normalizeProduct } from '../utils/storage';

const COLLECTIONS = {
  PRODUCTS: 'products',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  SETTINGS: 'settings',
};

// 1. Products Real-time Listener & Cloud CRUD
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.PRODUCTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        items.push(normalizeProduct({ ...data, id: docSnap.id }));
      });
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.PRODUCTS);
      } catch (e) {
        console.warn('Products sync status:', e);
      }
      if (onError) onError(error as Error);
    }
  );
}

export async function saveProductToCloud(product: Product): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${product.id}`;
  try {
    const norm = normalizeProduct(product);
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), norm);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 2. Sales Real-time Listener & Cloud CRUD
export function subscribeToSales(
  onUpdate: (sales: Sale[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.SALES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Sale[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Sale);
      });
      // Sort newest first
      items.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.SALES);
      } catch (e) {
        console.warn('Sales sync status:', e);
      }
      if (onError) onError(error as Error);
    }
  );
}

export async function saveSaleToCloud(sale: Sale, updatedProducts?: Product[]): Promise<void> {
  const path = `${COLLECTIONS.SALES}/${sale.id}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.SALES, sale.id), sale);

    // Synchronously deduct stock in Firestore batch
    if (updatedProducts && updatedProducts.length > 0) {
      updatedProducts.forEach((p) => {
        const pRef = doc(db, COLLECTIONS.PRODUCTS, p.id);
        batch.set(pRef, normalizeProduct(p));
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 3. Customers Real-time Listener & Cloud CRUD
export function subscribeToCustomers(
  onUpdate: (customers: Customer[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.CUSTOMERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Customer[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Customer);
      });
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.CUSTOMERS);
      } catch (e) {
        console.warn('Customers sync status:', e);
      }
      if (onError) onError(error as Error);
    }
  );
}

export async function saveCustomerToCloud(customer: Customer): Promise<void> {
  const path = `${COLLECTIONS.CUSTOMERS}/${customer.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), customer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 4. Settings Real-time Listener & Cloud CRUD
export function subscribeToSettings(
  onUpdate: (settings: ShopSettings) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'shop');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as ShopSettings);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.SETTINGS}/shop`);
      } catch (e) {
        console.warn('Settings sync status:', e);
      }
      if (onError) onError(error as Error);
    }
  );
}

export async function saveSettingsToCloud(settings: ShopSettings): Promise<void> {
  const path = `${COLLECTIONS.SETTINGS}/shop`;
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'shop'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Initial Sync / Seed helper
export async function seedInitialFirestoreData(
  initialProducts: Product[],
  initialCustomers: Customer[],
  initialSettings: ShopSettings
): Promise<void> {
  try {
    const existing = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (existing.empty && initialProducts.length > 0) {
      const batch = writeBatch(db);
      initialProducts.forEach((p) => {
        batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), normalizeProduct(p));
      });
      initialCustomers.forEach((c) => {
        batch.set(doc(db, COLLECTIONS.CUSTOMERS, c.id), c);
      });
      batch.set(doc(db, COLLECTIONS.SETTINGS, 'shop'), initialSettings);
      await batch.commit();
    }
  } catch (err) {
    console.error('Initial seeding notice (non-fatal):', err);
  }
}
