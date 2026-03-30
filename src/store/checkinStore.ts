import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, addDoc, orderBy, limit } from 'firebase/firestore';
import { Checkin } from '../types';

interface CheckinState {
  checkins: Checkin[];
  loading: boolean;
  addCheckin: (checkin: Omit<Checkin, 'id' | 'checkinAt'>) => Promise<void>;
  fetchTodayCheckins: (tenantId: string) => () => void;
}

export const useCheckinStore = create<CheckinState>((set) => ({
  checkins: [],
  loading: false,

  addCheckin: async (checkin) => {
    await addDoc(collection(db, 'checkins'), {
      ...checkin,
      checkinAt: serverTimestamp(),
    });
  },

  fetchTodayCheckins: (tenantId: string) => {
    set({ loading: true });
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const q = query(
      collection(db, 'checkins'),
      where('tenantId', '==', tenantId),
      where('checkinAt', '>=', todayStart),
      orderBy('checkinAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const checkins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Checkin[];
      set({ checkins, loading: false });
    }, (error) => {
      console.error("Error fetching checkins:", error);
      set({ loading: false });
    });
  },
}));
