import React, { useState } from 'react';
import { X, User, Mail, Phone, CreditCard, Calendar, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { generateAccessId } from '../lib/utils';
import { Student } from '../types';
import toast from 'react-hot-toast';

const studentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  birthDate: z.string(),
  gender: z.enum(['M', 'F', 'OTHER']),
  planId: z.string().min(1, 'Selecione um plano'),
  accessGranted: z.boolean(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: Student | null;
}

export default function AddStudentModal({ isOpen, onClose, onSuccess, student }: AddStudentModalProps) {
  const { tenant } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: student ? {
      name: student.name,
      email: student.email,
      phone: student.phone,
      cpf: student.cpf,
      birthDate: student.birthDate,
      gender: student.gender,
      planId: student.planId,
      accessGranted: student.accessGranted,
    } : {
      accessGranted: false,
      gender: 'M',
      planId: '',
    }
  });

  React.useEffect(() => {
    if (student) {
      reset({
        name: student.name,
        email: student.email,
        phone: student.phone,
        cpf: student.cpf,
        birthDate: student.birthDate,
        gender: student.gender,
        planId: student.planId,
        accessGranted: student.accessGranted,
      });
    } else {
      reset({
        accessGranted: false,
        gender: 'M',
        planId: '',
        name: '',
        email: '',
        phone: '',
        cpf: '',
        birthDate: '',
      });
    }
  }, [student, reset, isOpen]);

  const accessGranted = watch('accessGranted');

  if (!isOpen) return null;

  const onSubmit = async (data: StudentFormData) => {
    if (!tenant) return;
    setLoading(true);

    try {
      if (student) {
        // Update existing student
        const studentRef = doc(db, 'students', student.id);
        await updateDoc(studentRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        toast.success('Aluno atualizado com sucesso!');
      } else {
        // Create new student
        const accessId = generateAccessId();
        
        const studentData = {
          ...data,
          tenantId: tenant.id,
          accessId,
          userId: null, // Explicitly null for security rules matching
          qrCode: Math.random().toString(36).substring(7), // Mock QR code
          status: 'ACTIVE',
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'students'), studentData);
        
        toast.success(`Aluno cadastrado! Código: ${accessId}`, { 
          duration: 10000,
          icon: '🔑'
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(student ? 'Erro ao atualizar aluno' : 'Erro ao cadastrar aluno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark w-full max-w-2xl rounded-2xl border border-brand-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-brand-border bg-brand-black/20">
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <User className="text-brand-green" size={24} />
            {student ? 'Editar Aluno' : 'Novo Aluno'}
          </h2>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-text transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-muted mb-1">Nome Completo</label>
                <input {...register('name')} className="input-field w-full" placeholder="Ex: João Silva" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-muted mb-1">E-mail</label>
                <input {...register('email')} className="input-field w-full" placeholder="joao@email.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-muted mb-1">Telefone</label>
                <input {...register('phone')} className="input-field w-full" placeholder="(11) 99999-9999" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-muted mb-1">CPF</label>
                <input {...register('cpf')} className="input-field w-full" placeholder="000.000.000-00" />
                {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-muted mb-1">Data de Nascimento</label>
                <input type="date" {...register('birthDate')} className="input-field w-full" />
                {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-muted mb-1">Gênero</label>
                <select {...register('gender')} className="input-field w-full">
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border">
            <label className="block text-sm font-medium text-brand-muted mb-1">Plano</label>
            <select {...register('planId')} className="input-field w-full">
              <option value="">Selecione um plano</option>
              <option value="basic">Plano Básico</option>
              <option value="pro">Plano Pro</option>
              <option value="enterprise">Plano Enterprise</option>
            </select>
            {errors.planId && <p className="text-red-500 text-xs mt-1">{errors.planId.message}</p>}
          </div>

          {/* System Access */}
          <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-text">Acesso ao Sistema</h4>
                  <p className="text-xs text-brand-muted">Permite que o aluno acesse o dashboard</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('accessGranted')} className="sr-only peer" />
                <div className="w-11 h-6 bg-brand-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
              </label>
            </div>
            
            {accessGranted && !student && (
              <div className="text-xs text-brand-green font-medium bg-brand-green/10 p-3 rounded-lg">
                Um código de acesso único será gerado automaticamente após o cadastro.
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                student ? 'Salvar Alterações' : 'Cadastrar Aluno'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
