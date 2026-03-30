import React, { useState } from 'react';
import { Hash, ArrowRight, Dumbbell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const linkSchema = z.object({
  accessId: z.string().min(6, 'ID da academia inválido'),
});

type LinkFormData = z.infer<typeof linkSchema>;

export default function LinkAcademy() {
  const [loading, setLoading] = useState(false);
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
  });

  const onSubmit = async (data: LinkFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('accessId', '==', data.accessId.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('ID da academia inválido ou não encontrado');
        setLoading(false);
        return;
      }

      const studentDoc = querySnapshot.docs[0];
      const studentData = studentDoc.data();

      if (studentData.userId) {
        toast.error('Este código de acesso já foi utilizado');
        setLoading(false);
        return;
      }

      // Link User to Tenant
      await updateDoc(doc(db, 'users', user.id), {
        tenantId: studentData.tenantId,
        updatedAt: new Date(),
      });

      // Link Student to User
      await updateDoc(doc(db, 'students', studentDoc.id), {
        userId: user.id,
        updatedAt: new Date(),
      });

      // Update local state
      setUser({ ...user, tenantId: studentData.tenantId });

      toast.success('Academia vinculada com sucesso!');
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error linking academy:', error);
      toast.error('Erro ao vincular academia');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/student/login');
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-green text-brand-black mb-4 shadow-lg shadow-brand-green/20">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-2xl font-bold text-brand-text">Vincular Academia</h1>
          <p className="text-brand-muted mt-2">Insira o código fornecido pela sua academia para acessar seus treinos.</p>
        </div>

        <div className="card p-6 xl:p-8 bg-brand-dark/50 backdrop-blur-md border-brand-border/40">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-2">ID da Academia</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Hash size={18} />
                </div>
                <input
                  {...register('accessId')}
                  type="text"
                  className={`input-field w-full pl-10 py-3 uppercase ${errors.accessId ? 'border-red-500' : ''}`}
                  placeholder="CÓDIGO"
                />
              </div>
              {errors.accessId && <p className="text-red-500 text-xs mt-1">{errors.accessId.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Vincular Agora <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-brand-muted hover:text-brand-text transition-colors py-2 text-sm"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
