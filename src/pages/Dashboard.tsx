import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useTenantStore } from '../store/tenantStore';
import AddStudentModal from '../components/AddStudentModal';
import { 
  Users, 
  CalendarCheck, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  UserPlus,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';



const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card group hover:border-brand-green/30 transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl bg-brand-black border border-brand-border group-hover:border-brand-green/50 transition-colors text-${color}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}%
        </div>
      )}
    </div>
    <h3 className="text-brand-muted text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-2xl font-bold text-brand-text">{value}</p>
  </motion.div>
);

export default function Dashboard() {
  const { tenant } = useAuthStore();
  const { stats, loading } = useDashboardStats(tenant?.id);
  const { tenants, fetchTenants } = useTenantStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const isMaster = tenant?.id === 'master-tenant';

  React.useEffect(() => {
    if (isMaster) {
      const unsub = fetchTenants();
      return () => unsub();
    }
  }, [isMaster, fetchTenants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Dashboard</h1>
        <p className="text-brand-muted">Bem-vindo à {tenant?.name || 'sua academia'}</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Alunos" 
          value={stats.totalStudents.toString()} 
          icon={Users} 
          trend="up" 
          trendValue="0" 
          color="brand-green"
        />
        <StatCard 
          title="Check-ins Hoje" 
          value={stats.checkinsToday.toString()} 
          icon={CalendarCheck} 
          trend="up" 
          trendValue="0" 
          color="brand-green"
        />
        <StatCard 
          title="Faturamento Mês" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue)} 
          icon={DollarSign} 
          trend="up" 
          trendValue="0" 
          color="brand-green"
        />
        <StatCard 
          title="Taxa de Retenção" 
          value={`${stats.retentionRate}%`} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="0" 
          color="brand-green"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-brand-text flex items-center gap-2">
              <Activity size={18} className="text-brand-green" />
              Frequência Semanal
            </h3>
            <select className="bg-brand-black border border-brand-border text-xs text-brand-muted rounded px-2 py-1 outline-none">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#A1A1AA" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#A1A1AA" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  itemStyle={{ color: '#CCFF00' }}
                />
                <Bar dataKey="checkins" fill="#CCFF00" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-brand-text flex items-center gap-2">
              <DollarSign size={18} className="text-brand-green" />
              Receita Diária
            </h3>
            <select className="bg-brand-black border border-brand-border text-xs text-brand-muted rounded px-2 py-1 outline-none">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#A1A1AA" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#A1A1AA" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  itemStyle={{ color: '#CCFF00' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#CCFF00" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-bold text-brand-text mb-6 flex items-center gap-2">
            <Clock size={18} className="text-brand-green" />
            Últimos Check-ins
          </h3>
          <div className="space-y-4">
            {stats.recentCheckins.length > 0 ? (
              stats.recentCheckins.map((checkin, i) => (
                <div key={checkin.id || i} className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-black transition-colors border border-transparent hover:border-brand-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center text-brand-muted">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-text">{checkin.studentName}</p>
                      <p className="text-xs text-brand-muted">Check-in às {checkin.checkinAt?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${checkin.status === 'ACTIVE' ? 'bg-brand-green/10 text-brand-green' : 'bg-red-500/10 text-red-500'}`}>
                      {checkin.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-muted text-center py-4">Nenhum check-in recente.</p>
            )}
          </div>
          <button className="w-full mt-6 text-sm text-brand-muted hover:text-brand-green transition-colors font-medium">
            Ver todos os check-ins
          </button>
        </div>

        <div className="card">
          <h3 className="font-bold text-brand-text mb-6 flex items-center gap-2">
            <UserPlus size={18} className="text-brand-green" />
            Novos Alunos
          </h3>
          <div className="space-y-4">
            {stats.newStudents.length > 0 ? (
              stats.newStudents.map((student, i) => (
                <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg border border-brand-border bg-brand-black/50">
                  <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{student.name}</p>
                    {isMaster ? (
                      <p className="text-[10px] text-brand-green font-medium uppercase tracking-tight">
                        {tenants.find(t => t.id === student.tenantId)?.name || 'Academia'}
                      </p>
                    ) : (
                      <p className="text-xs text-brand-muted">Hoje</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-muted text-center py-4">Nenhum aluno recente.</p>
            )}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-secondary w-full mt-6 text-sm"
          >
            Cadastrar Novo Aluno
          </button>
        </div>
      </div>

      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {}} 
      />
    </div>
  );
}
