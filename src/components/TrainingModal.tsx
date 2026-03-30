import React, { useState, useEffect } from 'react';
import { X, Save, Dumbbell, User, Info, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useStudentStore } from '../store/studentStore';
import { useWorkoutStore } from '../store/workoutStore';
import { TrainingPlan, TrainingDay, Exercise } from '../types';
import CalendarWeek from './CalendarWeek';
import ExerciseForm from './ExerciseForm';
import toast from 'react-hot-toast';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<TrainingPlan>;
}

const INITIAL_DAYS: TrainingDay[] = [
  { day: 'Segunda', exercises: [] },
  { day: 'Terça', exercises: [] },
  { day: 'Quarta', exercises: [] },
  { day: 'Quinta', exercises: [] },
  { day: 'Sexta', exercises: [] },
  { day: 'Sábado', exercises: [] },
  { day: 'Domingo', exercises: [] },
];

export default function TrainingModal({ isOpen, onClose, initialData }: TrainingModalProps) {
  const { tenant, user } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();
  const { assignPlan, updatePlan } = useWorkoutStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [days, setDays] = useState<TrainingDay[]>(INITIAL_DAYS);
  const [selectedDay, setSelectedDay] = useState('Segunda');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      fetchStudents(tenant.id);
    }
  }, [tenant, fetchStudents]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedStudentId(initialData.studentId || '');
      setDays(initialData.days || INITIAL_DAYS);
    } else {
      setName('');
      setDescription('');
      setSelectedStudentId('');
      setDays(INITIAL_DAYS);
    }
  }, [initialData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user) return;
    if (!selectedStudentId) {
      toast.error('Selecione um aluno');
      return;
    }

    const hasExercises = days.some(day => day.exercises.length > 0);
    if (!hasExercises) {
      toast.error('Adicione pelo menos um exercício ao plano');
      return;
    }

    setLoading(true);
    try {
      const selectedStudent = students.find(s => s.id === selectedStudentId);

      const planData = {
        tenantId: tenant.id,
        studentId: selectedStudentId,
        studentUserId: selectedStudent?.userId || null,
        name,
        description,
        days,
        startDate: new Date().toISOString(),
        status: 'ACTIVE' as const,
        assignedBy: user.id,
      };

      if (initialData?.id) {
        await updatePlan(initialData.id, planData);
        toast.success('Plano de treino atualizado!');
      } else {
        await assignPlan(planData);
        toast.success('Plano de treino atribuído com sucesso!');
      }
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Erro ao salvar plano de treino');
    } finally {
      setLoading(false);
    }
  };

  const updateExercisesForDay = (exercises: Exercise[]) => {
    setDays(prev => prev.map(d => d.day === selectedDay ? { ...d, exercises } : d));
  };

  const currentDayExercises = days.find(d => d.day === selectedDay)?.exercises || [];
  const daysWithExercises = days.filter(d => d.exercises.length > 0).map(d => d.day);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-brand-dark border border-brand-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-dark/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                <Dumbbell size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-text">
                  {initialData?.id ? 'Editar Plano de Treino' : 'Novo Plano de Treino'}
                </h3>
                <p className="text-xs text-brand-muted">Configure a rotina semanal do aluno</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-brand-border text-brand-muted transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Basic Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-brand-green mb-4">
                <Info size={16} />
                <h4 className="text-sm font-bold uppercase tracking-widest">Informações Básicas</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider">Aluno</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                      <User size={16} />
                    </div>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="input-field w-full pl-10 appearance-none"
                      required
                    >
                      <option value="">Selecione um aluno...</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>{student.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider">Nome do Treino</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Ex: Hipertrofia A/B/C"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider">Descrição / Observações</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field w-full min-h-[80px] py-3"
                  placeholder="Instruções gerais para o aluno..."
                />
              </div>
            </section>

            {/* Weekly Schedule */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-brand-green mb-4">
                <Calendar size={16} />
                <h4 className="text-sm font-bold uppercase tracking-widest">Cronograma Semanal</h4>
              </div>

              <div className="space-y-6">
                <CalendarWeek 
                  selectedDay={selectedDay} 
                  onSelectDay={setSelectedDay}
                  daysWithExercises={daysWithExercises}
                />

                <div className="bg-brand-black/30 border border-brand-border rounded-3xl p-6">
                  <ExerciseForm 
                    exercises={currentDayExercises} 
                    onChange={updateExercisesForDay}
                  />
                </div>
              </div>
            </section>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-brand-border bg-brand-dark/50 backdrop-blur-md flex items-center justify-end gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary px-8 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {initialData?.id ? 'Salvar Alterações' : 'Salvar e Atribuir'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
