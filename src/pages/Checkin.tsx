import React from 'react';
import { CalendarCheck, Search, QrCode, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Checkin() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Check-in</h1>
          <p className="text-brand-muted">Controle de entrada e frequência dos alunos</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
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
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <button className="btn-primary w-full">Confirmar Entrada</button>
            </div>
          </div>

          <div className="card bg-brand-green/5 border-brand-green/20">
            <h3 className="font-bold text-brand-text mb-2">Dica de Uso</h3>
            <p className="text-sm text-brand-muted">
              Alunos podem fazer check-in via aplicativo escaneando o QR Code na recepção.
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
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-brand-border bg-brand-black/30 group hover:border-brand-green/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-border flex items-center justify-center text-brand-muted overflow-hidden">
                      <CalendarCheck size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-text">Aluno Exemplo {i}</p>
                      <p className="text-xs text-brand-muted">Plano Black • Entrada às 14:3{i}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-500 flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      Autorizado
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-sm text-brand-muted hover:text-brand-green transition-colors font-medium">
              Ver histórico completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
