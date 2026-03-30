import React from 'react';
import { Settings as SettingsIcon, User, Building2, Bell, Shield, CreditCard, Save } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Configurações</h1>
        <p className="text-brand-muted">Gerencie sua conta e preferências da academia</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'Meu Perfil', icon: User, active: true },
            { id: 'gym', label: 'Dados da Academia', icon: Building2 },
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'security', label: 'Segurança', icon: Shield },
            { id: 'billing', label: 'Assinatura SaaS', icon: CreditCard },
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                item.active 
                  ? 'bg-brand-green text-brand-black shadow-lg shadow-brand-green/20' 
                  : 'text-brand-muted hover:bg-brand-dark hover:text-brand-text border border-transparent hover:border-brand-border'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card">
            <h3 className="font-bold text-brand-text mb-6 flex items-center gap-2">
              <User size={18} className="text-brand-green" />
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-muted">Nome Completo</label>
                <input type="text" className="input-field w-full" defaultValue="Administrador" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-muted">E-mail</label>
                <input type="email" className="input-field w-full" defaultValue="admin@gymflow.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-muted">Telefone</label>
                <input type="text" className="input-field w-full" defaultValue="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-muted">Cargo</label>
                <input type="text" className="input-field w-full" defaultValue="Proprietário" disabled />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button className="btn-primary flex items-center gap-2">
                <Save size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>

          <div className="card border-red-500/20">
            <h3 className="font-bold text-red-500 mb-2">Zona de Perigo</h3>
            <p className="text-sm text-brand-muted mb-4">
              Ao excluir sua conta, todos os dados da sua academia serão removidos permanentemente.
            </p>
            <button className="text-sm font-bold text-red-500 hover:underline">
              Excluir minha conta e dados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
