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

interface UnitWithDate {
  date: string;
  dayName: string;
  unit: UnitWork;
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
  const unitList: UnitWithDate[] = [];

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date && l.date.slice(0, 10) === dateStr.slice(0, 10));
    if (log) {
      totalHours += log.time?.totalHours || 0;
      totalRegular += Math.min(8, log.time?.totalHours || 0);
      totalOvertime += log.time?.overtimeHours || 0;

      if (Array.isArray(log.units)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dayObj = new Date(y, m - 1, d);
        const dayName = dayObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

        log.units.forEach((u) => {
          unitList.push({ date: dateStr, dayName, unit: u });
        });
      }
    }
  });

  const totalPages = unitList.length > 0 ? 1 + unitList.length : 2;

  return (
    <div className="print-document hidden print:block text-slate-900 bg-white font-sans text-xs leading-normal">
      {/* =========================================================================
          PAGE 1: THE TIME (HOURS & TIMESHEET + SIGNATURES)
          Strictly Page 1 with page-break-after: always
         ========================================================================= */}
      <div className="pdf-page-1 border-b-2 border-slate-900 pb-4 mb-4" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
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
                Page 1 of {totalPages}: Weekly Hours
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
                {unitList.length} total units completed
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
                  const log = logs.find((l) => l.date && l.date.slice(0, 10) === dateStr.slice(0, 10));
                  const [y, m, d] = dateStr.split('-').map(Number);
                  const dayObj = new Date(y, m - 1, d);
                  const day = dayObj.toLocaleDateString('en-US', {
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
                      <td className="py-2 px-3 text-center font-mono font-medium">{log.time?.startTime || '--:--'}</td>
                      <td className="py-2 px-3 text-center font-mono font-medium">{log.time?.endTime || '--:--'}</td>
                      <td className="py-2 px-3 text-center text-slate-600">{log.time?.lunchDeductionMinutes || 30}m</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800">
                        {(log.units?.length || 0)} unit{(log.units?.length || 0) === 1 ? '' : 's'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {(log.time?.totalHours || 0).toFixed(1)}
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
                    {unitList.length} Units Finished
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
          PAGES 2+: 1 DEDICATED FULL PAGE PER UNIT DAY (WITH BEFORE/AFTER PHOTOS)
         ========================================================================= */}
      {unitList.map((item, idx) => {
        const pageNum = 2 + idx;
        const { date, dayName, unit } = item;
        const beforePhotos = unit.photos.filter((p) => p.type === 'before');
        const afterPhotos = unit.photos.filter((p) => p.type === 'after');

        return (
          <div
            key={unit.id + '-' + idx}
            className="print-unit-card pdf-unit-page border-b-2 border-slate-900 pb-6 mb-6 pt-4"
            style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
          >
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  PAGE {pageNum} OF {totalPages} · UNIT WORK & PHOTO PROOF
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950 mt-1">
                  {unit.unitNumber || `Unit #${idx + 1}`}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {unit.paintColor && (
                    <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      Paint: {unit.paintColor}
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Completed & Cleaned
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 block">
                  {dayName}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {date}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs">
              <span className="font-bold text-slate-800 uppercase block mb-1">
                Damage Repaired & Work Scope:
              </span>
              <p className="text-slate-700">
                {unit.notes && unit.notes.trim().length > 0
                  ? unit.notes
                  : 'Wall damage patched with hot mud, sanded flush, painted with matching color, and floors swept/wiped clean.'}
              </p>
            </div>

            {/* Large Side-by-Side Photos */}
            <div className="grid grid-cols-2 gap-4">
              {/* Before */}
              <div className="border border-rose-200 rounded-lg p-3 bg-rose-50/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-rose-700 text-xs tracking-wider uppercase">
                    [BEFORE · DAMAGE]
                  </span>
                  <span className="text-[10px] text-rose-600 font-semibold">
                    {beforePhotos.length} photo{beforePhotos.length === 1 ? '' : 's'}
                  </span>
                </div>

                {beforePhotos.length > 0 ? (
                  <div className="photo-grid photos-container">
                    {beforePhotos.map((photo) => (
                      <div key={photo.id} className="w-full bg-slate-950 rounded-lg overflow-hidden border border-rose-300 p-1 flex items-center justify-center">
                        <img src={photo.dataUrl} alt="Before Damage" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 italic text-xs">
                    [ No before damage photo recorded ]
                  </div>
                )}
              </div>

              {/* After */}
              <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-emerald-700 text-xs tracking-wider uppercase">
                    [AFTER · PAINTED]
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {afterPhotos.length} photo{afterPhotos.length === 1 ? '' : 's'}
                  </span>
                </div>

                {afterPhotos.length > 0 ? (
                  <div className="photo-grid photos-container">
                    {afterPhotos.map((photo) => (
                      <div key={photo.id} className="w-full bg-slate-950 rounded-lg overflow-hidden border border-emerald-300 p-1 flex items-center justify-center">
                        <img src={photo.dataUrl} alt="After Painted" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 italic text-xs">
                    [ No after painted photo recorded ]
                  </div>
                )}
              </div>
            </div>

            {/* Quality & Cleanliness Verification Bar */}
            <div className="mt-4 border border-slate-200 rounded p-2 text-[11px] text-slate-700 flex justify-between items-center">
              <span>Technician: <strong>{profile.workerName}</strong></span>
              <span className="text-emerald-700 font-semibold">✓ Wall Mudded, Painted & Floors Cleaned</span>
              <span>Page {pageNum} of {totalPages}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
