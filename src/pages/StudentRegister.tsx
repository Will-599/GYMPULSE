import React, { useState } from 'react';
import { Mail, Lock, User, Hash, ArrowRight, Dumbbell, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  accessId: z.string().min(6, 'ID da academia inválido'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function StudentRegister() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();

  React.useEffect(() => {
    if (initialized && user) {
      if (user.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    }
  }, [user, initialized, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    let firebaseUser: any = null;
    let currentStep = 0;

    try {
      currentStep = 1; // Auth Creation
      const authResult = await createUserWithEmailAndPassword(auth, data.email, data.password);
      firebaseUser = authResult.user;

      // Small delay to ensure auth token is fully synced before next Firestore call
      await new Promise(resolve => setTimeout(resolve, 1000));

      currentStep = 2; // Student Record Lookup
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('accessId', '==', data.accessId.toUpperCase().trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await firebaseUser.delete();
        toast.error('ID da academia inválido ou não encontrado.');
        setLoading(false);
        return;
      }

      const studentDoc = querySnapshot.docs[0];
      const studentData = studentDoc.data();

      if (studentData.userId) {
        await firebaseUser.delete();
        toast.error('Este código de acesso já foi utilizado por outra conta.');
        setLoading(false);
        return;
      }

      // Verify if email matches (security measure)
      if (studentData.email.toLowerCase().trim() !== data.email.toLowerCase().trim()) {
        await firebaseUser.delete();
        toast.error('O e-mail informado não corresponde ao cadastro desta academia.');
        setLoading(false);
        return;
      }

      currentStep = 3; // User Profile Creation
      const userData = {
        id: firebaseUser.uid,
        tenantId: studentData.tenantId,
        name: data.name,
        email: data.email,
        role: 'STUDENT',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      currentStep = 4; // Student Record Linking
      await updateDoc(doc(db, 'students', studentDoc.id), {
        userId: firebaseUser.uid,
        updatedAt: new Date(),
      });

      toast.success('Cadastro realizado com sucesso!');
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Cleanup account if something failed during the half-created state
      if (firebaseUser && !loading) {
        try { await firebaseUser.delete(); } catch (e) {}
      }

      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este e-mail já está em uso por outra conta.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('A senha é muito fraca. Use pelo menos 6 caracteres.');
      } else {
        toast.error('Ocorreu um erro ao vincular sua conta. Verifique o ID da academia e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-brand-black overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8 xl:p-12 overflow-hidden border-r border-brand-border/30">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
            alt="Gym Training"
            className="w-full h-full object-cover grayscale opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-black/40 to-brand-black" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 max-w-lg"
        >
          <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center text-brand-black mb-8 shadow-lg shadow-brand-green/20">
            <Dumbbell size={40} />
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-black tracking-tighter text-brand-text mb-4 xl:mb-6 uppercase leading-none">
            Área do<span className="text-brand-green"> Aluno</span>
          </h1>
          
          <p className="text-lg xl:text-xl text-brand-muted font-light leading-relaxed mb-8">
            Acompanhe seus treinos, sua evolução e alcance seus objetivos com o suporte da sua academia.
          </p>

          <div className="space-y-4 text-brand-text/80 text-sm xl:text-base">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                <Hash size={14} />
              </div>
              <span>Utilize o código fornecido pela sua academia</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-brand-muted hover:text-brand-green transition-colors text-sm font-medium group"
          >
            <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center group-hover:bg-brand-green group-hover:text-brand-black transition-all">
              <ArrowLeft size={16} />
            </div>
            <span>Início</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 xl:mb-8">
            <h3 className="text-2xl xl:text-3xl font-bold text-brand-text mb-1 xl:mb-2">Crie sua conta</h3>
            <p className="text-brand-muted text-sm xl:text-base">Insira seus dados e o ID da sua academia</p>
          </div>

          <div className="card bg-brand-dark/50 backdrop-blur-md border-brand-border/40 p-6 xl:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 xl:space-y-5">
              <div>
                <label className="block text-xs xl:text-sm font-medium text-brand-muted mb-1 xl:mb-2">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                    <User size={18} />
                  </div>
                  <input
                    {...register('name')}
                    type="text"
                    className={`input-field w-full pl-10 py-2 xl:py-3 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Seu nome"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs xl:text-sm font-medium text-brand-muted mb-1 xl:mb-2">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                    <Mail size={18} />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input-field w-full pl-10 py-2 xl:py-3 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs xl:text-sm font-medium text-brand-muted mb-1 xl:mb-2">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                    <Lock size={18} />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    className={`input-field w-full pl-10 py-2 xl:py-3 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs xl:text-sm font-medium text-brand-muted mb-1 xl:mb-2">ID da Academia</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                    <Hash size={18} />
                  </div>
                  <input
                    {...register('accessId')}
                    type="text"
                    className={`input-field w-full pl-10 py-2 xl:py-3 uppercase ${errors.accessId ? 'border-red-500' : ''}`}
                    placeholder="CÓDIGO"
                  />
                </div>
                {errors.accessId && <p className="text-red-500 text-xs mt-1">{errors.accessId.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 xl:py-4 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Cadastrar <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Já tem uma conta?{' '}
            <Link to="/student/login" className="text-brand-green hover:underline font-medium">
              Fazer login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
