import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  Activity, 
  Weight, 
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { TrainingPlan, EvolutionRecord } from '../types';
import { formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user, tenant } = useAuthStore();
  const [currentWorkout, setCurrentWorkout] = useState<TrainingPlan | null>(null);
  const [lastEvolution, setLastEvolution] = useState<EvolutionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !tenant) return;

    const fetchData = async () => {
      try {
        // 1. Fetch current active workout
        const workoutQuery = query(
          collection(db, 'trainingPlans'),
          where('studentUserId', '==', user.id),
          where('status', '==', 'ACTIVE'),
          where('isDeleted', '==', false),
          limit(1)
        );
        const workoutSnap = await getDocs(workoutQuery);
        if (!workoutSnap.empty) {
          setCurrentWorkout({ ...workoutSnap.docs[0].data(), id: workoutSnap.docs[0].id } as TrainingPlan);
        }

        // 2. Fetch last evolution record
        const evolutionQuery = query(
          collection(db, 'evolution_records'),
          where('studentId', '==', user.id),
          orderBy('recordedAt', 'desc'),
          limit(1)
        );
        const evolutionSnap = await getDocs(evolutionQuery);
        if (!evolutionSnap.empty) {
          setLastEvolution({ ...evolutionSnap.docs[0].data(), id: evolutionSnap.docs[0].id } as EvolutionRecord);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, tenant]);

  const getTodayWorkout = () => {
    if (!currentWorkout) return null;
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const today = days[new Date().getDay()];
    return currentWorkout.days.find(d => d.day === today);
  };

  const todayWorkout = getTodayWorkout();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-brand-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
          <p>Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Olá, {user?.name.split(' ')[0]}! 👋</h1>
        <p className="text-brand-muted">Pronto para o treino de hoje?</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Workout Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-brand-green/10 border-brand-green/20 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Dumbbell size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-brand-green mb-4">
                <Activity size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">Treino Atual</span>
              </div>
              
              {currentWorkout ? (
                <>
                  <h2 className="text-3xl font-black text-brand-text mb-2 uppercase">{currentWorkout.name}</h2>
                  <p className="text-brand-muted mb-6 max-w-md">
                    {todayWorkout && todayWorkout.exercises.length > 0 
                      ? `Hoje é ${todayWorkout.day}! Você tem ${todayWorkout.exercises.length} exercícios preparados.`
                      : 'Seu instrutor preparou este treino focado nos seus objetivos atuais. Vamos começar?'}
                  </p>
                  <Link 
                    to="/student/workouts" 
                    className="inline-flex items-center gap-2 bg-brand-green text-brand-black font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
                  >
                    Ver Exercícios <ChevronRight size={20} />
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-brand-text mb-2">Nenhum treino ativo</h2>
                  <p className="text-brand-muted mb-6">
                    Fale com seu instrutor para que ele possa prescrever seu novo treino.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="card p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center text-brand-muted">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">Frequência</p>
                <p className="text-lg font-bold text-brand-text">12 dias</p>
              </div>
            </div>
            <div className="card p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center text-brand-muted">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">Tempo Médio</p>
                <p className="text-lg font-bold text-brand-text">55 min</p>
              </div>
            </div>
            <div className="card p-4 flex flex-col items-center justify-center text-center gap-2 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center text-brand-muted">
                <Weight size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">Último Peso</p>
                <p className="text-lg font-bold text-brand-text">{lastEvolution?.weight ? `${lastEvolution.weight} kg` : '--'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Evolution Summary */}
        <div className="space-y-6">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-brand-text flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-green" />
                Sua Evolução
              </h3>
              <Link to="/student/evolution" className="text-xs text-brand-green hover:underline flex items-center gap-1">
                Ver tudo <ArrowUpRight size={12} />
              </Link>
            </div>

            {lastEvolution ? (
              <div className="space-y-6 flex-1">
                <div className="p-4 bg-brand-black/40 rounded-xl border border-brand-border">
                  <p className="text-xs text-brand-muted mb-1">Última avaliação em {formatDate(lastEvolution.recordedAt)}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-[10px] uppercase text-brand-muted">Peso</p>
                      <p className="text-xl font-bold text-brand-text">{lastEvolution.weight}kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-brand-muted">Gordura</p>
                      <p className="text-xl font-bold text-brand-text">{lastEvolution.bodyFatPercent}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Medidas Principais</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-brand-muted">Braço (D)</span>
                      <span className="text-brand-text font-medium">{lastEvolution.measurements.rightArm}cm</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-brand-muted">Cintura</span>
                      <span className="text-brand-text font-medium">{lastEvolution.measurements.waist}cm</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-brand-muted">Coxa (D)</span>
                      <span className="text-brand-text font-medium">{lastEvolution.measurements.rightThigh}cm</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-brand-black/20 rounded-xl border border-dashed border-brand-border">
                <TrendingUp size={40} className="text-brand-border mb-4" />
                <p className="text-sm text-brand-muted">Nenhuma avaliação física registrada ainda.</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-brand-border">
              <p className="text-xs text-brand-muted italic">
                "O único treino ruim é aquele que não aconteceu."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
