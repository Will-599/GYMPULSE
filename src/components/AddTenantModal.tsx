import React, { useState } from 'react';
import { X, Building2, Mail, Globe, CreditCard } from 'lucide-react';
import { useTenantStore } from '../store/tenantStore';
import toast from 'react-hot-toast';
import { Tenant } from '../types';

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
}

export default function AddTenantModal({ isOpen, onClose, tenant }: AddTenantModalProps) {
  const { addTenant, updateTenant } = useTenantStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    slug: '',
    planType: 'PRO' as 'BASIC' | 'PRO' | 'ENTERPRISE',
    isActive: true,
    phone: '',
    address: ''
  });

  React.useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        email: tenant.email,
        slug: tenant.slug,
        planType: tenant.planType,
        isActive: tenant.isActive,
        phone: tenant.phone || '',
        address: tenant.address || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        slug: '',
        planType: 'PRO',
        isActive: true,
        phone: '',
        address: ''
      });
    }
  }, [tenant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
      
      if (tenant) {
        await updateTenant(tenant.id, {
          ...formData,
          slug
        });
        toast.success('Academia atualizada com sucesso!');
      } else {
        await addTenant({
          ...formData,
          slug
        });
        toast.success('Academia cadastrada com sucesso! Configure os dados e libere o acesso.');
      }
      
      onClose();
    } catch (error) {
      toast.error(tenant ? 'Erro ao atualizar academia' : 'Erro ao cadastrar academia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/80 backdrop-blur-sm shadow-2xl overflow-y-auto">
      <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-6 border-b border-brand-border">
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <Building2 className="text-brand-green" size={24} />
            {tenant ? 'Editar Academia' : 'Nova Academia'}
          </h2>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-text transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-brand-muted">Nome da Academia</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
              <input
                required
                type="text"
                className="input-field pl-10 w-full"
                placeholder="Ex: Arena Fitness"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-brand-muted">E-mail Administrativo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
              <input
                required
                type="email"
                className="input-field pl-10 w-full"
                placeholder="contato@academia.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-brand-muted">Slug / Link (opcional)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
              <input
                type="text"
                className="input-field pl-10 w-full"
                placeholder="arena-fitness"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <p className="text-[10px] text-brand-muted italic mt-1">Deixe vazio para gerar automaticamente do nome.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-brand-muted">Plano</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
              <select
                className="input-field pl-10 w-full appearance-none"
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value as any })}
              >
                <option value="BASIC">Básico</option>
                <option value="PRO">Profissional (PRÓ)</option>
                <option value="ENTERPRISE">Empresarial</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-brand-text">Acesso da Academia</h4>
                <p className="text-xs text-brand-muted">Permite login e uso do sistema</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <div className="w-11 h-6 bg-brand-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
