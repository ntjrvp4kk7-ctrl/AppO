import React from 'react';
import { DailyWorkLog, UserAccount, UnitWork, UnitPhoto } from '../types/worklog';

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
    <div className="print-document hidden print:block text-slate-900 bg-white font-sans text-xs leading-normal">
      {/* =========================================================================
          PAGE 1: THE TIME (HOURS & TIMESHEET + SIGNATURES)
          Strictly Page 1 with page-break-after: always
         ========================================================================= */}
      <div className="pdf-page-1 border-b-2 border-slate-900 pb-4 mb-4">
        <div>
          {/* Document Top Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                Weekly Work & Unit Report
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Technician: <strong className="text-slate-900 text-sm">{profile.workerName}</strong>
                {profile.email && <span className="text-slate-500"> ({profile.email})</span>}
              </p>
              <p className="text-xs text-slate-600">
                Supervisor: <strong className="text-slate-900">{profile.bossName}</strong>
                {profile.bossEmail && <span className="text-slate-500"> ({profile.bossEmail})</span>}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Work Week Period
              </span>
              <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                {dates[0]} to {dates[6]}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Page 1 of 2: Weekly Hours
              </span>
            </div>
          </div>

          {/* Section 1: Timesheet Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                1. Weekly Hours Breakdown
              </h2>
              <span className="text-xs text-slate-600 font-medium">
                {allUnitsWithDate.length} total units completed
              </span>
            </div>

            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <th className="py-2.5 px-3 text-left font-bold">Date / Day</th>
                  <th className="py-2.5 px-3 text-center font-bold">Clock In</th>
                  <th className="py-2.5 px-3 text-center font-bold">Clock Out</th>
                  <th className="py-2.5 px-3 text-center font-bold">Lunch Break</th>
                  <th className="py-2.5 px-3 text-center font-bold">Units Serviced</th>
                  <th className="py-2.5 px-3 text-right font-bold">Total Net Hours</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((dateStr) => {
                  const log = logs.find((l) => l.date === dateStr);
                  const day = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });

                  if (!log) {
                    return (
                      <tr key={dateStr} className="border-b border-slate-200 text-slate-400">
                        <td className="py-2 px-3 font-medium">{day}</td>
                        <td colSpan={4} className="py-2 px-3 text-center italic text-slate-400">
                          Off Duty / No Shift
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">0.0</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={dateStr} className="border-b border-slate-200">
                      <td className="py-2 px-3 font-bold text-slate-900">{day}</td>
                      <td className="py-2 px-3 text-center font-mono font-medium">{log.time.startTime}</td>
                      <td className="py-2 px-3 text-center font-mono font-medium">{log.time.endTime}</td>
                      <td className="py-2 px-3 text-center text-slate-600">{log.time.lunchDeductionMinutes}m</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800">
                        {log.units.length} unit{log.units.length === 1 ? '' : 's'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {log.time.totalHours.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td colSpan={4} className="py-3 px-3 text-slate-900 uppercase font-extrabold text-xs">
                    Weekly Total Hours
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900 text-xs">
                    {allUnitsWithDate.length} Units Finished
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-base font-black text-slate-900">
                    {totalHours.toFixed(1)} hrs
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Hours breakdown notes */}
            <div className="flex justify-between items-center text-xs text-slate-600 mt-2 px-1">
              <span>Regular Hours: <strong>{totalRegular.toFixed(1)} hrs</strong></span>
              <span>Overtime Hours: <strong className={totalOvertime > 0 ? 'text-amber-800' : 'text-slate-900'}>{totalOvertime.toFixed(1)} hrs</strong></span>
            </div>
          </div>
        </div>

        {/* Bottom Signatures Section on Page 1 */}
        <div className="border-t-2 border-slate-900 pt-6 mt-12">
          <div className="grid grid-cols-2 gap-10">
            <div>
              <div className="border-b border-slate-400 pb-6 mb-2">
                <span className="italic font-mono text-sm text-slate-800">{profile.workerName}</span>
              </div>
              <span className="font-extrabold text-slate-900 uppercase text-xs block">
                Painter / Technician Signature
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                I certify that the above hours and units are accurate.
              </span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-6 mb-2 flex items-end justify-between">
                <span className="italic font-mono text-sm text-slate-800">
                  {supervisorSignature ? supervisorSignature.signedBy : profile.bossName}
                </span>
                {supervisorSignature && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(supervisorSignature.signedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <span className="font-extrabold text-slate-900 uppercase text-xs block">
                Supervisor Approval
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {supervisorSignature ? '✓ Verified & Signed Off' : 'Pending Boss Review'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAGE 2: PICTURES & UNITS LISTED (WITH BEFORE AND AFTER LABELS)
          Strictly Page 2 with page-break-before: always
         ========================================================================= */}
      <div className="pdf-page-2">
        {/* Page 2 Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
              2. Units Patched, Painted & Photo Evidence
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Before & After photo proof of wall damages, patching, paint & cleaned floors
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500">
              Page 2: Photo Documentation
            </span>
            <span className="text-[11px] text-slate-500 block">
              {allUnitsWithDate.length} Units Logged
            </span>
          </div>
        </div>

        {/* Units list */}
        {allUnitsWithDate.length > 0 ? (
          <div className="space-y-4">
            {allUnitsWithDate.map(({ date, unit }) => {
              const beforePhotos = unit.photos.filter((p) => p.type === 'before');
              const afterPhotos = unit.photos.filter((p) => p.type === 'after');

              return (
                <div
                  key={unit.id}
                  className="print-unit-card border border-slate-300 rounded-lg p-3.5 bg-white text-xs"
                >
                  {/* Unit Title Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-1.5 mb-2">
                    <div>
                      <span className="font-black text-sm text-slate-950 mr-2">
                        {unit.unitNumber || 'Unit'}
                      </span>
                      {unit.paintColor && (
                        <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                          Paint: {unit.paintColor}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-800 text-xs">
                        {unit.isCompleted ? '✓ Completed & Cleaned' : 'Work Logged'}
                      </span>
                      <span className="text-[11px] text-slate-500 block">{date}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {unit.notes && (
                    <p className="text-xs text-slate-800 mb-2.5 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                      {unit.notes}
                    </p>
                  )}

                  {/* Side by side Before and After photo columns */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* BEFORE COLUMN */}
                    <div className="border border-rose-200 rounded-lg p-2 bg-rose-50/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-rose-700 text-xs tracking-wider uppercase">
                          [BEFORE · DAMAGE]
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {beforePhotos.length} photo{beforePhotos.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {beforePhotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {beforePhotos.map((photo) => (
                            <div key={photo.id} className="aspect-4/3 bg-slate-200 rounded overflow-hidden border border-slate-300">
                              <img
                                src={photo.dataUrl}
                                alt="Before Damage"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-slate-400 italic text-[11px]">
                          No before photo taken
                        </div>
                      )}
                    </div>

                    {/* AFTER COLUMN */}
                    <div className="border border-emerald-200 rounded-lg p-2 bg-emerald-50/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-emerald-700 text-xs tracking-wider uppercase">
                          [AFTER · PAINTED]
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {afterPhotos.length} photo{afterPhotos.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {afterPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {afterPhotos.map((photo) => (
                            <div key={photo.id} className="aspect-4/3 bg-slate-200 rounded overflow-hidden border border-slate-300">
                              <img
                                src={photo.dataUrl}
                                alt="After Painted"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-slate-400 italic text-[11px]">
                          No after photo taken
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 italic border border-dashed border-slate-300 rounded-lg">
            No units or photos recorded this week.
          </div>
        )}
      </div>
    </div>
  );
};
