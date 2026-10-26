import React from 'react';
import { FileText, CloudSun, CheckCircle2 } from 'lucide-react';
import { DailyWorkLog } from '../types/worklog';

interface DailyNotesSectionProps {
  log: DailyWorkLog;
  onChangeNotes: (notes: string) => void;
  onChangeWeather: (weather: string) => void;
  onSubmitLog: () => void;
}

export const DailyNotesSection: React.FC<DailyNotesSectionProps> = ({
  log,
  onChangeNotes,
  onChangeWeather,
  onSubmitLog,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800/90 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-100">Daily Summary & Conditions</h3>
            <p className="text-xs text-neutral-400">Shift notes, job impediments & site conditions</p>
          </div>
        </div>
      </div>

      {/* Weather conditions input */}
      <div>
        <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
          <CloudSun className="w-3.5 h-3.5 text-neutral-500" />
          Site Weather / Environment (Optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. Clear, 70°F or Heavy Rain (Indoor Work)"
            value={log.weatherConditions || ''}
            onChange={(e) => onChangeWeather(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <div className="flex gap-1">
            {['Clear', 'Rain', 'Indoor'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeWeather(preset)}
                className="text-[11px] px-2 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* General Daily Notes */}
      <div>
        <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
          General Shift Recap & Boss Notes
        </label>
        <textarea
          rows={3}
          placeholder="Any delays, client conversations, gate access codes, or items for tomorrow's shift..."
          value={log.generalNotes || ''}
          onChange={(e) => onChangeNotes(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
        />
      </div>

      {/* Submit / Status Bar */}
      <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Log Status:</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
              log.status === 'Submitted'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
          >
            {log.status}
          </span>
        </div>

        <button
          type="button"
          onClick={onSubmitLog}
          className="inline-flex items-center gap-1.5 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{log.status === 'Submitted' ? 'Update & Re-Submit' : 'Submit Day to Log'}</span>
        </button>
      </div>
    </div>
  );
};
