import React, { useState, useEffect } from 'react';
import { Dumbbell, Clock, ChevronRight, Activity, Info, ListChecks, Calendar, Download, Printer, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { TrainingPlan } from '../types';
import { cn } from '../lib/utils';
import TimerModal from '../components/TimerModal';

export default function StudentWorkouts() {
  const { user, tenant } = useAuthStore();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  useEffect(() => {
    if (!user || !tenant) return;

    const fetchPlans = async () => {
      try {
        const q = query(
          collection(db, 'trainingPlans'),
          where('studentUserId', '==', user.id),
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const plansData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as TrainingPlan));
        setPlans(plansData);
        
        if (plansData.length > 0) {
          const active = plansData.find(p => p.status === 'ACTIVE') || plansData[0];
          setSelectedPlan(active);
        }
        
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [user, tenant]);

  useEffect(() => {
    if (selectedPlan) {
      const firstDayWithExercises = selectedPlan.days.find(d => d.exercises.length > 0);
      if (firstDayWithExercises) {
        setSelectedDay(firstDayWithExercises.day);
      } else if (selectedPlan.days.length > 0) {
        setSelectedDay(selectedPlan.days[0].day);
      }
    }
  }, [selectedPlan]);

  const currentDayExercises = selectedPlan?.days.find(d => d.day === selectedDay)?.exercises || [];
  const daysWithExercises = selectedPlan?.days.filter(d => d.exercises.length > 0).map(d => d.day) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-brand-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
          <p>Carregando seus treinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="no-print">
        <h1 className="text-2xl font-bold text-brand-text">Meus Treinos</h1>
        <p className="text-brand-muted">Acompanhe sua rotina de exercícios</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        {/* Plans List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider px-2">Programas de Treino</h3>
          {plans.length === 0 ? (
            <div className="card p-8 text-center text-brand-muted border-2 border-dashed border-brand-border">
              <Dumbbell size={40} className="mx-auto mb-4 opacity-20" />
              <p>Nenhum treino prescrito ainda.</p>
            </div>
          ) : (
            plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={cn(
                  "w-full text-left card p-4 transition-all border-2",
                  selectedPlan?.id === plan.id 
                    ? 'border-brand-green bg-brand-green/5 shadow-lg shadow-brand-green/5' 
                    : 'border-brand-border hover:border-brand-green/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    plan.status === 'ACTIVE' 
                      ? 'bg-brand-green/20 text-brand-green' 
                      : 'bg-brand-muted/20 text-brand-muted'
                  )}>
                    {plan.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                  </span>
                  <Dumbbell size={16} className={selectedPlan?.id === plan.id ? 'text-brand-green' : 'text-brand-muted'} />
                </div>
                <h4 className="font-bold text-brand-text mb-1 truncate">{plan.name}</h4>
                <p className="text-xs text-brand-muted">
                  {plan.days.reduce((acc, d) => acc + d.exercises.length, 0)} exercícios totais
                </p>
              </button>
            ))
          )}
        </div>

        {/* Selected Plan Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedPlan ? (
              <motion.div
                key={selectedPlan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="card p-6 bg-brand-dark/50 border-brand-border/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-brand-text">{selectedPlan.name}</h2>
                      <p className="text-sm text-brand-muted mt-1">{selectedPlan.description || 'Siga as instruções abaixo para cada dia.'}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex items-center gap-4 text-xs text-brand-muted bg-brand-black/40 p-3 rounded-2xl border border-brand-border">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-brand-green" />
                          <span>~50 min</span>
                        </div>
                        <div className="w-px h-4 bg-brand-border" />
                        <div className="flex items-center gap-1.5">
                          <ListChecks size={14} className="text-brand-green" />
                          <span>{selectedPlan.days.reduce((acc, d) => acc + d.exercises.length, 0)} Exercícios</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 w-full sm:w-auto">
                        <button 
                          onClick={() => setIsTimerOpen(true)}
                          className="btn-secondary flex-1 sm:flex-none text-xs py-2 px-4 flex items-center justify-center gap-2"
                        >
                          <Clock size={16} className="text-brand-green" />
                          Timer
                        </button>
                        <button 
                          onClick={() => window.print()} 
                          className="btn-primary flex-1 sm:flex-none text-xs py-2 px-4 flex items-center justify-center gap-2"
                        >
                          <Download size={16} />
                          Baixar PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Day Selector */}
                  <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {selectedPlan.days.map((day) => (
                      <button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-now800 flex items-center gap-2",
                          selectedDay === day.day
                            ? "bg-brand-green text-brand-black shadow-lg shadow-brand-green/20"
                            : "bg-brand-black text-brand-muted hover:bg-brand-border hover:text-brand-text",
                          daysWithExercises.includes(day.day) && selectedDay !== day.day && "border border-brand-green/30"
                        )}
                      >
                        {day.day}
                        {daysWithExercises.includes(day.day) && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            selectedDay === day.day ? "bg-brand-black" : "bg-brand-green"
                          )} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Exercises for selected day */}
                  <div className="space-y-4">
                    {currentDayExercises.length === 0 ? (
                      <div className="py-12 text-center text-brand-muted bg-brand-black/20 rounded-3xl border border-dashed border-brand-border">
                        <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                        <p>Nenhum exercício para {selectedDay.toLowerCase()}.</p>
                      </div>
                    ) : (
                      currentDayExercises.map((exercise, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-4 p-4 bg-brand-black/40 rounded-2xl border border-brand-border hover:border-brand-green/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand-border flex items-center justify-center text-brand-muted font-bold group-hover:bg-brand-green group-hover:text-brand-black transition-colors">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-brand-text text-lg">{exercise.name}</h5>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                              <span className="text-sm text-brand-muted flex items-center gap-1.5">
                                <Activity size={14} className="text-brand-green" />
                                <span className="font-medium text-brand-text">{exercise.sets}</span> séries
                              </span>
                              <span className="text-sm text-brand-muted flex items-center gap-1.5">
                                <ListChecks size={14} className="text-brand-green" />
                                <span className="font-medium text-brand-text">{exercise.reps}</span> reps
                              </span>
                              {exercise.restTime && (
                                <span className="text-sm text-brand-muted flex items-center gap-1.5">
                                  <Clock size={14} className="text-brand-green" />
                                  <span className="font-medium text-brand-text">{exercise.restTime}</span> descanso
                                </span>
                              )}
                            </div>
                            {exercise.notes && (
                              <div className="mt-3 p-3 bg-brand-black/60 rounded-xl border border-brand-border/50">
                                <p className="text-xs text-brand-muted italic flex items-start gap-2">
                                  <Info size={14} className="mt-0.5 text-brand-green flex-shrink-0" />
                                  {exercise.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={20} className="text-brand-border group-hover:text-brand-green transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card h-64 flex flex-col items-center justify-center text-center p-8 text-brand-muted border-2 border-dashed border-brand-border">
                <Dumbbell size={48} className="mb-4 opacity-20" />
                <p>Selecione um programa de treino para ver os detalhes.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Printable Version (Hidden on Screen) */}
      {selectedPlan && (
        <div className="print-only text-black bg-white p-8">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-black tracking-tight">{selectedPlan.name}</h1>
              <p className="text-gray-600 mt-2 font-medium">{selectedPlan.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 font-bold">
                <span className="flex items-center gap-1"><User size={16} /> {user?.name}</span>
                <span className="flex items-center gap-1"><Clock size={16}/> ~50 min</span>
                <span className="flex items-center gap-1"><ListChecks size={16}/> {selectedPlan.days.reduce((acc, d) => acc + d.exercises.length, 0)} exercícios</span>
              </div>
            </div>
            <div className="text-right">
              <Dumbbell size={48} className="text-gray-300 ml-auto" strokeWidth={1} />
              <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wide">GymPulse Training</p>
            </div>
          </div>

          <div className="space-y-8">
            {selectedPlan.days.map(day => day.exercises.length > 0 && (
              <div key={`print-${day.day}`} className="print-break-inside-avoid">
                <h2 className="text-xl font-bold border-l-4 border-black pl-3 mb-4 text-black">{day.day}</h2>
                <table className="w-full text-left border-collapse mb-8 text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-y-2 border-gray-300">
                      <th className="py-2 px-3 w-12 text-center font-bold">#</th>
                      <th className="py-2 px-3 font-bold">Exercício</th>
                      <th className="py-2 px-3 w-20 text-center font-bold">Séries</th>
                      <th className="py-2 px-3 w-20 text-center font-bold">Reps</th>
                      <th className="py-2 px-3 w-24 text-center font-bold">Descanso</th>
                      <th className="py-2 px-3 w-48 font-bold">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {day.exercises.map((exercise, idx) => (
                      <tr key={`print-ex-${idx}`}>
                        <td className="py-3 px-3 text-center font-black text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-black">{exercise.name}</td>
                        <td className="py-3 px-3 text-center">{exercise.sets}</td>
                        <td className="py-3 px-3 text-center">{exercise.reps}</td>
                        <td className="py-3 px-3 text-center text-gray-500">{exercise.restTime || '-'}</td>
                        <td className="py-3 px-3 text-gray-600 text-xs italic">{exercise.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center text-xs text-gray-400 font-medium">
            Impresso em {new Date().toLocaleDateString('pt-BR')} • GymPulse SaaS
          </div>
        </div>
      )}

      <TimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />
    </div>
  );
}
