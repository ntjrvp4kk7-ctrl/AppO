import React from 'react';
import { Clock } from 'lucide-react';
import { TimeSection } from '../types/worklog';
import { calculateHours } from '../utils/dateUtils';

interface TimeSectionEditorProps {
  time: TimeSection;
  onTimeChange: (updated: TimeSection) => void;
}

export const TimeSectionEditor: React.FC<TimeSectionEditorProps> = ({
  time,
  onTimeChange,
}) => {
  const handleStartChange = (newStart: string) => {
    const calc = calculateHours(newStart, time.endTime, time.lunchDeductionMinutes);
    onTimeChange({
      ...time,
      startTime: newStart,
      totalHours: calc.totalHours,
      overtimeHours: calc.overtimeHours,
    });
  };

  const handleEndChange = (newEnd: string) => {
    const calc = calculateHours(time.startTime, newEnd, time.lunchDeductionMinutes);
    onTimeChange({
      ...time,
      endTime: newEnd,
      totalHours: calc.totalHours,
      overtimeHours: calc.overtimeHours,
    });
  };

  const handleLunchToggle = (minutes: number) => {
    const calc = calculateHours(time.startTime, time.endTime, minutes);
    onTimeChange({
      ...time,
      lunchDeductionMinutes: minutes,
      totalHours: calc.totalHours,
      overtimeHours: calc.overtimeHours,
    });
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Today's Hours</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-white font-mono-numbers">
            {time.totalHours.toFixed(1)} <span className="text-xs font-normal text-zinc-400">hrs</span>
          </span>
          {time.overtimeHours > 0 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
              +{time.overtimeHours.toFixed(1)} OT
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">Clock In</label>
          <input
            type="time"
            value={time.startTime}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">Clock Out</label>
          <input
            type="time"
            value={time.endTime}
            onChange={(e) => handleEndChange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Lunch deduction pill toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-xs">
        <span className="text-zinc-400 text-[11px]">Lunch Break</span>
        <div className="flex items-center gap-1">
          {[0, 30, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleLunchToggle(mins)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                time.lunchDeductionMinutes === mins
                  ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {mins === 0 ? 'No Break' : `${mins}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
