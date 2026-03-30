import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, DollarSign, Calendar, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { usePaymentStore } from '../store/paymentStore';
import { useStudentStore } from '../store/studentStore';
import { Payment } from '../types';
import toast from 'react-hot-toast';

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Selecione um aluno'),
  amount: z.number().min(0.01, 'O valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'A data de vencimento é obrigatória'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']),
  paymentMethod: z.enum(['CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_SLIP']).optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: Partial<Payment>;
}

export default function PaymentModal({ isOpen, onClose, payment }: PaymentModalProps) {
  const { tenant } = useAuthStore();
  const { addPayment, updatePayment } = usePaymentStore();
  const { students } = useStudentStore();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      status: 'PENDING',
      amount: 0,
      studentId: '',
      reference: 'Mensalidade',
    }
  });

  useEffect(() => {
    if (payment && isOpen) {
      reset({
        studentId: payment.studentId || '',
        amount: payment.amount || 0,
        dueDate: payment.dueDate || new Date().toISOString().split('T')[0],
        reference: payment.reference || 'Mensalidade',
        notes: payment.notes || '',
        status: payment.status || 'PENDING',
        paymentMethod: payment.paymentMethod,
      });
    } else if (isOpen) {
      reset({
        studentId: '',
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        reference: 'Mensalidade',
        notes: '',
        status: 'PENDING',
      });
    }
  }, [payment, reset, isOpen]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!tenant) return;

    try {
      if (payment?.id) {
        await updatePayment(payment.id, data);
        toast.success('Pagamento atualizado com sucesso!');
      } else {
        await addPayment({
          ...data,
          tenantId: tenant.id,
          planId: '', // Optional for now
        });
        toast.success('Pagamento registrado com sucesso!');
      }
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar pagamento.');
    }
  };

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
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-text">
                    {payment?.id ? 'Editar Pagamento' : 'Novo Lançamento'}
                  </h2>
                  <p className="text-xs text-brand-muted uppercase tracking-wider">Financeiro</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-brand-border rounded-xl transition-colors text-brand-muted">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-2">
                  <User size={14} /> Aluno
                </label>
                <select {...register('studentId')} className="input-field w-full">
                  <option value="">Selecione um aluno</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
                {errors.studentId && <p className="text-xs text-red-500">{errors.studentId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-2">
                    <DollarSign size={14} /> Valor
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })} 
                    className="input-field w-full"
                    placeholder="0,00"
                  />
                  {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} /> Vencimento
                  </label>
                  <input 
                    type="date" 
                    {...register('dueDate')} 
                    className="input-field w-full"
                  />
                  {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Status</label>
                  <select {...register('status')} className="input-field w-full">
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="OVERDUE">Atrasado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Método</label>
                  <select {...register('paymentMethod')} className="input-field w-full">
                    <option value="">Selecione</option>
                    <option value="PIX">PIX</option>
                    <option value="CASH">Dinheiro</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                    <option value="DEBIT_CARD">Cartão de Débito</option>
                    <option value="BANK_SLIP">Boleto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} /> Referência
                </label>
                <input 
                  type="text" 
                  {...register('reference')} 
                  className="input-field w-full"
                  placeholder="Ex: Mensalidade Março"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Observações</label>
                <textarea 
                  {...register('notes')} 
                  className="input-field w-full h-20 resize-none"
                  placeholder="Alguma observação importante..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : payment?.id ? 'Atualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
