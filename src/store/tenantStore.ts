import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Tenant } from '../types';

interface TenantState {
  tenants: Tenant[];
  loading: boolean;
  initialized: boolean;
  fetchTenants: () => () => void;
  addTenant: (tenantData: { name: string; email: string; slug: string; planType: 'BASIC' | 'PRO' | 'ENTERPRISE'; phone?: string; address?: string }) => Promise<void>;
  updateTenant: (id: string, data: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  loading: false,
  initialized: false,
  fetchTenants: () => {
    set({ loading: true });
    const q = query(
      collection(db, 'tenants'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tenantsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Tenant[];
      set({ tenants: tenantsData, loading: false, initialized: true });
    }, (error) => {
      console.error('Error fetching tenants:', error);
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
  deleteTenant: async (id) => {
    try {
      await deleteDoc(doc(db, 'tenants', id));
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }
  },
}));
