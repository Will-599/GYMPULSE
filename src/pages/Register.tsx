import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Dumbbell, UserPlus, Mail, Lock, Building2, User, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  gymName: z.string().min(3, 'O nome da academia deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [deletingZombie, setDeletingZombie] = useState(false);
  const { user, register: registerUser, initialized, profileMissing, deleteZombieAccount } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (initialized && user) {
      if (user.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    }
  }, [user, initialized, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.name, data.gymName);
      toast.success('Conta criada com sucesso! Bem-vindo ao GymPulse.');
      navigate('/app/dashboard');
    } catch (error: any) {
      console.error('Registration error full details:', error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('O cadastro por e-mail/senha não está habilitado no Firebase Console.');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Este e-mail já está em uso por outra conta.');
      } else if (error.code === 'permission-denied' || (error.message && error.message.includes('permission-denied'))) {
        toast.error('Erro de permissão no banco de dados. Entre em contato com o suporte.');
        console.error('FIRESTORE PERMISSION DENIED - Rules may not be deployed or token not synced.');
      } else {
        const msg = error.message ? error.message.substring(0, 120) : 'Erro desconhecido';
        toast.error(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZombieAccount = async () => {
    setDeletingZombie(true);
    try {
      await deleteZombieAccount();
      toast.success('Conta reiniciada! Você já pode tentar o cadastro novamente.');
    } catch (error: any) {
      toast.error('Erro ao reiniciar conta. Tente fazer login e usar o botão de recuperação no login.');
    } finally {
      setDeletingZombie(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-black">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-green transition-colors text-sm font-medium group"
          >
            <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center group-hover:bg-brand-green group-hover:text-brand-black transition-all">
              <ArrowLeft size={16} />
            </div>
            <span>Voltar</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-green text-brand-black mb-4">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-text">Criar Conta</h1>
          <p className="text-brand-muted mt-2">Comece a gerenciar sua academia hoje</p>
        </div>

        <div className="card">
          {profileMissing && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-300">Cadastro pendente detectado</p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    Vimos que você tentou se cadastrar recentemente mas o processo não foi concluído. 
                    Clique abaixo para limpar o estado anterior e tentar novamente.
                  </p>
                  <button
                    onClick={handleDeleteZombieAccount}
                    disabled={deletingZombie}
                    className="mt-3 flex items-center gap-2 text-xs font-bold bg-amber-500 text-brand-black px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-60"
                  >
                    {deletingZombie ? (
                      <div className="w-3.5 h-3.5 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw size={13} />
                    )}
                    Reiniciar Cadastro
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Seu Nome</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <User size={18} />
                </div>
                <input
                  {...register('name')}
                  type="text"
                  className={`input-field w-full pl-10 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Seu nome completo"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Nome da Academia</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Building2 size={18} />
                </div>
                <input
                  {...register('gymName')}
                  type="text"
                  className={`input-field w-full pl-10 ${errors.gymName ? 'border-red-500' : ''}`}
                  placeholder="Ex: Academia Fit"
                />
              </div>
              {errors.gymName && <p className="mt-1 text-xs text-red-500">{errors.gymName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Mail size={18} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className={`input-field w-full pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className={`input-field w-full pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus size={20} />
                  Criar Minha Academia
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-brand-muted">
              Já tem uma conta? <Link to="/login" className="text-brand-green hover:underline">Entrar</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

