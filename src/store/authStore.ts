import { create } from 'zustand';
import { User, Tenant, Student } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, collection, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  student: Student | null;
  loading: boolean;
  initialized: boolean;
  profileMissing: boolean;
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, gymName: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
  deleteZombieAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  student: null,
  loading: true,
  initialized: false,
  profileMissing: false,
  setUser: (user) => set({ user }),
  setTenant: (tenant) => set({ tenant }),
  deleteZombieAccount: async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.delete();
      }
      set({ user: null, tenant: null, student: null, profileMissing: false });
    } catch (error) {
      console.error('Error deleting zombie account:', error);
      throw error;
    }
  },
  login: async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  register: async (email, password, name, gymName) => {
    let firebaseUser = null;
    try {
      // Step 1: Create Auth User
      const result = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = result.user;
      
      // Step 2: Critical Delay
      // Small delay to ensure auth token is fully synced before next Firestore call
      // This prevents "permission-denied" errors during immediate subsequent writes
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Create tenant
      const tenantRef = doc(collection(db, 'tenants'));
      const tenantData: Tenant = {
        id: tenantRef.id,
        name: gymName,
        slug: gymName.toLowerCase().replace(/\s+/g, '-'),
        email,
        phone: '',
        address: '',
        planType: 'PRO',
        isActive: false, // Start as inactive, admin must approve
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {}
      };
      
      try {
        await setDoc(tenantRef, tenantData);
      } catch (error) {
        console.error('FIRESTORE ERROR: Failed to create tenant doc:', error);
        throw error;
      }

      // Step 4: Create user profile
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userData: User = {
        id: firebaseUser.uid,
        tenantId: tenantRef.id,
        name,
        email,
        role: 'OWNER',
        isActive: true, // Internal user active status
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      try {
        await setDoc(userRef, userData);
      } catch (error) {
        console.error('FIRESTORE ERROR: Failed to create user doc:', error);
        throw error;
      }
      
      set({ user: userData, tenant: tenantData });
    } catch (error: any) {
      console.error('Registration error details:', error);
      
      // Cleanup: Delete auth user if Firestore records failed to create
      // This prevents "zombie accounts" (Auth exists but no profile)
      if (firebaseUser && error.code !== 'auth/email-already-in-use') {
        try {
          await firebaseUser.delete();
        } catch (deleteError) {
          console.error('Failed to cleanup auth user:', deleteError);
        }
      }
      
      throw error;
    }
  },
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, tenant: null, student: null, profileMissing: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  initialize: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userPath = `users/${firebaseUser.uid}`;
          let userDoc;
          try {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, userPath);
          }

          if (userDoc && userDoc.exists()) {
            const userData = { ...userDoc.data(), id: userDoc.id } as User;
            set({ user: userData });
            
            // Listen to tenant changes if tenantId exists
            if (userData.tenantId) {
              const tenantPath = `tenants/${userData.tenantId}`;
              onSnapshot(doc(db, 'tenants', userData.tenantId), (tenantDoc) => {
                if (tenantDoc.exists()) {
                  const currentTenant = useAuthStore.getState().tenant;
                  const newData = { ...tenantDoc.data(), id: tenantDoc.id } as Tenant;
                  
                  // Only update if data actually changed to prevent redundant re-renders
                  if (JSON.stringify(currentTenant) !== JSON.stringify(newData)) {
                    set({ tenant: newData });
                  }
                }
              }, (error) => {
                console.error('Error fetching tenant:', error);
                handleFirestoreError(error, OperationType.GET, tenantPath);
              });
            }

            // If student, listen to student data for access control
            if (userData.role === 'STUDENT') {
              const studentsRef = collection(db, 'students');
              const q = query(studentsRef, where('userId', '==', userData.id));
              onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                  const studentData = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Student;
                  set({ student: studentData });
                }
              }, (error) => {
                console.error('Error fetching student registration:', error);
              });
            }
          } else if (firebaseUser.email === 'admin@admin.com') {
            // Auto-setup for Super Admin if profile is missing
            const masterTenantId = 'master-tenant';
            const tenantRef = doc(db, 'tenants', masterTenantId);
            const tenantDoc = await getDoc(tenantRef);
            
            let tenantData: Tenant;
            
            if (!tenantDoc.exists()) {
              tenantData = {
                id: masterTenantId,
                name: 'GymPulse Master',
                slug: 'master',
                email: 'admin@admin.com',
                phone: '',
                address: '',
                planType: 'ENTERPRISE',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: {}
              };
              
              try {
                await setDoc(tenantRef, tenantData);
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `tenants/${masterTenantId}`);
              }
            } else {
              tenantData = { ...tenantDoc.data(), id: tenantDoc.id } as Tenant;
            }

            const userData: User = {
              id: firebaseUser.uid,
              tenantId: masterTenantId,
              name: 'Super Admin',
              email: 'admin@admin.com',
              role: 'OWNER',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            if (!userDoc?.exists()) {
              try {
                await setDoc(doc(db, 'users', firebaseUser.uid), userData);
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
              }
            }
            
            set({ user: userData, tenant: tenantData });
          } else {
            // Profile missing for non-admin email — mark as zombie account
            set({ user: null, tenant: null, student: null, profileMissing: true });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, tenant: null, student: null });
        }
      } else {
        set({ user: null, tenant: null, student: null });
      }
      set({ loading: false, initialized: true });
    });
  },
}));
