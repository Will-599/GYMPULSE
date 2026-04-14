import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Save, X, Edit, Trash2, Utensils, Clock, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useStudentStore } from '../store/studentStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { DietPlan, DietMeal, DietFood } from '../types';
import toast from 'react-hot-toast';
import { formatDate } from '../lib/utils';

const MEAL_TYPES = [
  'Café da Manhã',
  'Lanche da Manhã',
  'Almoço',
  'Lanche da Tarde',
  'Pré-Treino',
  'Pós-Treino',
  'Janta',
  'Ceia',
  'Outro'
];

export default function NutritionPanel() {
  const { tenant, user } = useAuthStore();
  const { students } = useStudentStore();
  
  const [plans, setPlans] = useState<(DietPlan & { studentName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState('');
  const [meals, setMeals] = useState<DietMeal[]>([]);

  const fetchPlans = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'diet_plans'),
        where('tenantId', '==', tenant.id),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const plansData = snap.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as DietPlan))
        .filter(plan => (plan as any).isDeleted !== true);
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching diet plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant) {
      fetchPlans();
    }
  }, [tenant]);

  const enhancedPlans = plans.map(plan => ({
    ...plan,
    studentName: students.find(s => s.id === plan.studentId)?.name || 'Carregando...'
  }));

  const filteredPlans = enhancedPlans.filter(plan => 
    plan.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMeal = () => {
    setMeals([...meals, { id: crypto.randomUUID(), name: '', time: '', foods: [] }]);
  };

  const handleRemoveMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const handleMealChange = (id: string, field: 'name' | 'time', value: string) => {
    setMeals(meals.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleAddFoodToMeal = (mealId: string) => {
    setMeals(meals.map(m => m.id === mealId ? { 
      ...m, 
      foods: [...m.foods, { id: crypto.randomUUID(), name: '', quantity: '' }] 
    } : m));
  };

  const handleRemoveFoodFromMeal = (mealId: string, foodId: string) => {
    setMeals(meals.map(m => m.id === mealId ? { 
      ...m, 
      foods: m.foods.filter(f => f.id !== foodId) 
    } : m));
  };

  const handleFoodChangeInMeal = (mealId: string, foodId: string, field: 'name' | 'quantity', value: string) => {
    setMeals(meals.map(m => m.id === mealId ? { 
      ...m, 
      foods: m.foods.map(f => f.id === foodId ? { ...f, [field]: value } : f) 
    } : m));
  };

  const handleOpenModal = (plan?: DietPlan) => {
    if (plan) {
      setEditingPlanId(plan.id);
      setSelectedStudentId(plan.studentId);
      setMealsPerDay(plan.mealsPerDay.toString());
      setMeals(plan.meals || []);
    } else {
      setEditingPlanId(null);
      setSelectedStudentId('');
      setMealsPerDay('');
      setMeals([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user) return;
    
    if (!selectedStudentId || !mealsPerDay || meals.length === 0) {
      toast.error('Preencha os campos e adicione pelo menos uma refeição.');
      return;
    }
    
    const invalidMeals = meals.some(m => !m.name || !m.time || m.foods.length === 0);
    if (invalidMeals) {
      toast.error('Preencha os dados das refeições e adicione pelo menos um alimento em cada.');
      return;
    }

    const invalidFoods = meals.some(m => m.foods.some(f => !f.name.trim() || !f.quantity.trim()));
    if (invalidFoods) {
      toast.error('Preencha todos os campos dos alimentos adicionados.');
      return;
    }

    setSubmitting(true);
    try {
      // Validate and sanitize data
      const parsedMealsPerDay = parseInt(mealsPerDay);
      if (isNaN(parsedMealsPerDay)) {
        throw new Error('Número de refeições inválido.');
      }

      // Ensure no undefined values in meals
      const sanitizedMeals = meals.map(meal => ({
        id: meal.id || crypto.randomUUID(),
        name: meal.name || '',
        time: meal.time || '',
        foods: (meal.foods || []).map(food => ({
          id: food.id || crypto.randomUUID(),
          name: food.name || '',
          quantity: food.quantity || ''
        }))
      }));

      const planData = {
        tenantId: tenant.id,
        studentId: selectedStudentId,
        mealsPerDay: parsedMealsPerDay,
        meals: sanitizedMeals,
        recordedBy: user.id,
        updatedAt: serverTimestamp(),
        isDeleted: false
      };

      if (editingPlanId) {
        await updateDoc(doc(db, 'diet_plans', editingPlanId), planData);
        toast.success('Dieta atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'diet_plans'), {
          ...planData,
          createdAt: serverTimestamp()
        });
        toast.success('Dieta registrada com sucesso!');
      }
      
      setIsModalOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Error saving diet:', error);
      const errorMessage = error.code === 'permission-denied' 
        ? 'Sem permissão para salvar dieta. Verifique as regras do banco.' 
        : `Erro ao salvar dieta: ${error.message || 'Erro desconhecido'}`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Tem certeza que deseja enviar esta dieta para a lixeira?')) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'diet_plans', planId), {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
      toast.success('Dieta enviada para a lixeira.');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting diet:', error);
      toast.error('Erro ao excluir dieta.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadDietPDF = (plan: DietPlan & { studentName?: string }) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('GYMPULSE - Plano Nutricional', 20, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Aluno: ${plan.studentName || 'Não identificado'}`, 20, 35);
      doc.text(`Data: ${formatDate(plan.updatedAt)}`, pageWidth - 60, 35);

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text(`Meta Diária: ${plan.mealsPerDay} Refeições`, 20, 55);

      // Meals Table
      let startY = 65;
      const sortedMeals = [...(plan.meals || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      
      sortedMeals.forEach((meal, index) => {
        autoTable(doc, {
          startY: startY,
          head: [[`${meal.time} - ${meal.name}`, 'Quantidade']],
          body: (meal.foods || []).map(f => [f.name, f.quantity]),
          headStyles: { fillColor: [0, 255, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 20, right: 20 },
          theme: 'striped'
        });
        
        startY = (doc as any).lastAutoTable.finalY + 10;
        
        if (startY > 250 && index < sortedMeals.length - 1) {
          doc.addPage();
          startY = 20;
        }
      });

      doc.save(`Dieta_${(plan.studentName || 'Aluno').replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF da Dieta gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF da dieta.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="input-field w-full pl-10"
            placeholder="Buscar por nome do aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Dieta
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black/50 border-b border-brand-border">
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Aluno</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Refeições/Dia</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Itens na Dieta</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-brand-muted">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-green/30 border-t-brand-green animate-spin mx-auto mb-2" />
                    Carregando dietas...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-brand-muted">
                    <Utensils size={48} className="opacity-20 text-brand-green mx-auto mb-3" />
                    <p>Nenhuma dieta encontrada.</p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-brand-black/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-brand-text">
                        {formatDate(plan.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-bold text-brand-text">{plan.studentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-brand-text">{plan.mealsPerDay}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-brand-border rounded-lg text-xs font-medium text-brand-muted">
                        {plan.meals?.length || 0} refeições
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => downloadDietPDF(plan)}
                          className="p-2 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg transition-colors"
                          title="Baixar PDF"
                        >
                          <FileDown size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(plan)}
                          disabled={submitting}
                          className="p-2 bg-brand-black hover:bg-brand-border text-brand-muted hover:text-brand-text rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          disabled={submitting}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
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

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-brand-dark w-full max-w-2xl rounded-3xl border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-brand-border flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
                    <Utensils className="text-brand-green" size={24} />
                    {editingPlanId ? 'Editar Dieta' : 'Nova Dieta'}
                  </h3>
                  <p className="text-xs text-brand-muted mt-1">Insira os detalhes da dieta para o aluno</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="p-2 rounded-xl hover:bg-brand-border text-brand-muted transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="dietForm" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Aluno</label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="input-field w-full"
                        required
                        disabled={submitting || !!editingPlanId}
                      >
                        <option value="">Selecione um aluno...</option>
                        {students.filter(s => s.status === 'ACTIVE').map(student => (
                          <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Refeições por dia</label>
                      <input
                        type="number"
                        min="1"
                        value={mealsPerDay}
                        onChange={(e) => setMealsPerDay(e.target.value)}
                        className="input-field w-full"
                        placeholder="Ex: 5"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-border space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-brand-text">Refeições da Dieta</h4>
                      <button
                        type="button"
                        onClick={handleAddMeal}
                        disabled={submitting}
                        className="text-xs font-medium bg-brand-green/10 text-brand-green px-3 py-1.5 rounded-lg hover:bg-brand-green/20 transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Adicionar Refeição
                      </button>
                    </div>

                    {meals.length === 0 ? (
                      <div className="text-center p-8 border border-dashed border-brand-border rounded-xl">
                        <Utensils size={32} className="text-brand-border mx-auto mb-2 opacity-30" />
                        <p className="text-sm text-brand-muted">Nenhuma refeição adicionada.</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {meals.map((meal) => (
                          <div key={meal.id} className="bg-brand-black/20 rounded-2xl border border-brand-border overflow-hidden">
                            <div className="p-4 bg-brand-black/40 border-b border-brand-border flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="flex-1 w-full sm:w-auto">
                                <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Tipo de Refeição</label>
                                <select
                                  value={meal.name}
                                  onChange={(e) => handleMealChange(meal.id, 'name', e.target.value)}
                                  className="input-field w-full py-2 text-sm"
                                  required
                                  disabled={submitting}
                                >
                                  <option value="">Selecione...</option>
                                  {MEAL_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-full sm:w-32">
                                <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Horário</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-brand-muted">
                                    <Clock size={12} />
                                  </div>
                                  <input
                                    type="time"
                                    value={meal.time}
                                    onChange={(e) => handleMealChange(meal.id, 'time', e.target.value)}
                                    className="input-field w-full py-2 pl-7 text-sm"
                                    required
                                    disabled={submitting}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMeal(meal.id)}
                                disabled={submitting}
                                className="sm:mt-5 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remover Refeição"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Alimentos</p>
                                <button
                                  type="button"
                                  onClick={() => handleAddFoodToMeal(meal.id)}
                                  disabled={submitting}
                                  className="text-[10px] font-bold text-brand-green hover:underline flex items-center gap-1"
                                >
                                  <Plus size={12} /> Adicionar Alimento
                                </button>
                              </div>

                              {meal.foods.length === 0 ? (
                                <p className="text-[10px] text-brand-muted italic text-center py-2">Nenhum alimento nesta refeição.</p>
                              ) : (
                                meal.foods.map((food) => (
                                  <div key={food.id} className="flex items-start gap-3 bg-brand-dark/50 p-2 rounded-xl border border-brand-border/50">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={food.name}
                                        onChange={(e) => handleFoodChangeInMeal(meal.id, food.id, 'name', e.target.value)}
                                        className="input-field w-full py-1.5 text-xs"
                                        placeholder="Alimento (ex: Aveia)"
                                        required
                                        disabled={submitting}
                                      />
                                    </div>
                                    <div className="w-1/3">
                                      <input
                                        type="text"
                                        value={food.quantity}
                                        onChange={(e) => handleFoodChangeInMeal(meal.id, food.id, 'quantity', e.target.value)}
                                        className="input-field w-full py-1.5 text-xs"
                                        placeholder="Qtd (ex: 30g)"
                                        required
                                        disabled={submitting}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFoodFromMeal(meal.id, food.id)}
                                      disabled={submitting}
                                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-brand-border flex items-center justify-end gap-3 shrink-0 bg-brand-dark">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="dietForm"
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  Salvar Dieta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
