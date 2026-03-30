import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Search, Filter, MoreVertical, Play, Clock, Activity, Edit2, Trash2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useStudentStore } from '../store/studentStore';
import TrainingModal from '../components/TrainingModal';
import { TrainingPlan } from '../types';
import toast from 'react-hot-toast';

export default function Workouts() {
  const { tenant } = useAuthStore();
  const { plans, fetchPlans, templates, fetchTemplates, loading, softDeletePlan, softDeleteTemplate } = useWorkoutStore();
  const { students, fetchStudents } = useStudentStore();
  
  const [activeTab, setActiveTab] = useState<'plans' | 'templates'>('plans');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<TrainingPlan> | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (tenant) {
      const unsubscribePlans = fetchPlans(tenant.id);
      const unsubscribeTemplates = fetchTemplates(tenant.id);
      const unsubscribeStudents = fetchStudents(tenant.id);
      return () => {
        unsubscribePlans();
        unsubscribeTemplates();
        unsubscribeStudents();
      };
    }
  }, [tenant, fetchPlans, fetchTemplates, fetchStudents]);

  const handleEdit = (plan: TrainingPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPlan(undefined);
    setIsModalOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm('Tem certeza que deseja mover este treino para a lixeira?')) {
      try {
        await softDeletePlan(id);
        toast.success('Treino movido para a lixeira');
      } catch (error) {
        toast.error('Erro ao excluir treino');
      }
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja mover este modelo para a lixeira?')) {
      try {
        await softDeleteTemplate(id);
        toast.success('Modelo movido para a lixeira');
      } catch (error) {
        toast.error('Erro ao excluir modelo');
      }
    }
  };

  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Aluno não encontrado';
  };

  const getTotalExercises = (exercises: any[]) => {
    return exercises.length;
  };

  const getTemplateTotalExercises = (template: any) => {
    return template.days.reduce((total: number, day: any) => total + day.exercises.length, 0);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Treinos</h1>
          <p className="text-brand-muted">Crie e gerencie fichas de treinamento e modelos</p>
        </div>
        <button 
          onClick={handleNew}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Treino
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-brand-black/50 rounded-xl w-fit border border-brand-border">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'plans' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Treinos Atribuídos ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'templates' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Modelos ({templates.length})
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="input-field w-full pl-10"
            placeholder={activeTab === 'plans' ? "Buscar por nome do treino ou objetivo..." : "Buscar por nome do modelo..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      {/* Workout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-brand-muted">
            Carregando...
          </div>
        ) : activeTab === 'plans' ? (
          filteredPlans.length === 0 ? (
            <div className="col-span-full py-12 text-center text-brand-muted border-2 border-dashed border-brand-border rounded-3xl">
              Nenhum treino encontrado. Comece criando um novo plano!
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <motion.div 
                key={plan.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card group hover:border-brand-green/30 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-brand-black border border-brand-border group-hover:border-brand-green/50 transition-colors text-brand-green">
                    <Dumbbell size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(plan)}
                      className="p-2 rounded-lg hover:bg-brand-border text-brand-muted hover:text-brand-green transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 rounded-lg hover:bg-brand-border text-brand-muted hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-brand-text mb-1 truncate">{plan.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-3">
                  <User size={12} />
                  <span className="font-medium text-brand-green">{getStudentName(plan.studentId)}</span>
                </div>
                
                <p className="text-sm text-brand-muted mb-4 line-clamp-2 flex-1">
                  {plan.description || 'Sem descrição.'}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-brand-muted mb-6">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    60 min
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity size={14} />
                    {getTemplateTotalExercises(plan)} exercícios
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(plan)}
                    className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    Editar Plano
                  </button>
                  <button className="btn-secondary px-3 py-2">
                    <Play size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )
        ) : (
          filteredTemplates.length === 0 ? (
            <div className="col-span-full py-12 text-center text-brand-muted border-2 border-dashed border-brand-border rounded-3xl">
              Nenhum modelo encontrado.
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <motion.div 
                key={template.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card group hover:border-brand-green/30 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-brand-black border border-brand-border group-hover:border-brand-green/50 transition-colors text-brand-green">
                    <Dumbbell size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-2 rounded-lg hover:bg-brand-border text-brand-muted hover:text-brand-green transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 rounded-lg hover:bg-brand-border text-brand-muted hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-brand-text mb-1 truncate">{template.name}</h3>
                <p className="text-sm text-brand-muted mb-4 line-clamp-2 flex-1">
                  {template.description || 'Sem descrição.'}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-brand-muted mb-6">
                  <div className="flex items-center gap-1">
                    <Activity size={14} />
                    {getTemplateTotalExercises(template)} exercícios
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2"
                  >
                    Usar Modelo
                  </button>
                </div>
              </motion.div>
            ))
          )
        )}
      </div>

      <TrainingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingPlan}
      />
    </div>
  );
}
