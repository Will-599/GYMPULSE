import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Dumbbell, LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login, initialized } = useAuthStore();
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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Bem-vindo ao GymPulse!');
      navigate('/app/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('O login por e-mail/senha não está habilitado no Firebase Console.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('E-mail ou senha incorretos.');
      } else {
        toast.error('Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-brand-black overflow-hidden">
      {/* Left Side: Persuasive Message & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8 xl:p-12 overflow-hidden border-r border-brand-border/30">
        {/* Background Image with low opacity */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Bodybuilder Training"
            className="w-full h-full object-cover grayscale opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-black/40 to-brand-black" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-green text-brand-black mb-8 shadow-2xl shadow-brand-green/20">
            <Dumbbell size={40} />
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-black tracking-tighter text-brand-text mb-4 xl:mb-6 uppercase leading-none">
            Gym<span className="text-brand-green">Pulse</span>
          </h1>
          
          <div className="space-y-4 xl:space-y-6">
            <h2 className="text-2xl xl:text-3xl font-bold text-brand-text leading-tight">
              A revolução na gestão da sua academia começa aqui.
            </h2>
            
            <p className="text-lg xl:text-xl text-brand-muted font-light leading-relaxed">
              Pare de perder tempo com planilhas e processos manuais. O GymPulse oferece controle total sobre alunos, pagamentos e treinos em uma única plataforma intuitiva.
            </p>
            
            <ul className="space-y-3 xl:space-y-4 text-brand-text/80 text-sm xl:text-base">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <LogIn size={14} />
                </div>
                <span>Aumento de até 40% na retenção de alunos</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <LogIn size={14} />
                </div>
                <span>Gestão financeira automatizada e segura</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <LogIn size={14} />
                </div>
                <span>Aplicativo exclusivo para seus alunos</span>
              </li>
            </ul>

            <div className="pt-4 xl:pt-8">
              <Link 
                to="/register" 
                className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-brand-black font-bold py-3 xl:py-4 px-6 xl:px-8 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand-green/20"
              >
                Começar agora gratuitamente
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Mobile background (subtle) */}
        <div className="lg:hidden absolute inset-0 z-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Bodybuilder Training"
            className="w-full h-full object-cover grayscale opacity-10"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-brand-black/60" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10"
        >
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
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

          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-green text-brand-black mb-4 shadow-lg shadow-brand-green/20">
              <Dumbbell size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-text">GymPulse SaaS</h1>
          </div>

          <div className="mb-6 xl:mb-8 hidden lg:block">
            <h3 className="text-2xl xl:text-3xl font-bold text-brand-text mb-1 xl:mb-2">Bem-vindo de volta</h3>
            <p className="text-brand-muted text-sm xl:text-base">Acesse sua conta para gerenciar sua academia</p>
          </div>

          <div className="card bg-brand-dark/50 backdrop-blur-md border-brand-border/40 p-6 xl:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 xl:space-y-6">
              <div>
                <label className="block text-xs xl:text-sm font-medium text-brand-muted mb-1 xl:mb-2">E-mail</label>
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
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs xl:text-sm font-medium text-brand-muted mb-1 xl:mb-2">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                    <Lock size={18} />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field w-full pl-10 pr-10 py-2 xl:py-3 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-brand-text"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 xl:py-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={20} />
                    Entrar no Sistema
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-brand-muted">
                  Não tem uma conta? <Link to="/register" className="text-brand-green hover:underline">Criar Academia</Link>
                </p>
                <p className="text-sm text-brand-muted">
                  É um aluno? <Link to="/student/login" className="text-brand-green hover:underline font-bold">Acesse a Área do Aluno</Link>
                </p>
              </div>
              <p className="text-sm text-brand-muted">
                Esqueceu sua senha? <a href="#" className="text-brand-green hover:underline">Recuperar</a>
              </p>
            </div>
          </div>
          
          <p className="mt-6 xl:mt-8 text-center text-xs text-brand-muted">
            &copy; 2026 GymPulse SaaS. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
