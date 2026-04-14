import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Weight, Activity, ArrowUp, ArrowDown, Minus, Utensils, Clock } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { EvolutionRecord, DietPlan } from '../types';
import { formatDate } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentEvolution() {
  const { user, tenant, student } = useAuthStore();
  const [records, setRecords] = useState<EvolutionRecord[]>([]);
  const [currentDiet, setCurrentDiet] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'evolution';

  useEffect(() => {
    if (!user || !tenant || !student) return;

    const fetchRecords = async () => {
      try {
        const q = query(
          collection(db, 'evolution_records'),
          where('studentId', '==', student.id),
          orderBy('recordedAt', 'asc')
        );
        const snap = await getDocs(q);
        const recordsData = snap.docs
          .map(doc => ({ ...doc.data(), id: doc.id } as EvolutionRecord))
          .filter(record => (record as any).isDeleted !== true);
        setRecords(recordsData);

        // 2. Fetch current diet plan
        const dietQuery = query(
          collection(db, 'diet_plans'),
          where('studentId', '==', student.id),
          orderBy('createdAt', 'desc')
        );
        const dietSnap = await getDocs(dietQuery);
        const dietDocs = dietSnap.docs
          .map(doc => ({ ...doc.data(), id: doc.id } as DietPlan))
          .filter(plan => (plan as any).isDeleted !== true);
          
        if (dietDocs.length > 0) {
          setCurrentDiet(dietDocs[0]);
        }
      } catch (error) {
        console.error('Error fetching evolution/nutrition data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user, tenant, student]);

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
    if (diff > 0) return { val: diff.toFixed(1), Icon: ArrowUp, color: 'text-red-500' };
    if (diff < 0) return { val: Math.abs(diff).toFixed(1), Icon: ArrowDown, color: 'text-brand-green' };
    return { val: '0', Icon: Minus, color: 'text-brand-muted' };
  };

  const downloadDietPDF = () => {
    try {
      if (!currentDiet || !user) {
        toast.error('Dados da dieta não carregados.');
        return;
      }
      
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
      doc.text(`Aluno: ${user.name}`, 20, 35);
      doc.text(`Data: ${formatDate(currentDiet.updatedAt)}`, pageWidth - 60, 35);

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text(`Meta Diária: ${currentDiet.mealsPerDay} Refeições`, 20, 55);

      // Meals Table
      let startY = 65;
      
      const sortedMeals = [...(currentDiet.meals || [])].sort((a, b) => a.time.localeCompare(b.time));
      
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
        
        // Check for page overflow
        if (startY > 250 && index < sortedMeals.length - 1) {
          doc.addPage();
          startY = 20;
        }
      });

      doc.save(`Dieta_${user.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF da Dieta gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF da dieta.');
    }
  };

  const downloadEvolutionPDF = () => {
    try {
      if (records.length === 0 || !user) {
        toast.error('Histórico de evolução não encontrado.');
        return;
      }
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('GYMPULSE - Histórico de Evolução', 20, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Aluno: ${user.name}`, 20, 35);

      // Table
      const tableData = [...records].reverse().map(record => [
        formatDate(record.recordedAt),
        `${record.weight || '--'}kg`,
        `${record.bodyFatPercent || '--'}%`,
        `${record.muscleMassPercent || '--'}%`,
        `${record.measurements?.chest || '--'}cm`,
        `${record.measurements?.waist || '--'}cm`,
        `${record.measurements?.hips || '--'}cm`,
        `${record.measurements?.rightArm || '-'}/${record.measurements?.leftArm || '-'}`,
        `${record.measurements?.rightThigh || '-'}/${record.measurements?.leftThigh || '-'}`
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['Data', 'Peso', 'Gordura %', 'Massa %', 'Tórax', 'Cintura', 'Quadril', 'Braços (D/E)', 'Coxas (D/E)']],
        body: tableData,
        headStyles: { fillColor: [0, 255, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
        theme: 'striped',
        margin: { left: 10, right: 10 },
        styles: { fontSize: 8 }
      });

      doc.save(`Evolucao_${user.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF da Evolução gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF da evolução.');
    }
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Sua Evolução</h1>
          <p className="text-brand-muted">Acompanhe seus resultados físicos e planos nutricionais</p>
        </div>
        {activeTab === 'evolution' && records.length > 0 && (
          <button 
            onClick={downloadEvolutionPDF}
            className="btn-secondary flex items-center gap-2 py-2 text-xs"
          >
            <FileDown size={16} />
            Baixar Evolução
          </button>
        )}
        {activeTab === 'nutrition' && currentDiet && (
          <button 
            onClick={downloadDietPDF}
            className="btn-primary flex items-center gap-2 py-2 text-xs"
          >
            <FileDown size={16} />
            Baixar Dieta PDF
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-brand-black/50 rounded-xl w-fit border border-brand-border mb-6">
        <button
          onClick={() => setSearchParams({ tab: 'evolution' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'evolution' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Activity size={16} />
          Evolução Física
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'nutrition' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'nutrition' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Utensils size={16} />
          Plano Nutricional
        </button>
      </div>

      {activeTab === 'evolution' && records.length === 0 && (
        <div className="card p-12 text-center text-brand-muted flex flex-col items-center justify-center gap-4">
          <TrendingUp size={48} className="opacity-20" />
          <p>Nenhuma avaliação física registrada ainda.</p>
          <p className="text-xs">Fale com seu instrutor para realizar sua primeira avaliação.</p>
        </div>
      )}

      {activeTab === 'evolution' && records.length > 0 && (
        <React.Fragment>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Weight size={18} />
                </div>
                {lastRecord && previousRecord && (
                  <div className={`flex items-center gap-0.5 text-xs font-bold ${getDiff(lastRecord.weight, previousRecord.weight)?.color}`}>
                    {(() => {
                      const diff = getDiff(lastRecord.weight, previousRecord.weight);
                      if (!diff) return null;
                      const { Icon } = diff;
                      return <Icon size={12} />;
                    })()}
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
                    {(() => {
                      const diff = getDiff(lastRecord.bodyFatPercent, previousRecord.bodyFatPercent);
                      if (!diff) return null;
                      const { Icon } = diff;
                      return <Icon size={12} />;
                    })()}
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
                  <Activity size={18} />
                </div>
                {lastRecord && previousRecord && (
                  <div className={`flex items-center gap-0.5 text-xs font-bold ${getDiff(lastRecord.muscleMassPercent, previousRecord.muscleMassPercent)?.color}`}>
                    {(() => {
                      const diff = getDiff(lastRecord.muscleMassPercent, previousRecord.muscleMassPercent);
                      if (!diff) return null;
                      const { Icon } = diff;
                      return <Icon size={12} />;
                    })()}
                    {getDiff(lastRecord.muscleMassPercent, previousRecord.muscleMassPercent)?.val}%
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">Massa Muscular</p>
                <p className="text-2xl font-bold text-brand-text">{lastRecord.muscleMassPercent || '--'}%</p>
              </div>
            </div>

            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Calendar size={18} />
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-muted">IMC (Altura: {lastRecord.height || '--'}cm)</p>
                <p className="text-2xl font-bold text-brand-text">
                  {lastRecord.weight && lastRecord.height 
                    ? (lastRecord.weight / ((lastRecord.height/100) * (lastRecord.height/100))).toFixed(1) 
                    : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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

          <div className="card p-6 mt-6">
            <h3 className="font-bold text-brand-text mb-6">Histórico de Medidas (cm)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-black/50 border-b border-brand-border">
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Peso</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">BF %</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Massa %</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Tórax</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Cintura</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Quadril</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Braço D/E</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Coxa D/E</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Pant. D/E</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {[...records].reverse().map((record) => (
                    <tr key={record.id} className="hover:bg-brand-black/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-brand-text font-medium">{formatDate(record.recordedAt)}</td>
                      <td className="px-4 py-3 text-sm text-brand-text text-center">{record.weight || '--'}kg</td>
                      <td className="px-4 py-3 text-sm text-red-400 text-center">{record.bodyFatPercent || '--'}%</td>
                      <td className="px-4 py-3 text-sm text-brand-green text-center">{record.muscleMassPercent || '--'}%</td>
                      <td className="px-4 py-3 text-sm text-brand-muted text-center">{record.measurements?.chest || '--'}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted text-center">{record.measurements?.waist || '--'}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted text-center">{record.measurements?.hips || '--'}</td>
                      <td className="px-4 py-3 text-sm text-brand-muted text-center">
                        {record.measurements?.rightArm || '--'} / {record.measurements?.leftArm || '--'}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-muted text-center">
                        {record.measurements?.rightThigh || '--'} / {record.measurements?.leftThigh || '--'}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-muted text-center">
                        {record.measurements?.rightCalf || '--'} / {record.measurements?.leftCalf || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </React.Fragment>
      )}

      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          <div className="card p-6 border-brand-green/20 bg-brand-green/5">
            <h3 className="text-xl font-bold text-brand-text mb-2 flex items-center gap-2">
              <Utensils className="text-brand-green" size={24} />
              Seu Plano Alimentar
            </h3>
            {currentDiet ? (
              <p className="text-brand-muted">Última atualização em {formatDate(currentDiet.updatedAt)}</p>
            ) : (
              <p className="text-brand-muted text-sm italic">Nenhuma dieta prescrita até o momento.</p>
            )}
          </div>

          {currentDiet && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <div className="card p-6 text-center bg-brand-green/10 border-brand-green/20">
                    <p className="text-xs uppercase tracking-widest text-brand-muted font-bold mb-2">Refeições p/ Dia</p>
                    <p className="text-4xl font-black text-brand-green">{currentDiet.mealsPerDay}</p>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-6">
                  {(currentDiet.meals || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((meal) => (
                    <div key={meal.id} className="card p-0 overflow-hidden border-brand-border/60">
                      <div className="p-4 bg-brand-black/40 border-b border-brand-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                            <Utensils size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-text">{meal.name}</h4>
                            <div className="flex items-center gap-1 text-[10px] text-brand-muted uppercase font-bold tracking-wider">
                              <Clock size={10} />
                              {meal.time}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-brand-border rounded-lg text-[10px] font-bold text-brand-muted uppercase">
                          {meal.foods?.length || 0} itens
                        </span>
                      </div>
                      <div className="divide-y divide-brand-border/30">
                        {(meal.foods || []).map((food) => (
                          <div key={food.id} className="p-4 flex items-center justify-between hover:bg-brand-black/20 transition-colors">
                            <span className="text-sm text-brand-text font-medium">{food.name}</span>
                            <span className="px-3 py-1 bg-brand-border/50 rounded-lg text-xs font-bold text-brand-muted">
                              {food.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
