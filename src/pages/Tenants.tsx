import React, { useEffect, useState } from 'react';
import { Building2, Mail, Globe, Calendar, ShieldCheck, ShieldAlert, UserPlus, Pencil, Trash2, Key } from 'lucide-react';
import { useTenantStore } from '../store/tenantStore';
import AddTenantModal from '../components/AddTenantModal';
import toast from 'react-hot-toast';

export default function Tenants() {
  const { tenants, loading, fetchTenants, deleteTenant, updateTenant } = useTenantStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = fetchTenants();
    return () => unsubscribe();
  }, [fetchTenants]);

  const handleEdit = (tenant: any) => {
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a academia ${name}? Todos os dados vinculados serão perdidos.`)) {
      try {
        await deleteTenant(id);
        toast.success('Academia excluída com sucesso');
      } catch (error) {
        toast.error('Erro ao excluir academia');
      }
    }
  };

  const handleToggleAccess = async (id: string, currentStatus: boolean) => {
    try {
      await updateTenant(id, { isActive: !currentStatus });
      toast.success(currentStatus ? 'Acesso bloqueado' : 'Acesso liberado com sucesso!');
    } catch (error) {
      toast.error('Erro ao alterar acesso');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Academias</h1>
          <p className="text-brand-muted">Gerencie todas as academias registradas na plataforma</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={20} />
          Nova Academia
        </button>
      </header>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black/50 border-b border-brand-border">
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Academia</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Slug / Link</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Plano</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-brand-muted">
                    Carregando academias...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-brand-muted">
                    Nenhuma academia encontrada.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-border flex items-center justify-center text-brand-muted">
                          {tenant.logoUrl ? (
                            <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            <Building2 size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-text">{tenant.name}</p>
                          <div className="flex items-center gap-2 text-xs text-brand-muted mt-1">
                            <Mail size={12} />
                            {tenant.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-brand-muted">
                        <Globe size={14} />
                        <span>{tenant.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.planType === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-500' :
                        tenant.planType === 'PRO' ? 'bg-brand-green/10 text-brand-green' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {tenant.planType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tenant.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500">
                          <ShieldCheck size={14} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                          <ShieldAlert size={14} />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!tenant.isActive && (
                          <button 
                            onClick={() => handleToggleAccess(tenant.id, tenant.isActive)}
                            className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Liberar Acesso"
                          >
                            <Key size={16} />
                            Liberar
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(tenant)}
                          className="p-2 text-brand-muted hover:text-brand-text hover:bg-brand-border rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTenantModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTenant(null);
        }} 
        tenant={editingTenant}
      />
    </div>
  );
}
