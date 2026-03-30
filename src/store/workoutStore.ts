import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { TrainingPlan, WorkoutTemplate } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface WorkoutState {
  templates: WorkoutTemplate[];
  plans: TrainingPlan[];
  trashedTemplates: WorkoutTemplate[];
  trashedPlans: TrainingPlan[];
  loading: boolean;
  initialized: boolean;
  fetchTemplates: (tenantId: string) => () => void;
  fetchPlans: (tenantId: string) => () => void;
  fetchTrashedTemplates: (tenantId: string) => () => void;
  fetchTrashedPlans: (tenantId: string) => () => void;
  assignPlan: (plan: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePlan: (id: string, plan: Partial<TrainingPlan>) => Promise<void>;
  softDeletePlan: (id: string) => Promise<void>;
  restorePlan: (id: string) => Promise<void>;
  softDeleteTemplate: (id: string) => Promise<void>;
  restoreTemplate: (id: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  templates: [],
  plans: [],
  trashedTemplates: [],
  trashedPlans: [],
  loading: false,
  initialized: false,
  fetchTemplates: (tenantId: string) => {
    set({ loading: true });
    const q = query(
      collection(db, 'workoutTemplates'),
      where('tenantId', '==', tenantId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const templatesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as WorkoutTemplate[];
      set({ templates: templatesData, loading: false, initialized: true });
    });

    return unsubscribe;
  },
  fetchPlans: (tenantId: string) => {
    set({ loading: true });
    const q = query(
      collection(db, 'trainingPlans'),
      where('tenantId', '==', tenantId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as TrainingPlan[];
      set({ plans: plansData, loading: false, initialized: true });
    });

    return unsubscribe;
  },
  fetchTrashedTemplates: (tenantId: string) => {
    set({ loading: true });
    const q = query(
      collection(db, 'workoutTemplates'),
      where('tenantId', '==', tenantId),
      where('isDeleted', '==', true),
      orderBy('deletedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trashedData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as WorkoutTemplate[];
      set({ trashedTemplates: trashedData, loading: false });
    });

    return unsubscribe;
  },
  fetchTrashedPlans: (tenantId: string) => {
    set({ loading: true });
    const q = query(
      collection(db, 'trainingPlans'),
      where('tenantId', '==', tenantId),
      where('isDeleted', '==', true),
      orderBy('deletedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trashedData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as TrainingPlan[];
      set({ trashedPlans: trashedData, loading: false });
    });

    return unsubscribe;
  },
  assignPlan: async (plan) => {
    try {
      await addDoc(collection(db, 'trainingPlans'), {
        ...plan,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trainingPlans');
      throw error;
    }
  },
  updatePlan: async (id, plan) => {
    try {
      await updateDoc(doc(db, 'trainingPlans', id), {
        ...plan,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trainingPlans/${id}`);
      throw error;
    }
  },
  softDeletePlan: async (id) => {
    try {
      await updateDoc(doc(db, 'trainingPlans', id), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trainingPlans/${id}`);
      throw error;
    }
  },
  restorePlan: async (id) => {
    try {
      await updateDoc(doc(db, 'trainingPlans', id), {
        isDeleted: false,
        deletedAt: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trainingPlans/${id}`);
      throw error;
    }
  },
  softDeleteTemplate: async (id) => {
    try {
      await updateDoc(doc(db, 'workoutTemplates', id), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workoutTemplates/${id}`);
      throw error;
    }
  },
  restoreTemplate: async (id) => {
    try {
      await updateDoc(doc(db, 'workoutTemplates', id), {
        isDeleted: false,
        deletedAt: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workoutTemplates/${id}`);
      throw error;
    }
  },
}));
