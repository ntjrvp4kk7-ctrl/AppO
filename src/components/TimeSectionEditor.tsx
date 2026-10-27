import React from 'react';
import { Clock, Coffee, Sparkles } from 'lucide-react';
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
    <div className="space-y-1.5">
      {/* iOS Group Header Caption */}
      <div className="flex items-center justify-between px-4">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8e8e93]">
          Shift Hours & Break
        </span>
        <span className="text-[12px] text-[#8e8e93] font-mono-numbers">
          30m auto-deducted
        </span>
      </div>

      {/* iOS Inset Grouped Card */}
      <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 overflow-hidden divide-y divide-[#38383a]/40 shadow-sm">
        {/* Row 1: Clock In */}
        <div className="flex items-center justify-between px-4 py-3 min-h-[50px]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[7px] bg-[#30d158] text-black flex items-center justify-center font-bold shadow-sm">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[15px] font-medium text-white">Clock In</span>
          </div>

          <div className="relative">
            <input
              type="time"
              value={time.startTime}
              onChange={(e) => handleStartChange(e.target.value)}
              className="bg-[#2c2c2e] hover:bg-[#38383a] text-[#0a84ff] font-semibold text-[15px] px-3 py-1.5 rounded-[9px] border border-[#3a3a3c] font-mono-numbers focus:outline-none focus:ring-2 focus:ring-[#0a84ff]/50 cursor-pointer transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Clock Out */}
        <div className="flex items-center justify-between px-4 py-3 min-h-[50px]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[7px] bg-[#ff9f0a] text-black flex items-center justify-center font-bold shadow-sm">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[15px] font-medium text-white">Clock Out</span>
          </div>

          <div className="relative">
            <input
              type="time"
              value={time.endTime}
              onChange={(e) => handleEndChange(e.target.value)}
              className="bg-[#2c2c2e] hover:bg-[#38383a] text-[#0a84ff] font-semibold text-[15px] px-3 py-1.5 rounded-[9px] border border-[#3a3a3c] font-mono-numbers focus:outline-none focus:ring-2 focus:ring-[#0a84ff]/50 cursor-pointer transition-colors"
            />
          </div>
        </div>

        {/* Row 3: Lunch Break (iOS Segmented Control) */}
        <div className="flex items-center justify-between px-4 py-3 min-h-[50px]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[7px] bg-[#5856d6] text-white flex items-center justify-center font-bold shadow-sm">
              <Coffee className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-[15px] font-medium text-white">Lunch Break</span>
          </div>

          {/* iOS Segmented Control */}
          <div className="flex items-center bg-[#2c2c2e] p-[3px] rounded-[10px] border border-[#3a3a3c]/80 gap-0.5">
            {[0, 30, 60].map((mins) => {
              const isSelected = time.lunchDeductionMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleLunchToggle(mins)}
                  className={`px-3 py-1 text-[12px] font-semibold rounded-[7px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#636366] text-white shadow-sm'
                      : 'text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {mins === 0 ? 'None' : `${mins}m`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 4: Total Net Hours Summary */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-[#252528]/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#30d158]" />
            <span className="text-[14px] font-medium text-[#8e8e93]">Calculated Net Shift</span>
          </div>

          <div className="flex items-center gap-2">
            {time.overtimeHours > 0 && (
              <span className="text-[11px] font-semibold text-[#ff9f0a] bg-[#ff9f0a]/15 border border-[#ff9f0a]/30 px-2 py-0.5 rounded-full">
                +{time.overtimeHours.toFixed(1)}h OT
              </span>
            )}
            <span className="text-[17px] font-bold text-white font-mono-numbers">
              {time.totalHours.toFixed(1)} <span className="text-[13px] font-normal text-[#8e8e93]">hrs</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
