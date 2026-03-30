import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Student } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface StudentState {
  students: Student[];
  trashedStudents: Student[];
  loading: boolean;
  initialized: boolean;
  fetchStudents: (tenantId: string) => () => void;
  fetchAllStudents: () => () => void;
  fetchTrashedStudents: (tenantId: string) => () => void;
  softDeleteStudent: (id: string) => Promise<void>;
  restoreStudent: (id: string) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  trashedStudents: [],
  loading: false,
  initialized: false,

  fetchStudents: (tenantId: string) => {
    // Silent loading if we already have data
    if (get().students.length === 0) {
      set({ loading: true });
    }

    const q = query(
      collection(db, 'students'),
      where('tenantId', '==', tenantId),
      where('isDeleted', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Student[];

      // In-memory sort to bypass Firestore index latency/missing index issues
      studentsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      set({ students: studentsData, loading: false, initialized: true });
    }, (error) => {
      console.error('Error fetching students:', error);
      handleFirestoreError(error, OperationType.GET, `tenants/${tenantId}/students`);
      set({ loading: false });
    });

    return unsubscribe;
  },

  fetchAllStudents: () => {
    if (get().students.length === 0) {
      set({ loading: true });
    }

    const q = query(
      collection(db, 'students'),
      where('isDeleted', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Student[];

      // In-memory sort
      studentsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      set({ students: studentsData, loading: false, initialized: true });
    }, (error) => {
      console.error('Error fetching all students:', error);
      handleFirestoreError(error, OperationType.GET, 'all-students');
      set({ loading: false });
    });

    return unsubscribe;
  },

  fetchTrashedStudents: (tenantId: string) => {
    set({ loading: true });
    const q = query(
      collection(db, 'students'),
      where('tenantId', '==', tenantId),
      where('isDeleted', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trashedData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Student[];
      
      trashedData.sort((a, b) => {
        const timeA = a.deletedAt?.toMillis?.() || 0;
        const timeB = b.deletedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      set({ trashedStudents: trashedData, loading: false });
    }, (error) => {
      console.error('Error fetching trashed students:', error);
      handleFirestoreError(error, OperationType.GET, `tenants/${tenantId}/trashed-students`);
      set({ loading: false });
    });

    return unsubscribe;
  },

  softDeleteStudent: async (id) => {
    try {
      await updateDoc(doc(db, 'students', id), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${id}`);
      throw error;
    }
  },

  restoreStudent: async (id) => {
    try {
      await updateDoc(doc(db, 'students', id), {
        isDeleted: false,
        deletedAt: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${id}`);
      throw error;
    }
  },

  deleteStudent: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${id}`);
      throw error;
    }
  },

  updateStudent: async (id, data) => {
    try {
      await updateDoc(doc(db, 'students', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${id}`);
      throw error;
    }
  },
}));
