import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Tenant } from '../types';

interface TenantState {
  tenants: Tenant[];
  trashedTenants: Tenant[];
  loading: boolean;
  initialized: boolean;
  fetchTenants: () => () => void;
  fetchTrashedTenants: () => () => void;
  addTenant: (tenantData: { name: string; email: string; slug: string; planType: 'BASIC' | 'PRO' | 'ENTERPRISE'; phone?: string; address?: string }) => Promise<void>;
  updateTenant: (id: string, data: Partial<Tenant>) => Promise<void>;
  softDeleteTenant: (id: string) => Promise<void>;
  restoreTenant: (id: string) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  tenants: [],
  trashedTenants: [],
  loading: false,
  initialized: false,
  fetchTenants: () => {
    set({ loading: true });
    // Emergency Fix: Fetch the entire collection to avoid Firestore hiding docs
    // that are missing fields like 'isDeleted' or 'createdAt'.
    const q = query(collection(db, 'tenants'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tenantsData = snapshot.docs
        .map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Tenant[];
      
      const getTime = (date: any) => {
        if (!date) return 0;
        if (typeof date.toMillis === 'function') return date.toMillis();
        if (date instanceof Date) return date.getTime();
        if (date.seconds) return date.seconds * 1000;
        return new Date(date).getTime() || 0;
      };

      // Active tenants: explicitly not deleted
      const filteredTenants = tenantsData
        .filter(t => t.isDeleted !== true)
        .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
      
      set({ tenants: filteredTenants, loading: false, initialized: true });
    }, (error) => {
      console.error('Error fetching tenants:', error);
      set({ loading: false });
    });

    return unsubscribe;
  },
  fetchTrashedTenants: () => {
    set({ loading: true });
    // Fetch everything and filter client-side to ensure no trashed items are missed
    const q = query(collection(db, 'tenants'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tenantsData = snapshot.docs
        .map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Tenant[];

      const getTime = (date: any) => {
        if (!date) return 0;
        if (typeof date.toMillis === 'function') return date.toMillis();
        if (date instanceof Date) return date.getTime();
        if (date.seconds) return date.seconds * 1000;
        return new Date(date).getTime() || 0;
      };

      // Trashed tenants: explicitly marked as deleted
      const sortedTrashed = tenantsData
        .filter(t => t.isDeleted === true)
        .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));

      set({ trashedTenants: sortedTrashed, loading: false });
    }, (error) => {
      console.error('Error fetching trashed tenants:', error);
      set({ loading: false });
    });

    return unsubscribe;
  },
  addTenant: async (tenantData) => {
    try {
      const tenantRef = doc(collection(db, 'tenants'));
      const newTenant: Tenant = {
        name: tenantData.name,
        email: tenantData.email,
        slug: tenantData.slug,
        planType: tenantData.planType,
        phone: tenantData.phone || '',
        address: tenantData.address || '',
        id: tenantRef.id,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {}
      };
      
      await setDoc(tenantRef, newTenant);
    } catch (error) {
      console.error('Error adding tenant:', error);
      throw error;
    }
  },
  updateTenant: async (id, data) => {
    try {
      const tenantRef = doc(db, 'tenants', id);
      await updateDoc(tenantRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
  },
  softDeleteTenant: async (id) => {
    try {
      const tenantRef = doc(db, 'tenants', id);
      await updateDoc(tenantRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error soft deleting tenant:', error);
      throw error;
    }
  },
  restoreTenant: async (id) => {
    try {
      const tenantRef = doc(db, 'tenants', id);
      await updateDoc(tenantRef, {
        isDeleted: false,
        deletedAt: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error restoring tenant:', error);
      throw error;
    }
  },
  deleteTenant: async (id) => {
    try {
      await deleteDoc(doc(db, 'tenants', id));
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }
  },
}));
