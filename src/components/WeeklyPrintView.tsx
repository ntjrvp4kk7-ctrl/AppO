import React from 'react';
import { DailyWorkLog, UserAccount } from '../types/worklog';

interface WeeklyPrintViewProps {
  dates: string[];
  logs: DailyWorkLog[];
  profile: UserAccount;
  supervisorSignature?: {
    signedBy: string;
    signedAt: string;
  };
}

export const WeeklyPrintView: React.FC<WeeklyPrintViewProps> = ({
  dates,
  logs,
  profile,
  supervisorSignature,
}) => {
  let totalHours = 0;
  let totalRegular = 0;
  let totalOvertime = 0;
  let totalUnits = 0;

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log) {
      totalHours += log.time.totalHours;
      totalRegular += Math.min(8, log.time.totalHours);
      totalOvertime += log.time.overtimeHours;
      totalUnits += log.units.length;
    }
  });

  return (
    <div className="hidden print:block text-black bg-white p-8 max-w-4xl mx-auto font-sans leading-normal">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Weekly Work & Unit Report
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Technician: <strong className="text-slate-900">{profile.workerName}</strong> • Supervisor: <strong className="text-slate-900">{profile.bossName}</strong>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Week Range</span>
          <span className="text-sm font-bold text-slate-900">
            {dates[0]} to {dates[6]}
          </span>
        </div>
      </div>

      {/* Hours Summary Table */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          1. Weekly Hours Breakdown
        </h2>
        <table className="w-full text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
              <th className="py-2 px-3 text-left font-bold">Date / Day</th>
              <th className="py-2 px-3 text-center font-bold">Start</th>
              <th className="py-2 px-3 text-center font-bold">End</th>
              <th className="py-2 px-3 text-center font-bold">Lunch</th>
              <th className="py-2 px-3 text-center font-bold">Units Serviced</th>
              <th className="py-2 px-3 text-right font-bold">Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((dateStr) => {
              const log = logs.find((l) => l.date === dateStr);
              const day = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'numeric',
                day: 'numeric',
              });
              if (!log) {
                return (
                  <tr key={dateStr} className="border-b border-slate-200 text-slate-400">
                    <td className="py-1.5 px-3">{day}</td>
                    <td colSpan={4} className="py-1.5 px-3 text-center italic">Off</td>
                    <td className="py-1.5 px-3 text-right font-mono">0.0</td>
                  </tr>
                );
              }
              return (
                <tr key={dateStr} className="border-b border-slate-200">
                  <td className="py-1.5 px-3 font-bold text-slate-900">{day}</td>
                  <td className="py-1.5 px-3 text-center font-mono">{log.time.startTime}</td>
                  <td className="py-1.5 px-3 text-center font-mono">{log.time.endTime}</td>
                  <td className="py-1.5 px-3 text-center text-slate-600">{log.time.lunchDeductionMinutes}m</td>
                  <td className="py-1.5 px-3 text-center font-semibold text-slate-800">
                    {log.units.length} unit{log.units.length === 1 ? '' : 's'}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                    {log.time.totalHours.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
              <td colSpan={4} className="py-2 px-3 text-slate-900 uppercase">Weekly Total Hours</td>
              <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">{totalUnits} Units</td>
              <td className="py-2 px-3 text-right font-mono text-sm">{totalHours.toFixed(1)} hrs</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Units Completed with Before & After Photos */}
      <div className="mb-6 page-break-inside-avoid">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          2. Units Patched, Painted & Cleaned (Photo Proof)
        </h2>

        <div className="space-y-4">
          {dates.map((dateStr) => {
            const log = logs.find((l) => l.date === dateStr);
            if (!log || log.units.length === 0) return null;

            return (
              <div key={dateStr} className="border border-slate-300 rounded p-3 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-700 block mb-2 border-b border-slate-200 pb-1">
                  {dateStr} ({log.units.length} unit{log.units.length === 1 ? '' : 's'})
                </span>

                <div className="space-y-3">
                  {log.units.map((unit) => {
                    const before = unit.photos.filter((p) => p.type === 'before');
                    const after = unit.photos.filter((p) => p.type === 'after');

                    return (
                      <div key={unit.id} className="bg-white p-3 rounded border border-slate-200 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-900 text-sm">{unit.unitNumber}</span>
                          <span className="text-emerald-700 font-semibold">
                            {unit.isCompleted ? '✓ Completed & Cleaned' : 'In Progress'}
                          </span>
                        </div>
                        {unit.paintColor && (
                          <div className="text-slate-600 mb-1">
                            <strong>Paint:</strong> {unit.paintColor}
                          </div>
                        )}
                        {unit.notes && (
                          <p className="text-slate-700 mb-2">{unit.notes}</p>
                        )}

                        {/* Side by side Before and After photos */}
                        {(before.length > 0 || after.length > 0) && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                            <div>
                              <span className="font-bold text-rose-700 text-[10px] block mb-1">
                                [BEFORE / DAMAGE]
                              </span>
                              {before.length > 0 ? (
                                <div className="grid grid-cols-2 gap-1.5">
                                  {before.map((p) => (
                                    <div key={p.id} className="aspect-square bg-slate-200 rounded overflow-hidden">
                                      <img src={p.dataUrl} alt="Before" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No before photo</span>
                              )}
                            </div>

                            <div>
                              <span className="font-bold text-emerald-700 text-[10px] block mb-1">
                                [AFTER / PAINTED]
                              </span>
                              {after.length > 0 ? (
                                <div className="grid grid-cols-2 gap-1.5">
                                  {after.map((p) => (
                                    <div key={p.id} className="aspect-square bg-slate-200 rounded overflow-hidden">
                                      <img src={p.dataUrl} alt="After" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No after photo</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signature Section */}
      <div className="border-t-2 border-slate-900 pt-4 mt-6 page-break-inside-avoid">
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-6 mb-1">
              <span className="italic font-mono text-sm">{profile.workerName}</span>
            </div>
            <span className="font-bold text-slate-800 block">PAINTER SIGNATURE</span>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-6 mb-1 flex items-end justify-between">
              <span className="italic font-mono text-sm">
                {supervisorSignature ? supervisorSignature.signedBy : ''}
              </span>
              {supervisorSignature && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(supervisorSignature.signedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <span className="font-bold text-slate-800 block">SUPERVISOR APPROVAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
