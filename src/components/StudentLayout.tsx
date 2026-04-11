import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Dumbbell, 
  TrendingUp, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  LayoutDashboard,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/student/dashboard', label: 'Início', icon: LayoutDashboard },
  { path: '/student/workouts', label: 'Meus Treinos', icon: Dumbbell },
  { path: '/student/evolution', label: 'Evolução', icon: TrendingUp },
];

export default function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const { user, tenant, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/student/login');
    } catch (error) {
      console.error('Logout error:', error);
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
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                isActive 
                  ? "bg-brand-green text-brand-black font-semibold shadow-lg shadow-brand-green/20" 
                  : "text-brand-muted hover:bg-brand-border hover:text-brand-text"
              )}
            >
              <item.icon size={22} />
              <span className={cn(
                "truncate",
                !isSidebarOpen && "lg:hidden"
              )}>{item.label}</span>
            </NavLink>
          ))}

          {/* Quick Check-in Button */}
          <button
            onClick={() => {
              setIsQrModalOpen(true);
              setIsSidebarOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-brand-green hover:bg-brand-green/10 transition-all group",
              !isSidebarOpen && "lg:justify-center"
            )}
          >
            <QrCode size={22} />
            <span className={cn(
              "truncate font-semibold text-sm",
              !isSidebarOpen && "lg:hidden"
            )}>Check-in QR</span>
          </button>
        </nav>

        <div className="p-4 border-t border-brand-border">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-brand-muted hover:bg-red-500/10 hover:text-red-500 transition-all group",
              !isSidebarOpen && "lg:justify-center"
            )}
          >
            <LogOut size={22} />
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
            <div className="lg:hidden w-8 h-8 rounded-lg bg-brand-green text-brand-black flex items-center justify-center">
              <Dumbbell size={18} />
            </div>
            <h2 className="text-lg font-bold text-brand-text lg:hidden">GymPulse</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-brand-text">{user?.name || 'Aluno'}</p>
              <p className="text-[10px] text-brand-muted uppercase tracking-wider">{tenant?.name || 'Minha Academia'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-border border border-brand-border flex items-center justify-center text-brand-muted overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || ''} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} />
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-brand-black print:bg-white print:overflow-visible print:p-0">
          <Outlet />
        </div>
      </main>

      {/* QR Code Modal */}
      <AnimatePresence>
        {isQrModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-brand-dark w-full max-w-sm rounded-3xl border border-brand-border p-8 shadow-2xl text-center relative overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 blur-3xl -mr-16 -mt-16 rounded-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-green/5 blur-3xl -ml-16 -mb-16 rounded-full" />

              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-text transition-colors"
              >
                <X size={20} />
              </button>

              <div className="relative z-10">
                <div className="inline-flex p-3 rounded-2xl bg-brand-green/10 text-brand-green mb-6">
                  <QrCode size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-brand-text mb-2">Check-in QR</h3>
                <p className="text-brand-muted text-sm mb-8">Apresente este código na recepção para liberar sua entrada.</p>

                <div className="bg-white p-6 rounded-2xl inline-block shadow-lg shadow-black/50 mb-8">
                  <QRCodeSVG 
                    value={user?.id || ''} 
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-brand-black/40 rounded-xl border border-brand-border">
                    <p className="text-xs text-brand-muted uppercase tracking-widest mb-1 font-bold">Identificador Único</p>
                    <p className="text-brand-text font-mono text-sm uppercase break-all">{user?.id}</p>
                  </div>

                  <button
                    onClick={() => setIsQrModalOpen(false)}
                    className="btn-primary w-full py-4 text-base"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
