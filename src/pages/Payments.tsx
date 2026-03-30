import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  Edit2,
  Trash2,
  Calendar,
  User,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { usePaymentStore } from '../store/paymentStore';
import { useStudentStore } from '../store/studentStore';
import { Payment } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';
import PaymentDetailsModal from '../components/PaymentDetailsModal';

export default function Payments() {
  const { tenant } = useAuthStore();
  const { payments, fetchPayments, loading, softDeletePayment, updatePayment } = usePaymentStore();
  const { students, fetchStudents } = useStudentStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Partial<Payment> | undefined>(undefined);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (tenant) {
      const unsubscribePayments = fetchPayments(tenant.id);
      const unsubscribeStudents = fetchStudents(tenant.id);
      return () => {
        unsubscribePayments();
        unsubscribeStudents();
      };
    }
  }, [tenant, fetchPayments, fetchStudents]);

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPayment(undefined);
    setIsModalOpen(true);
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja mover este pagamento para a lixeira?')) {
      try {
        await softDeletePayment(id);
        toast.success('Pagamento movido para a lixeira');
      } catch (error) {
        toast.error('Erro ao excluir pagamento');
      }
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await updatePayment(id, { 
        status: 'PAID', 
        paidAt: new Date().toISOString(),
        paymentMethod: 'PIX' // Default for quick action
      });
      toast.success('Pagamento marcado como pago');
    } catch (error) {
      toast.error('Erro ao atualizar pagamento');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const student = students.find(s => s.id === payment.studentId);
    const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Aluno não encontrado';
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRevenue = payments
      .filter(p => {
        if (p.status !== 'PAID' || !p.paidAt) return false;
        const date = typeof p.paidAt.toDate === 'function' ? p.paidAt.toDate() : new Date(p.paidAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    const overdueAmount = payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyPayments = payments.filter(p => {
      const date = typeof p.dueDate === 'string' ? new Date(p.dueDate) : (p.dueDate as any).toDate?.() || new Date(p.dueDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const paidThisMonth = monthlyPayments.filter(p => p.status === 'PAID').length;
    const totalThisMonth = monthlyPayments.length;
    const complianceRate = totalThisMonth > 0 ? Math.round((paidThisMonth / totalThisMonth) * 100) : 100;

    return {
      monthlyRevenue,
      pendingAmount,
      overdueAmount,
      complianceRate
    };
  }, [payments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
            <CheckCircle2 size={12} /> Pago
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <Clock size={12} /> Pendente
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle size={12} /> Atrasado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-border text-brand-muted border border-brand-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Financeiro</h1>
          <p className="text-brand-muted">Gerencie mensalidades e pagamentos</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Relatório
          </button>
          <button 
            onClick={handleNew}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Lançamento
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase tracking-wider">Receita Mensal</p>
            <p className="text-xl font-bold text-brand-text">{formatCurrency(stats.monthlyRevenue)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase tracking-wider">Pendentes</p>
            <p className="text-xl font-bold text-brand-text">{formatCurrency(stats.pendingAmount)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase tracking-wider">Atrasados</p>
            <p className="text-xl font-bold text-brand-text">{formatCurrency(stats.overdueAmount)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase tracking-wider">Taxa de Adimplência</p>
            <p className="text-xl font-bold text-brand-text">{stats.complianceRate}%</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="input-field w-full pl-10"
            placeholder="Buscar por aluno ou referência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Todos Status</option>
            <option value="PAID">Pagos</option>
            <option value="PENDING">Pendentes</option>
            <option value="OVERDUE">Atrasados</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={18} />
            Filtros
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-brand-black/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Aluno</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Vencimento</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Valor</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted">Método</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-muted text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-brand-muted italic">
                    Carregando pagamentos...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-brand-muted italic">
                    Nenhum pagamento encontrado.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <motion.tr 
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-brand-black/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center text-brand-muted overflow-hidden">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-text">{getStudentName(payment.studentId)}</p>
                          <p className="text-xs text-brand-muted">{payment.reference || 'Mensalidade'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-brand-text">
                        <Calendar size={14} className="text-brand-muted" />
                        {formatDate(payment.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-brand-text">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-brand-muted uppercase font-medium">
                        {payment.paymentMethod || '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewDetails(payment)}
                          className="p-2 rounded-lg hover:bg-brand-border text-brand-muted hover:text-brand-green transition-all"
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        {payment.status !== 'PAID' && (
                          <button 
                            onClick={() => handleMarkAsPaid(payment.id)}
                            className="p-2 rounded-lg hover:bg-brand-green/10 text-brand-green transition-all"
                            title="Marcar como Pago"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(payment)}
                          className="p-2 rounded-lg hover:bg-brand-border text-brand-muted hover:text-brand-green transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(payment.id)}
                          className="p-2 rounded-lg hover:bg-brand-border text-brand-muted hover:text-red-500 transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payment={editingPayment}
      />

      <PaymentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        payment={selectedPayment}
        student={selectedPayment ? students.find(s => s.id === selectedPayment.studentId) || null : null}
      />
    </div>
  );
}
