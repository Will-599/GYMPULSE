import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Payment } from '../types';

interface PaymentState {
  payments: Payment[];
  trashedPayments: Payment[];
  loading: boolean;
  fetchPayments: (tenantId: string) => () => void;
  fetchTrashedPayments: (tenantId: string) => () => void;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  softDeletePayment: (id: string) => Promise<void>;
  restorePayment: (id: string) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payments: [],
  trashedPayments: [],
  loading: false,

  fetchPayments: (tenantId: string) => {
    set({ loading: true });
    const q = query(
      collection(db, 'payments'),
      where('tenantId', '==', tenantId),
      where('isDeleted', '==', false),
      orderBy('dueDate', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      set({ payments, loading: false });
    }, (error) => {
      console.error("Error fetching payments:", error);
      set({ loading: false });
    });
  },

  fetchTrashedPayments: (tenantId: string) => {
    set({ loading: true });
    const q = query(
      collection(db, 'payments'),
      where('tenantId', '==', tenantId),
      where('isDeleted', '==', true),
      orderBy('deletedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const trashedPayments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      set({ trashedPayments, loading: false });
    }, (error) => {
      console.error("Error fetching trashed payments:", error);
      set({ loading: false });
    });
  },

  addPayment: async (payment) => {
    await addDoc(collection(db, 'payments'), {
      ...payment,
      isDeleted: false,
      createdAt: serverTimestamp(),
    });
  },

  updatePayment: async (id, payment) => {
    const paymentRef = doc(db, 'payments', id);
    await updateDoc(paymentRef, {
      ...payment,
      updatedAt: serverTimestamp(),
    });
  },

  softDeletePayment: async (id) => {
    const paymentRef = doc(db, 'payments', id);
    await updateDoc(paymentRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
  },

  restorePayment: async (id) => {
    const paymentRef = doc(db, 'payments', id);
    await updateDoc(paymentRef, {
      isDeleted: false,
      deletedAt: null,
    });
  },
}));
