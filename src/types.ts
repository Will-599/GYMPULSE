export type UserRole = 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  planType: 'BASIC' | 'PRO' | 'ENTERPRISE';
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  settings: any;
}

export interface User {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Student {
  id: string;
  tenantId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  gender: 'M' | 'F' | 'OTHER';
  address: any;
  photoUrl?: string;
  planId: string;
  planStartDate: string;
  planEndDate?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes?: string;
  qrCode: string;
  accessId?: string;
  accessGranted: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DEFAULTING';
  createdAt: any;
  updatedAt: any;
  isDeleted?: boolean;
  deletedAt?: any;
}

export interface Plan {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  durationDays: number;
  maxCheckinPerDay: number;
  features: string[];
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: any;
}

export interface Checkin {
  id: string;
  tenantId: string;
  studentId: string;
  checkinAt: any;
  method: 'QR_CODE' | 'MANUAL' | 'APP';
  operatorId?: string;
  notes?: string;
}

export interface EvolutionRecord {
  id: string;
  tenantId: string;
  studentId: string;
  recordedAt: any;
  weight?: number;
  height?: number;
  bodyFatPercent?: number;
  muscleMassPercent?: number;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    leftArm?: number;
    rightArm?: number;
    leftThigh?: number;
    rightThigh?: number;
    leftCalf?: number;
    rightCalf?: number;
  };
  photos: { url: string; label: string; takenAt: any }[];
  observations?: string;
  recordedBy: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime?: string;
  notes?: string;
}

export interface TrainingDay {
  day: string; // 'Segunda', 'Terça', etc.
  exercises: Exercise[];
}

export interface TrainingPlan {
  id: string;
  tenantId: string;
  studentId: string;
  name: string;
  description: string;
  days: TrainingDay[];
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  assignedBy: string;
  createdAt: any;
  updatedAt: any;
  isDeleted?: boolean;
  deletedAt?: any;
}

export interface WorkoutTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: 'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'FUNCTIONAL' | 'MIXED';
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDurationMin: number;
  days: TrainingDay[];
  createdBy: string;
  isPublic: boolean;
  createdAt: any;
  isDeleted?: boolean;
  deletedAt?: any;
}

export interface WorkoutExercise {
  name: string;
  series: number;
  reps: string;
  rest: string;
  notes?: string;
  order: number;
}

export interface StudentWorkout {
  id: string;
  tenantId: string;
  studentId: string;
  templateId?: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  exercises: WorkoutExercise[];
  assignedBy: string;
  notes?: string;
  createdAt: any;
}

export interface Payment {
  id: string;
  tenantId: string;
  studentId: string;
  planId: string;
  amount: number;
  dueDate: string;
  paidAt?: any;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_SLIP';
  reference?: string;
  notes?: string;
  createdAt: any;
  isDeleted?: boolean;
  deletedAt?: any;
}
