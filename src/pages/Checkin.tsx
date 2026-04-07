import React, { useState } from 'react';
import { CalendarCheck, Search, QrCode, Clock, CheckCircle2, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useStudentStore } from '../store/studentStore';
import { useCheckinStore } from '../store/checkinStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QrScanner from '../components/QrScanner';

export default function Checkin() {
  const { tenant } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();
  const { checkins, loading, fetchTodayCheckins, addCheckin } = useCheckinStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [validating, setValidating] = useState(false);

  React.useEffect(() => {
    if (tenant) {
      const unsubCheckins = fetchTodayCheckins(tenant.id);
      const unsubStudents = fetchStudents(tenant.id);
      return () => {
        unsubCheckins();
        unsubStudents();
      };
    }
  }, [tenant, fetchTodayCheckins, fetchStudents]);

  const validateAndCheckinLocal = async (studentIdOrAccessId: string, isFromQr = false) => {
    if (!tenant) return;
    setValidating(true);
    const success = await useCheckinStore.getState().validateAndCheckin(
      tenant.id, 
      studentIdOrAccessId, 
      students, 
      isFromQr ? 'QR_CODE' : 'MANUAL'
    );
    if (success) {
      setSearchTerm('');
      setIsScannerOpen(false);
    }
    setValidating(false);
  };

  const handleManualCheckin = () => {
    if (!searchTerm) {
      toast.error('Informe o CPF ou Matrícula');
      return;
    }
    validateAndCheckinLocal(searchTerm, false);
  };

  const handleQrSuccess = (decodedText: string) => {
    validateAndCheckinLocal(decodedText, true);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Check-in</h1>
          <p className="text-brand-muted">Controle de entrada e frequência dos alunos</p>
        </div>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <QrCode size={20} />
          Escanear QR Code
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Check-in Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h3 className="font-bold text-brand-text mb-6 flex items-center gap-2">
              <CalendarCheck size={18} className="text-brand-green" />
              Check-in Manual
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-muted mb-2">CPF ou Matrícula</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    className="input-field w-full pl-10"
                    placeholder="000.000.000-00 ou ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualCheckin()}
                  />
                </div>
              </div>
              <button 
                onClick={handleManualCheckin}
                disabled={validating}
                className="btn-primary w-full disabled:opacity-50"
              >
                {validating ? 'Validando...' : 'Confirmar Entrada'}
              </button>
            </div>
          </div>

          <div className="card bg-brand-green/5 border-brand-green/20">
            <h3 className="font-bold text-brand-text mb-2">Dica de Uso</h3>
            <p className="text-sm text-brand-muted">
              Alunos podem apresentar o QR Code disponível no painel deles para liberação instantânea.
            </p>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="font-bold text-brand-text mb-6 flex items-center gap-2">
              <Clock size={18} className="text-brand-green" />
              Frequência de Hoje
            </h3>
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-brand-muted py-8 italic">Carregando frequência...</p>
              ) : checkins.length === 0 ? (
                <p className="text-center text-brand-muted py-8 italic">Nenhum check-in realizado hoje.</p>
              ) : (
                checkins.map((checkin) => {
                  const student = students.find(s => s.id === checkin.studentId);
                  const checkinDate = typeof checkin.checkinAt?.toDate === 'function' ? checkin.checkinAt.toDate() : new Date(checkin.checkinAt);
                  
                  return (
                    <motion.div 
                      key={checkin.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-brand-border bg-brand-black/30 group hover:border-brand-green/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand-border flex items-center justify-center text-brand-muted overflow-hidden border border-brand-border">
                          {student?.photoUrl ? (
                            <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <CalendarCheck size={24} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-text">{student?.name || 'Carregando...'}</p>
                          <p className="text-xs text-brand-muted">
                            {student?.planId || 'Plano'} • Entrada às {format(checkinDate, 'HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
                          <CheckCircle2 size={14} />
                          Autorizado
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-brand-dark w-full max-w-lg rounded-3xl border border-brand-border p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
                    <QrCode className="text-brand-green" size={24} />
                    Escanear Aluno
                  </h3>
                  <p className="text-xs text-brand-muted">Aponte a câmera para o QR Code do aluno</p>
                </div>
                <button 
                  onClick={() => setIsScannerOpen(false)}
                  className="p-2 text-brand-muted hover:text-brand-text transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <QrScanner 
                onScanSuccess={handleQrSuccess}
                onScanError={(err) => console.log(err)}
              />

              <div className="mt-6 p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl text-center">
                <p className="text-xs text-brand-green font-medium">
                  A liberação ocorrerá automaticamente após a leitura bem-sucedida.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
