import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimerModal({ isOpen, onClose }: TimerModalProps) {
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'rest'>('stopwatch');
  
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  // Rest timer state
  const [restTime, setRestTime] = useState(60); // default 60s
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [restInput, setRestInput] = useState('60');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRestRunning && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => prev - 1);
      }, 1000);
    } else if (restTime === 0) {
      setIsRestRunning(false);
      // Play a sound if possible or vibrate
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [isRestRunning, restTime]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartRest = () => {
    const parsed = parseInt(restInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setRestTime(parsed);
      setIsRestRunning(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          className="relative w-full max-w-sm bg-brand-dark border border-brand-border rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
              <Clock className="text-brand-green" size={20} />
              Cronômetro
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-brand-border text-brand-muted transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex gap-2 p-1 bg-brand-black/50 rounded-xl mb-6 border border-brand-border">
              <button
                onClick={() => setActiveTab('stopwatch')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'stopwatch' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                Tempo de Treino
              </button>
              <button
                onClick={() => setActiveTab('rest')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'rest' ? 'bg-brand-green text-brand-black' : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                Descanso
              </button>
            </div>

            {activeTab === 'stopwatch' ? (
              <div className="flex flex-col items-center">
                <div className="text-6xl font-black text-brand-text mb-8 tracking-tighter">
                  {formatTime(stopwatchTime)}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                    className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center text-brand-black hover:scale-105 transition-transform shadow-lg shadow-brand-green/20"
                  >
                    {isStopwatchRunning ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsStopwatchRunning(false);
                      setStopwatchTime(0);
                    }}
                    className="w-12 h-12 rounded-full bg-brand-border flex items-center justify-center text-brand-text hover:bg-brand-black transition-colors"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-6xl font-black text-brand-text mb-6 tracking-tighter">
                  {formatTime(restTime)}
                </div>
                
                {!isRestRunning && restTime === 0 && (
                  <p className="text-brand-green font-bold mb-4 animate-pulse uppercase tracking-wider text-sm">Tempo Esgotado!</p>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => {
                      if (!isRestRunning && restTime > 0) setIsRestRunning(true);
                      else setIsRestRunning(!isRestRunning);
                    }}
                    className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center text-brand-black hover:scale-105 transition-transform shadow-lg shadow-brand-green/20"
                  >
                    {isRestRunning ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsRestRunning(false);
                      handleStartRest();
                    }}
                    className="w-12 h-12 rounded-full bg-brand-border flex items-center justify-center text-brand-text hover:bg-brand-black transition-colors"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>

                <div className="w-full">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2 text-center">Ajustar Descanso (seg)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={restInput}
                      onChange={(e) => setRestInput(e.target.value)}
                      className="input-field flex-1 text-center font-bold text-lg"
                    />
                    <button 
                      onClick={() => {
                        setIsRestRunning(false);
                        handleStartRest();
                      }}
                      className="btn-secondary whitespace-nowrap"
                    >
                      Definir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
