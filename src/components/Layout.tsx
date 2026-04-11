import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useStudentStore } from '../store/studentStore';
import { useCheckinStore } from '../store/checkinStore';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Dumbbell, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ChevronRight,
  Trash2,
  Building2,
  QrCode,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import QrScanner from './QrScanner';

const navItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/app/tenants', label: 'Academias', icon: Building2 },
  { path: '/app/students', label: 'Alunos', icon: Users },
  { path: '/app/check-in', label: 'Check-in', icon: CalendarCheck },
  { path: '/app/workouts', label: 'Treinos', icon: Dumbbell },
  { path: '/app/evolution', label: 'Acompanhamento', icon: TrendingUp },
  { path: '/app/payments', label: 'Financeiro', icon: CreditCard },
  { path: '/app/trash', label: 'Lixeira', icon: Trash2 },
  { path: '/app/settings', label: 'Configurações', icon: Settings },
];

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { user, tenant, logout } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();
  const { validateAndCheckin } = useCheckinStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (tenant) {
      const unsub = fetchStudents(tenant.id);
      return () => unsub();
    }
  }, [tenant, fetchStudents]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleQrSuccess = async (decodedText: string) => {
    if (!tenant) return;
    const success = await validateAndCheckin(tenant.id, decodedText, students, 'QR_CODE');
    if (success) {
      setIsScannerOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-brand-black overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-brand-dark border-r border-brand-border transition-all duration-300 flex flex-col z-50 lg:static lg:translate-x-0 no-print",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0 lg:w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-green text-brand-black flex items-center justify-center flex-shrink-0">
            <Dumbbell size={20} />
          </div>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <span className={cn(
              "font-bold text-xl tracking-tight text-brand-text truncate",
              !isSidebarOpen && "lg:hidden"
            )}>GymPulse</span>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            // Only show Academias for master tenant
            if (item.path === '/app/tenants' && tenant?.slug !== 'master') {
              return null;
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                  isActive 
                    ? "bg-brand-green text-brand-black font-semibold shadow-lg shadow-brand-green/20" 
                    : "text-brand-muted hover:bg-brand-border hover:text-brand-text"
                )}
              >
                <item.icon size={22} className="flex-shrink-0" />
                <span className={cn(
                  "truncate",
                  !isSidebarOpen && "lg:hidden"
                )}>{item.label}</span>
                {!isSidebarOpen && (
                  <div className="absolute left-16 bg-brand-dark border border-brand-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-border">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-brand-muted hover:bg-red-500/10 hover:text-red-500 transition-all group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={22} className="flex-shrink-0" />
            <span className={cn(
              "truncate",
              !isSidebarOpen && "lg:hidden"
            )}>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative print:bg-white print:overflow-visible">
        {/* Header */}
        <header className="h-16 bg-brand-dark border-b border-brand-border flex items-center justify-between px-4 sm:px-6 z-20 no-print">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-brand-border text-brand-muted transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-brand-border text-brand-muted transition-colors hidden lg:block"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="lg:hidden w-8 h-8 rounded-lg bg-brand-green text-brand-black flex items-center justify-center">
              <Dumbbell size={18} />
            </div>
            <h2 className="text-lg font-bold text-brand-text lg:hidden">GymPulse</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Check-in Button */}
            {tenant?.id !== 'master-tenant' && (
              <button
                onClick={() => setIsScannerOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-brand-green/10 text-brand-green px-4 py-2 rounded-xl border border-brand-green/20 hover:bg-brand-green/20 transition-all font-bold text-sm"
              >
                <QrCode size={18} />
                Scan Check-in
              </button>
            )}

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-brand-text">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-brand-muted uppercase tracking-wider">{tenant?.name || 'Academia'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-border border border-brand-border flex items-center justify-center text-brand-muted overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || ''} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={20} />
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-brand-black print:bg-white print:overflow-visible print:p-0">
          <Outlet />
        </div>
      </main>

      {/* QR Scanner Modal (Academy Side) */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-brand-dark w-full max-w-lg rounded-3xl border border-brand-border p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
                    <QrCode className="text-brand-green" size={24} />
                    Check-in Rápido
                  </h3>
                  <p className="text-xs text-brand-muted">Aponte a câmera para o QR Code do aluno</p>
                </div>
                <button 
                  onClick={() => setIsScannerOpen(false)}
                  className="p-2 text-brand-muted hover:text-brand-text transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <QrScanner 
                onScanSuccess={handleQrSuccess}
                onScanError={(err) => console.log('Scanner error:', err)}
              />

              <div className="mt-6 p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl text-center">
                <p className="text-xs text-brand-green font-medium">
                  Acesso será validado automaticamente com base no status e financeiro.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
