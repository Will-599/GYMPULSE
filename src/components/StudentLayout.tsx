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
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/student/dashboard', label: 'Início', icon: LayoutDashboard },
  { path: '/student/workouts', label: 'Meus Treinos', icon: Dumbbell },
  { path: '/student/evolution', label: 'Evolução', icon: TrendingUp },
];

export default function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
          "fixed inset-y-0 left-0 bg-brand-dark border-r border-brand-border transition-all duration-300 flex flex-col z-50 lg:static lg:translate-x-0",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:w-20"
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
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-brand-dark border-b border-brand-border flex items-center justify-between px-4 sm:px-6 z-20">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-brand-black">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
