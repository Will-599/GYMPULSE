import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Exercise } from '../types';

interface ExerciseFormProps {
  exercises: Exercise[];
  onChange: (exercises: Exercise[]) => void;
}

export default function ExerciseForm({ exercises, onChange }: ExerciseFormProps) {
  const addExercise = () => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: '',
      sets: 3,
      reps: '12',
      restTime: '60s',
      notes: ''
    };
    onChange([...exercises, newExercise]);
  };

  const removeExercise = (id: string) => {
    onChange(exercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    onChange(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-brand-text uppercase tracking-wider">Exercícios do Dia</h4>
        <button
          type="button"
          onClick={addExercise}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>

      {exercises.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-brand-border rounded-2xl text-center">
          <p className="text-sm text-brand-muted">Nenhum exercício adicionado para este dia.</p>
          <button
            type="button"
            onClick={addExercise}
            className="text-brand-green hover:underline text-xs mt-2 font-medium"
          >
            Clique aqui para adicionar o primeiro
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <div 
              key={exercise.id}
              className="p-4 bg-brand-black border border-brand-border rounded-2xl group hover:border-brand-green/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="pt-2 text-brand-muted group-hover:text-brand-green transition-colors cursor-grab active:cursor-grabbing">
                  <GripVertical size={18} />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Nome do Exercício</label>
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                        className="input-field w-full py-2 text-sm"
                        placeholder="Ex: Supino Reto"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      className="p-2 mt-5 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Séries</label>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                        className="input-field w-full py-2 text-sm"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Reps</label>
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                        className="input-field w-full py-2 text-sm"
                        placeholder="Ex: 12 ou 10-12"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Descanso</label>
                      <input
                        type="text"
                        value={exercise.restTime}
                        onChange={(e) => updateExercise(exercise.id, 'restTime', e.target.value)}
                        className="input-field w-full py-2 text-sm"
                        placeholder="Ex: 60s"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
