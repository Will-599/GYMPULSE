import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, addDoc, orderBy, getDocs, limit } from 'firebase/firestore';
import { Checkin, Student } from '../types';
import toast from 'react-hot-toast';

interface CheckinState {
  checkins: Checkin[];
  loading: boolean;
  addCheckin: (checkin: Omit<Checkin, 'id' | 'checkinAt'>) => Promise<void>;
  fetchTodayCheckins: (tenantId: string) => () => void;
  validateAndCheckin: (tenantId: string, studentIdOrAccessId: string, students: Student[], method: 'QR_CODE' | 'MANUAL') => Promise<boolean>;
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

  validateAndCheckin: async (tenantId, studentIdOrAccessId, students, method) => {
    try {
      // 1. Find student locally or in provided list
      let student = students.find(s => 
        s.id === studentIdOrAccessId || 
        s.userId === studentIdOrAccessId ||
        s.accessId === studentIdOrAccessId ||
        (s.cpf?.replace(/\D/g, '') === studentIdOrAccessId.replace(/\D/g, ''))
      );

      if (!student) {
        toast.error('Aluno não encontrado');
        return false;
      }

      // 2. Check Status
      if (!student.accessGranted || student.status !== 'ACTIVE') {
        toast.error(`ACESSO NEGADO: ${student.name} está inativo ou suspenso.`, { duration: 5000 });
        return false;
      }

      // 3. Check Payments (Financial Lock)
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef, 
        where('studentId', '==', student.id),
        where('status', '==', 'OVERDUE'),
        where('isDeleted', '==', false),
        limit(1)
      );
      
      const paymentSnapshot = await getDocs(q);
      
      if (!paymentSnapshot.empty) {
        toast.error(`ACESSO BLOQUEADO: Pendência financeira para ${student.name}.`, { duration: 6000 });
        return false;
      }

      // 4. Perform Check-in
      await addDoc(collection(db, 'checkins'), {
        tenantId,
        studentId: student.id,
        method,
        checkinAt: serverTimestamp(),
      });

      toast.success(`LIBERADO: Check-in realizado para ${student.name}`, { 
        duration: 4000,
        icon: '✅'
      });
      return true;
    } catch (error) {
      console.error('Check-in validation error:', error);
      toast.error('Erro ao validar acesso.');
      return false;
    }
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
