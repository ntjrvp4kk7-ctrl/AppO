import React from 'react';
import { X, Printer, Download, Check, FileText } from 'lucide-react';
import { DailyWorkLog, UserAccount, UnitWork } from '../types/worklog';

interface ReportPreviewModalProps {
  isOpen: boolean;
  dates: string[];
  logs: DailyWorkLog[];
  profile: UserAccount;
  supervisorSignature?: {
    signedBy: string;
    signedAt: string;
  };
  onClose: () => void;
  onPrint: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  dates,
  logs,
  profile,
  supervisorSignature,
  onClose,
  onPrint,
}) => {
  if (!isOpen) return null;

  let totalHours = 0;
  let totalRegular = 0;
  let totalOvertime = 0;
  const allUnitsWithDate: { date: string; unit: UnitWork }[] = [];

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log) {
      totalHours += log.time.totalHours;
      totalRegular += Math.min(8, log.time.totalHours);
      totalOvertime += log.time.overtimeHours;
      log.units.forEach((u) => {
        allUnitsWithDate.push({ date: dateStr, unit: u });
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-150 no-print">
      {/* Top action bar */}
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Weekly PDF Report Preview</h2>
            <p className="text-[11px] text-zinc-400">Scroll down to view Page 1 (Time) & Page 2 (Units & Photos)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrint}
            className="py-1.5 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Save PDF / Print</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Container with simulated 2-page document */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-zinc-900/60 flex flex-col items-center gap-6">
        {/* ================= PAGE 1: THE TIME ================= */}
        <div className="w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 border border-slate-200">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PAGE 1 OF 2 · WEEKLY HOURS
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 mt-1">
                Weekly Work & Unit Report
              </h1>
              <p className="text-xs text-slate-600">
                Technician: <strong>{profile.workerName}</strong> • Supervisor: <strong>{profile.bossName}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block">Report Week</span>
              <span className="text-sm font-black text-slate-900">{dates[0]} to {dates[6]}</span>
            </div>
          </div>

          {/* Hours table */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
              1. Weekly Hours Breakdown
            </h3>
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <th className="py-2 px-2.5 text-left font-bold">Date / Day</th>
                  <th className="py-2 px-2 text-center font-bold">In</th>
                  <th className="py-2 px-2 text-center font-bold">Out</th>
                  <th className="py-2 px-2 text-center font-bold">Lunch</th>
                  <th className="py-2 px-2 text-center font-bold">Units</th>
                  <th className="py-2 px-2.5 text-right font-bold">Hours</th>
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
                        <td className="py-1.5 px-2.5">{day}</td>
                        <td colSpan={4} className="py-1.5 px-2 text-center italic text-slate-400">Off</td>
                        <td className="py-1.5 px-2.5 text-right font-mono">0.0</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={dateStr} className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 font-bold text-slate-900">{day}</td>
                      <td className="py-1.5 px-2 text-center font-mono">{log.time.startTime}</td>
                      <td className="py-1.5 px-2 text-center font-mono">{log.time.endTime}</td>
                      <td className="py-1.5 px-2 text-center text-slate-600">{log.time.lunchDeductionMinutes}m</td>
                      <td className="py-1.5 px-2 text-center font-semibold text-slate-800">{log.units.length}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">{log.time.totalHours.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td colSpan={4} className="py-2.5 px-2.5 text-slate-900 uppercase font-black text-xs">
                    Weekly Total Hours
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900">{allUnitsWithDate.length} Units</td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-sm font-black text-slate-900">
                    {totalHours.toFixed(1)} hrs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="border-t-2 border-slate-900 pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8 text-xs">
              <div>
                <div className="border-b border-slate-400 pb-5 mb-1">
                  <span className="italic font-mono text-slate-800">{profile.workerName}</span>
                </div>
                <span className="font-bold text-slate-900 uppercase block text-[11px]">
                  Painter Signature
                </span>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-5 mb-1 flex justify-between items-end">
                  <span className="italic font-mono text-slate-800">
                    {supervisorSignature ? supervisorSignature.signedBy : profile.bossName}
                  </span>
                  {supervisorSignature && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(supervisorSignature.signedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900 uppercase block text-[11px]">
                  Supervisor Approval
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page break divider indicator */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest font-bold">
          <span>↓ Scroll to Page 2 (Pictures & Units) ↓</span>
        </div>

        {/* ================= PAGE 2: PICTURES & UNITS (BEFORE & AFTER) ================= */}
        <div className="w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 border border-slate-200">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                PAGE 2 OF 2 · BEFORE & AFTER PHOTOS
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-950 mt-1">
                2. Units Patched & Painted (Photo Proof)
              </h2>
              <p className="text-xs text-slate-600">
                All units with damages fixed, painted and cleaned
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500">{allUnitsWithDate.length} Units</span>
            </div>
          </div>

          {allUnitsWithDate.length > 0 ? (
            <div className="space-y-4">
              {allUnitsWithDate.map(({ date, unit }) => {
                const beforePhotos = unit.photos.filter((p) => p.type === 'before');
                const afterPhotos = unit.photos.filter((p) => p.type === 'after');

                return (
                  <div key={unit.id} className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-1.5 mb-2">
                      <div>
                        <span className="font-black text-sm text-slate-900 mr-2">{unit.unitNumber}</span>
                        {unit.paintColor && (
                          <span className="text-xs text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                            Paint: {unit.paintColor}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-800 text-[11px]">
                          {unit.isCompleted ? '✓ Completed & Cleaned' : 'Work Logged'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{date}</span>
                      </div>
                    </div>

                    {unit.notes && (
                      <p className="text-xs text-slate-700 mb-2 bg-white p-2 rounded border border-slate-100">
                        {unit.notes}
                      </p>
                    )}

                    {/* BEFORE AND AFTER COLUMNS */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* BEFORE */}
                      <div className="border border-rose-200 rounded-lg p-2 bg-rose-50/40">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-black text-rose-700 text-xs uppercase">
                            [BEFORE · DAMAGE]
                          </span>
                          <span className="text-[10px] text-slate-500">{beforePhotos.length} pic</span>
                        </div>
                        {beforePhotos.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {beforePhotos.map((p) => (
                              <div key={p.id} className="aspect-4/3 bg-slate-200 rounded overflow-hidden border border-slate-300">
                                <img src={p.dataUrl} alt="Before" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic text-center py-4">No before photo</p>
                        )}
                      </div>

                      {/* AFTER */}
                      <div className="border border-emerald-200 rounded-lg p-2 bg-emerald-50/40">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-black text-emerald-700 text-xs uppercase">
                            [AFTER · PAINTED]
                          </span>
                          <span className="text-[10px] text-slate-500">{afterPhotos.length} pic</span>
                        </div>
                        {afterPhotos.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {afterPhotos.map((p) => (
                              <div key={p.id} className="aspect-4/3 bg-slate-200 rounded overflow-hidden border border-slate-300">
                                <img src={p.dataUrl} alt="After" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic text-center py-4">No after photo</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-slate-400 italic">No units recorded this week.</p>
          )}
        </div>

        {/* Bottom floating print trigger */}
        <div className="sticky bottom-4 z-10">
          <button
            onClick={onPrint}
            className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Save as PDF / Print Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
