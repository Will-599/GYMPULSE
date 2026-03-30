import React from 'react';
import { cn } from '../lib/utils';

const DAYS = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
];

interface CalendarWeekProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  daysWithExercises: string[];
}

export default function CalendarWeek({ selectedDay, onSelectDay, daysWithExercises }: CalendarWeekProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map((day) => {
        const hasExercises = daysWithExercises.includes(day);
        const isSelected = selectedDay === day;

        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay(day)}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-all relative",
              isSelected 
                ? "bg-brand-green border-brand-green text-brand-black shadow-lg shadow-brand-green/20" 
                : "bg-brand-black border-brand-border text-brand-muted hover:border-brand-green/50 hover:text-brand-text"
            )}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider mb-1">
              {day.substring(0, 3)}
            </span>
            <span className="text-xs font-medium">{day === 'Sábado' || day === 'Domingo' ? day.substring(0, 3) : day.substring(0, 3)}</span>
            
            {hasExercises && !isSelected && (
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-green" />
            )}
          </button>
        );
      })}
    </div>
  );
}
