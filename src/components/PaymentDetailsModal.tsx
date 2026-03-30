import React from 'react';
import { X, DollarSign, Calendar, User, FileText, CheckCircle2, Clock, AlertCircle, CreditCard, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Payment, Student } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  student: Student | null;
}

const statusConfig = {
  PAID: { label: 'Pago', color: 'text-brand-green', bg: 'bg-brand-green/10', icon: CheckCircle2 },
  PENDING: { label: 'Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock },
  OVERDUE: { label: 'Atrasado', color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle },
  CANCELLED: { label: 'Cancelado', color: 'text-brand-muted', bg: 'bg-brand-muted/10', icon: X },
  REFUNDED: { label: 'Reembolsado', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Hash },
};

const methodLabels = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  BANK_SLIP: 'Boleto',
};

export default function PaymentDetailsModal({ isOpen, onClose, payment, student }: PaymentDetailsModalProps) {
  if (!payment) return null;

  const status = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-brand-black border border-brand-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-black/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center ${status.color}`}>
                  <StatusIcon size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-text">Detalhes do Pagamento</h2>
                  <p className="text-xs text-brand-muted uppercase tracking-wider">Comprovante Digital</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-brand-border rounded-xl transition-colors text-brand-muted">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col items-center justify-center py-4 bg-brand-dark/50 rounded-2xl border border-brand-border/50">
                <span className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">Valor Total</span>
                <span className="text-4xl font-black text-brand-green">{formatCurrency(payment.amount)}</span>
                <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.color} border border-current/20`}>
                  {status.label}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                    <User size={12} className="text-brand-green" /> Aluno
                  </label>
                  <p className="text-sm font-medium text-brand-text">{student?.name || 'Não identificado'}</p>
                  <p className="text-[10px] text-brand-muted">{student?.email}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={12} className="text-brand-green" /> Vencimento
                  </label>
                  <p className="text-sm font-medium text-brand-text">{formatDate(payment.dueDate)}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                    <FileText size={12} className="text-brand-green" /> Referência
                  </label>
                  <p className="text-sm font-medium text-brand-text">{payment.reference || 'Mensalidade'}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard size={12} className="text-brand-green" /> Método
                  </label>
                  <p className="text-sm font-medium text-brand-text">
                    {payment.paymentMethod ? methodLabels[payment.paymentMethod as keyof typeof methodLabels] : 'Não informado'}
                  </p>
                </div>
              </div>

              {payment.notes && (
                <div className="p-4 bg-brand-dark/30 rounded-xl border border-brand-border/50 space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Observações</label>
                  <p className="text-xs text-brand-text leading-relaxed italic">"{payment.notes}"</p>
                </div>
              )}

              <div className="pt-4 border-t border-brand-border flex gap-3">
                <button
                  onClick={onClose}
                  className="btn-primary w-full"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
