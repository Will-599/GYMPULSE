import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import StudentLayout from './components/StudentLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Checkin from './pages/Checkin';
import Workouts from './pages/Workouts';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import TrashBin from './pages/TrashBin';
import Tenants from './pages/Tenants';
import LinkAcademy from './pages/LinkAcademy';
import StudentDashboard from './pages/StudentDashboard';
import StudentWorkouts from './pages/StudentWorkouts';
import StudentEvolution from './pages/StudentEvolution';
import Evolution from './pages/Evolution';
import AccessPending from './pages/AccessPending';
import { Toaster } from 'react-hot-toast';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, tenant, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'STUDENT') {
    return <Navigate to="/student/dashboard" />;
  }

  // Check tenant activation (Master is always active)
  const isMaster = user.email === 'admin@admin.com';
  if (!isMaster && tenant?.isActive === false) {
    return <Navigate to="/pending" />;
  }

  return <>{children}</>;
};

const StudentPrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, student, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/student/login" />;
  }

  if (user.role === 'STUDENT' && !user.tenantId) {
    return <Navigate to="/student/link-academy" />;
  }

  // Check student access release
  if (user.role === 'STUDENT') {
    // If student data is still null but we are initialized and user exists, 
    // it means it's still being fetched from the snapshot. We should wait.
    if (!student) {
      return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (student.accessGranted === false) {
      return <Navigate to="/pending" />;
    }
  }

  if (user.role !== 'STUDENT') {
    return <Navigate to="/app/dashboard" />;
  }

  return <>{children}</>;
};

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-brand-black text-brand-text font-sans">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1A1A1A',
          color: '#FFFFFF',
          border: '1px solid #2A2A2A',
        },
      }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/pending" element={<AccessPending />} />
        <Route path="/student/link-academy" element={
          <StudentPrivateRoute>
            <LinkAcademy />
          </StudentPrivateRoute>
        } />

        <Route path="/app" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="check-in" element={<Checkin />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="payments" element={<Payments />} />
          <Route path="evolution" element={<Evolution />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="trash" element={<TrashBin />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/student" element={
          <StudentPrivateRoute>
            <StudentLayout />
          </StudentPrivateRoute>
        }>
          <Route index element={<Navigate to="/student/dashboard" />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="workouts" element={<StudentWorkouts />} />
          <Route path="evolution" element={<StudentEvolution />} />
        </Route>
      </Routes>
    </div>
  );
}
