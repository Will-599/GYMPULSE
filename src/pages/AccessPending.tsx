import React from 'react';
import { ShieldAlert, LogOut, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'motion/react';

export default function AccessPending() {
  const { logout, user, tenant } = useAuthStore();

  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green mx-auto mb-6">
          <ShieldAlert size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-brand-text mb-2">Acesso Pendente</h1>
        <p className="text-brand-muted mb-8 text-sm leading-relaxed">
          {isStudent 
            ? 'Sua conta de aluno foi criada, mas ainda precisa ser liberada pela sua academia. Entre em contato com a recepção para ativar seu acesso.'
            : 'Sua academia foi cadastrada com sucesso! No entanto, o acesso ao painel administrativo precisa ser liberado pelo administrador global.'}
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => window.open('https://wa.me/5500000000000', '_blank')}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            Falar com Suporte
          </button>
          
          <button 
            onClick={() => logout()}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Sair da Conta
          </button>
        </div>

        <p className="mt-8 text-[11px] text-brand-border">
          E-mail logado: {user?.email} <br />
          Status: {isStudent ? 'Aguardando concessão de acesso' : 'Academia Inativa'}
        </p>
      </motion.div>
    </div>
  );
}
