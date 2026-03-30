import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Weight, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { EvolutionRecord } from '../types';
import { formatDate } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function StudentEvolution() {
  const { user, tenant } = useAuthStore();
  const [records, setRecords] = useState<EvolutionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !tenant) return;

    const fetchRecords = async () => {
      try {
        const q = query(
          collection(db, 'evolution_records'),
          where('studentId', '==', user.id),
          orderBy('recordedAt', 'asc')
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

    fetchRecords();
  }, [user, tenant]);

  const chartData = records.map(record => ({
    date: formatDate(record.recordedAt),
    weight: record.weight,
    bodyFat: record.bodyFatPercent,
    muscleMass: record.muscleMassPercent,
  }));

  const lastRecord = records[records.length - 1];
  const previousRecord = records[records.length - 2];

  const getDiff = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined || previous === undefined) return null;
    const diff = current - previous;
    if (diff > 0) return { val: diff.toFixed(1), icon: ArrowUp, color: 'text-red-500' };
    if (diff < 0) return { val: Math.abs(diff).toFixed(1), icon: ArrowDown, color: 'text-brand-green' };
    return { val: '0', icon: Minus, color: 'text-brand-muted' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-brand-muted">
        Carregando sua evolução...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-text">Sua Evolução</h1>
        <p className="text-brand-muted">Acompanhe seus resultados ao longo do tempo</p>
      </header>

      {records.length === 0 ? (
        <div className="card p-12 text-center text-brand-muted flex flex-col items-center justify-center gap-4">
          <TrendingUp size={48} className="opacity-20" />
          <p>Nenhuma avaliação física registrada ainda.</p>
          <p className="text-xs">Fale com seu instrutor para realizar sua primeira avaliação.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Weight size={18} />
                </div>
                {lastRecord && previousRecord && (
                  <div className={`flex items-center gap-0.5 text-xs font-bold ${getDiff(lastRecord.weight, previousRecord.weight)?.color}`}>
                    {React.createElement(getDiff(lastRecord.weight, previousRecord.weight)!.icon, { size: 12 })}
                    {getDiff(lastRecord.weight, previousRecord.weight)?.val}kg
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">Peso Atual</p>
                <p className="text-2xl font-bold text-brand-text">{lastRecord.weight}kg</p>
              </div>
            </div>

            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Activity size={18} />
                </div>
                {lastRecord && previousRecord && (
                  <div className={`flex items-center gap-0.5 text-xs font-bold ${getDiff(lastRecord.bodyFatPercent, previousRecord.bodyFatPercent)?.color}`}>
                    {React.createElement(getDiff(lastRecord.bodyFatPercent, previousRecord.bodyFatPercent)!.icon, { size: 12 })}
                    {getDiff(lastRecord.bodyFatPercent, previousRecord.bodyFatPercent)?.val}%
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">Gordura Corporal</p>
                <p className="text-2xl font-bold text-brand-text">{lastRecord.bodyFatPercent}%</p>
              </div>
            </div>

            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <TrendingUp size={18} />
                </div>
                {lastRecord && previousRecord && (
                  <div className={`flex items-center gap-0.5 text-xs font-bold ${getDiff(lastRecord.muscleMassPercent, previousRecord.muscleMassPercent)?.color}`}>
                    {React.createElement(getDiff(lastRecord.muscleMassPercent, previousRecord.muscleMassPercent)!.icon, { size: 12 })}
                    {getDiff(lastRecord.muscleMassPercent, previousRecord.muscleMassPercent)?.val}%
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">Massa Muscular</p>
                <p className="text-2xl font-bold text-brand-text">{lastRecord.muscleMassPercent}%</p>
              </div>
            </div>

            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Calendar size={18} />
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">Última Avaliação</p>
                <p className="text-2xl font-bold text-brand-text">{formatDate(lastRecord.recordedAt)}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-brand-text mb-6">Evolução do Peso (kg)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#00FF00' }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#00FF00" fillOpacity={1} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-brand-text mb-6">Gordura vs Massa Muscular (%)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="bodyFat" name="Gordura" stroke="#EF4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="muscleMass" name="Massa Muscular" stroke="#00FF00" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Measurements */}
          <div className="card p-6">
            <h3 className="font-bold text-brand-text mb-6">Histórico de Medidas (cm)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-black/50 border-b border-brand-border">
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider">Peito</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider">Cintura</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider">Quadril</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider">Braço (D)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider">Coxa (D)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider">Panturrilha (D)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {[...records].reverse().map((record) => (
                    <tr key={record.id} className="hover:bg-brand-black/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-brand-text font-medium">{formatDate(record.recordedAt)}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted">{record.measurements.chest || '--'}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted">{record.measurements.waist || '--'}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted">{record.measurements.hips || '--'}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted">{record.measurements.rightArm || '--'}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted">{record.measurements.rightThigh || '--'}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted">{record.measurements.rightCalf || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
