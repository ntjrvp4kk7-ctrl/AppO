import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Coffee, AlertTriangle, ShieldCheck, ChevronDown } from 'lucide-react';
import { TimeSection } from '../types/worklog';
import { calculateHours } from '../utils/dateUtils';

interface TimeSectionEditorProps {
  time: TimeSection;
  safetyCheckCompleted: boolean;
  onTimeChange: (updated: TimeSection) => void;
  onSafetyCheckChange: (completed: boolean) => void;
}

const LABOR_CATEGORIES: TimeSection['laborCategory'][] = [
  'Regular Service',
  'Scheduled Maintenance',
  'Emergency Repair',
  'Installation',
  'Inspection',
  'Travel',
];

export const TimeSectionEditor: React.FC<TimeSectionEditorProps> = ({
  time,
  safetyCheckCompleted,
  onTimeChange,
  onSafetyCheckChange,
}) => {
  // Live timer tick for active shift
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    if (!time.isClockRunning) return;
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [time.isClockRunning]);

  const handleStartChange = (newStart: string) => {
    const calc = calculateHours(newStart, time.endTime, time.breakMinutes);
    onTimeChange({
      ...time,
      startTime: newStart,
      totalHours: calc.totalHours,
      overtimeHours: calc.overtimeHours,
    });
  };

  const handleEndChange = (newEnd: string) => {
    const calc = calculateHours(time.startTime, newEnd, time.breakMinutes);
    onTimeChange({
      ...time,
      endTime: newEnd,
      totalHours: calc.totalHours,
      overtimeHours: calc.overtimeHours,
    });
  };

  const handleBreakChange = (mins: number) => {
    const calc = calculateHours(time.startTime, time.endTime, mins);
    onTimeChange({
      ...time,
      breakMinutes: mins,
      totalHours: calc.totalHours,
      overtimeHours: calc.overtimeHours,
    });
  };

  const handleCategoryChange = (category: TimeSection['laborCategory']) => {
    onTimeChange({
      ...time,
      laborCategory: category,
    });
  };

  // Quick "Clock In Now"
  const handleClockInNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentClockTime = `${hh}:${mm}`;

    onTimeChange({
      ...time,
      startTime: currentClockTime,
      isClockRunning: true,
      clockInTimestamp: Date.now(),
    });
  };

  // Quick "Clock Out Now"
  const handleClockOutNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentClockTime = `${hh}:${mm}`;
    const calc = calculateHours(time.startTime, currentClockTime, time.breakMinutes);

    onTimeChange({
      ...time,
      endTime: currentClockTime,
      isClockRunning: false,
      totalHours: calc.totalHours,
      overtimeHours: calc.overtimeHours,
    });
  };

  // Live elapsed time string if clock is ticking
  let elapsedStr = '';
  if (time.isClockRunning && time.clockInTimestamp) {
    const diffSec = Math.max(0, Math.floor((nowTimestamp - time.clockInTimestamp) / 1000));
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    elapsedStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const regularHours = Math.min(8, time.totalHours);
  const overtimeHours = time.overtimeHours;

  return (
    <div className="bg-neutral-900 border border-neutral-800/90 rounded-2xl p-4 space-y-4">
      {/* Header and Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-100">Work Hours & Time</h3>
            <p className="text-xs text-neutral-400">Shift duration, breaks & overtime</p>
          </div>
        </div>

        {/* Live Clock Button or Indicator */}
        {time.isClockRunning ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-mono font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {elapsedStr || 'Running'}
            </span>
            <button
              type="button"
              onClick={handleClockOutNow}
              className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
              Clock Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClockInNow}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 rounded-xl text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Clock In Now</span>
          </button>
        )}
      </div>

      {/* Start / End Time inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
            Start Time
          </label>
          <div className="relative">
            <input
              type="time"
              value={time.startTime}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 font-mono-numbers focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
            End Time
          </label>
          <div className="relative">
            <input
              type="time"
              value={time.endTime}
              onChange={(e) => handleEndChange(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 font-mono-numbers focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Break Deduction */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-neutral-500" />
            Unpaid Break / Lunch
          </label>
          <span className="text-xs text-neutral-400 font-mono-numbers">
            {time.breakMinutes} min deducted
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 15, 30, 45, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleBreakChange(mins)}
              className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                time.breakMinutes === mins
                  ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500 shadow-sm'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {mins === 0 ? 'None' : `${mins}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Labor Category */}
      <div>
        <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
          Labor Activity Type
        </label>
        <div className="relative">
          <select
            value={time.laborCategory}
            onChange={(e) => handleCategoryChange(e.target.value as TimeSection['laborCategory'])}
            className="w-full appearance-none bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            {LABOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-neutral-500 pointer-events-none" />
        </div>
      </div>

      {/* Calculated Hours Display Cards */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-center">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
            Total Net
          </span>
          <span className="text-base font-extrabold text-white font-mono-numbers">
            {time.totalHours.toFixed(1)} <span className="text-xs font-normal text-neutral-400">hrs</span>
          </span>
        </div>

        <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-center">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
            Regular
          </span>
          <span className="text-base font-bold text-neutral-200 font-mono-numbers">
            {regularHours.toFixed(1)} <span className="text-xs font-normal text-neutral-400">hrs</span>
          </span>
        </div>

        <div className={`p-2.5 rounded-xl text-center border transition-colors ${
          overtimeHours > 0 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
            : 'bg-neutral-950 border-neutral-800 text-neutral-500'
        }`}>
          <span className="text-[10px] block uppercase font-bold tracking-wider">
            Overtime
          </span>
          <span className="text-base font-bold font-mono-numbers">
            {overtimeHours.toFixed(1)} <span className="text-xs font-normal">hrs</span>
          </span>
        </div>
      </div>

      {/* Safety Check Confirmation */}
      <div
        onClick={() => onSafetyCheckChange(!safetyCheckCompleted)}
        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
          safetyCheckCompleted
            ? 'bg-emerald-950/20 border-emerald-500/30 text-neutral-200'
            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck className={`w-4 h-4 ${safetyCheckCompleted ? 'text-emerald-400' : 'text-neutral-500'}`} />
          <div>
            <p className="text-xs font-semibold text-neutral-200">Pre-Task Safety Assessment</p>
            <p className="text-[11px] text-neutral-500">PPE worn, LOTO verified, hazard survey complete</p>
          </div>
        </div>
        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
          safetyCheckCompleted ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-neutral-700 bg-neutral-900'
        }`}>
          {safetyCheckCompleted && <span className="text-xs font-bold">✓</span>}
        </div>
      </div>
    </div>
  );
};
