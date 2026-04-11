import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Search, Activity, User, FileText, X, Save, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useStudentStore } from '../store/studentStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { EvolutionRecord } from '../types';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

export default function Evolution() {
  const { tenant, user } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();
  
  const [records, setRecords] = useState<(EvolutionRecord & { studentName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  
  const fetchRecords = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'evolution_records'),
        where('tenantId', '==', tenant.id),
        orderBy('recordedAt', 'desc')
      );
      const snap = await getDocs(q);
      const recordsData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as EvolutionRecord));
      setRecords(recordsData);
    } catch (error) {
      console.error('Error fetching evolution records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant) {
      fetchRecords();
    }
  }, [tenant]);

  // Enhance records with student names dynamically
  const enhancedRecords = records.map(record => ({
    ...record,
    studentName: students.find(s => s.id === record.studentId)?.name || 'Carregando...'
  }));

  const filteredRecords = enhancedRecords.filter(record => 
    record.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user) return;
    if (!selectedStudentId || !weight || !height || !bodyFat) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);
      const bfNum = parseFloat(bodyFat);
      
      // Optional: calculate muscle mass roughly if wanted, or leave it. We'll leave it empty for now, student screen shows it if available.
      // But let's calculate BMI just for display in records list
      
      const recordData = {
        tenantId: tenant.id,
        studentId: selectedStudentId,
        recordedAt: serverTimestamp(),
        weight: weightNum,
        height: heightNum,
        bodyFatPercent: bfNum,
        recordedBy: user.id,
        measurements: {} // Empty measurements as they were not required, but structure expects it
      };

      await addDoc(collection(db, 'evolution_records'), recordData);
      toast.success('Avaliação registrada com sucesso!');
      
      setIsModalOpen(false);
      setSelectedStudentId('');
      setWeight('');
      setHeight('');
      setBodyFat('');
      
      fetchRecords(); // refresh list
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Erro ao salvar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Acompanhamento</h1>
          <p className="text-brand-muted">Registre e acompanhe a evolução física dos alunos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Avaliação
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
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
      </div>

      {/* Records List */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black/50 border-b border-brand-border">
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Aluno</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Peso</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Altura</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">BF %</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">IMC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-brand-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-brand-green/30 border-t-brand-green animate-spin" />
                      Carregando avaliações...
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-brand-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <TrendingUp size={48} className="opacity-20 text-brand-green" />
                      <p>Nenhuma avaliação encontrada.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  // Calculate IMC just for display
                  const imc = (record.weight && record.height) ? (record.weight / ((record.height/100) * (record.height/100))).toFixed(1) : '--';
                  
                  return (
                    <tr key={record.id} className="hover:bg-brand-black/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-brand-muted" />
                          <span className="text-sm font-medium text-brand-text">
                            {formatDate(record.recordedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                            <User size={14} />
                          </div>
                          <span className="text-sm font-bold text-brand-text">{record.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-brand-text">{record.weight} kg</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-brand-text">{record.height} cm</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-brand-green">{record.bodyFatPercent}%</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-brand-border rounded-lg text-xs font-medium text-brand-muted">
                          {imc}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Evaluation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-brand-dark border border-brand-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-brand-border flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
                    <TrendingUp className="text-brand-green" size={24} />
                    Nova Avaliação Física
                  </h3>
                  <p className="text-xs text-brand-muted mt-1">Insira as métricas mensais do aluno</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="p-2 rounded-xl hover:bg-brand-border text-brand-muted transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Aluno</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                        <User size={16} />
                      </div>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="input-field w-full pl-10 appearance-none"
                        required
                        disabled={submitting}
                      >
                        <option value="">Selecione um aluno...</option>
                        {students.filter(s => s.status === 'ACTIVE').map(student => (
                          <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Altura (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="input-field w-full"
                        placeholder="Ex: 175"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="input-field w-full"
                        placeholder="Ex: 80.5"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Percentual de Gordura (BF %)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-green">
                        <Activity size={16} />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={bodyFat}
                        onChange={(e) => setBodyFat(e.target.value)}
                        className="input-field w-full pl-10"
                        placeholder="Ex: 15.5"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-brand-border">
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
                    disabled={submitting}
                    className="btn-primary flex items-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    Salvar Avaliação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
