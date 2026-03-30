import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Users, Dumbbell, Search, Filter, AlertCircle, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useStudentStore } from '../store/studentStore';
import { useWorkoutStore } from '../store/workoutStore';
import { usePaymentStore } from '../store/paymentStore';
import toast from 'react-hot-toast';

type TrashCategory = 'students' | 'plans' | 'templates' | 'payments';

export default function TrashBin() {
  const { tenant } = useAuthStore();
  const { trashedStudents, fetchTrashedStudents, restoreStudent } = useStudentStore();
  const { trashedPlans, fetchTrashedPlans, restorePlan, trashedTemplates, fetchTrashedTemplates, restoreTemplate } = useWorkoutStore();
  const { trashedPayments, fetchTrashedPayments, restorePayment } = usePaymentStore();
  
  const [activeCategory, setActiveCategory] = useState<TrashCategory>('students');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (tenant) {
      const unsubStudents = fetchTrashedStudents(tenant.id);
      const unsubPlans = fetchTrashedPlans(tenant.id);
      const unsubTemplates = fetchTrashedTemplates(tenant.id);
      const unsubPayments = fetchTrashedPayments(tenant.id);
      
      return () => {
        unsubStudents();
        unsubPlans();
        unsubTemplates();
        unsubPayments();
      };
    }
  }, [tenant, fetchTrashedStudents, fetchTrashedPlans, fetchTrashedTemplates, fetchTrashedPayments]);

  const handleRestore = async (id: string, category: TrashCategory) => {
    try {
      if (category === 'students') await restoreStudent(id);
      else if (category === 'plans') await restorePlan(id);
      else if (category === 'templates') await restoreTemplate(id);
      else if (category === 'payments') await restorePayment(id);
      
      toast.success('Item restaurado com sucesso!');
    } catch (error) {
      toast.error('Erro ao restaurar item');
    }
  };

  const getFilteredItems = () => {
    let items: any[] = [];
    if (activeCategory === 'students') items = trashedStudents;
    else if (activeCategory === 'plans') items = trashedPlans;
    else if (activeCategory === 'templates') items = trashedTemplates;
    else if (activeCategory === 'payments') items = trashedPayments;

    return items.filter(item => {
      const search = searchTerm.toLowerCase();
      const name = (item.name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const reference = (item.reference || '').toLowerCase();
      
      return name.includes(search) || email.includes(search) || reference.includes(search);
    });
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
          <Trash2 className="text-brand-green" size={24} />
          Lixeira
        </h1>
        <p className="text-brand-muted">Restaure itens que foram excluídos recentemente</p>
      </header>

      {/* Category Tabs */}
      <div className="flex gap-2 p-1 bg-brand-black/50 rounded-xl w-fit border border-brand-border">
        <button
          onClick={() => setActiveCategory('students')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeCategory === 'students' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Users size={16} />
          Alunos ({trashedStudents.length})
        </button>
        <button
          onClick={() => setActiveCategory('plans')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeCategory === 'plans' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Dumbbell size={16} />
          Treinos ({trashedPlans.length})
        </button>
        <button
          onClick={() => setActiveCategory('payments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeCategory === 'payments' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <CreditCard size={16} />
          Pagamentos ({trashedPayments.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
          <Search size={18} />
        </div>
        <input
          type="text"
          className="input-field w-full pl-10"
          placeholder="Buscar na lixeira..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Items List */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black/50 border-b border-brand-border">
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Excluído em</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-brand-muted">
                      <AlertCircle size={32} />
                      <p>Nenhum item encontrado na lixeira.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-black/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-brand-text">{item.name}</p>
                        {item.email && <p className="text-xs text-brand-muted">{item.email}</p>}
                        {item.description && <p className="text-xs text-brand-muted truncate max-w-xs">{item.description}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-brand-muted">
                        {item.deletedAt?.toDate ? item.deletedAt.toDate().toLocaleString('pt-BR') : 'Data desconhecida'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRestore(item.id, activeCategory)}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2 ml-auto hover:bg-brand-green/10 hover:text-brand-green hover:border-brand-green/30"
                      >
                        <RotateCcw size={14} />
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
