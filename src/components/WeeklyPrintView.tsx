import React from 'react';
import { DailyWorkLog, WorkerProfile, WorkPhoto, UnitDetail } from '../types/worklog';
import { formatDisplayDate } from '../utils/dateUtils';

interface WeeklyPrintViewProps {
  dates: string[];
  logs: DailyWorkLog[];
  profile: WorkerProfile;
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
  const allUnits: { date: string; unit: UnitDetail }[] = [];
  const allPhotos: { date: string; photo: WorkPhoto; unitName?: string }[] = [];

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log) {
      totalHours += log.time.totalHours;
      totalRegular += Math.min(8, log.time.totalHours);
      totalOvertime += log.time.overtimeHours;

      log.units.forEach((u) => {
        allUnits.push({ date: dateStr, unit: u });
      });

      log.photos.forEach((p) => {
        const u = log.units.find((item) => item.id === p.unitId);
        allPhotos.push({ date: dateStr, photo: p, unitName: u?.unitNumber });
      });
    }
  });

  return (
    <div className="hidden print:block text-black bg-white p-8 max-w-4xl mx-auto font-sans leading-normal">
      {/* Document Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Weekly Field Work & Unit Report
            </h1>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
              {profile.companyName} • {profile.companyPhone}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Report Period</span>
            <span className="text-sm font-bold text-slate-900">
              {dates[0]} to {dates[6]}
            </span>
          </div>
        </div>

        {/* Worker & Supervisor Info Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block">TECHNICIAN</span>
            <span className="font-bold text-slate-900 text-sm">{profile.workerName}</span>
            <span className="text-slate-600 block">ID: {profile.employeeId} • {profile.workerTitle}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-semibold block">SUPERVISOR</span>
            <span className="font-bold text-slate-900 text-sm">{profile.bossName}</span>
            <span className="text-slate-600 block">{profile.bossEmail}</span>
          </div>
        </div>
      </div>

      {/* Timesheet Summary Table */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          1. Weekly Timesheet & Labor Hours
        </h2>
        <table className="w-full text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
              <th className="py-2 px-2.5 text-left font-bold">Date / Day</th>
              <th className="py-2 px-2 text-center font-bold">Start</th>
              <th className="py-2 px-2 text-center font-bold">End</th>
              <th className="py-2 px-2 text-center font-bold">Break</th>
              <th className="py-2 px-2 text-center font-bold">Category</th>
              <th className="py-2 px-2 text-right font-bold">Reg Hrs</th>
              <th className="py-2 px-2 text-right font-bold">OT Hrs</th>
              <th className="py-2 px-2.5 text-right font-bold">Total</th>
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
                    <td className="py-1.5 px-2.5 font-medium">{day}</td>
                    <td colSpan={6} className="py-1.5 px-2 text-center italic">Off / No shift</td>
                    <td className="py-1.5 px-2.5 text-right font-mono">0.0</td>
                  </tr>
                );
              }
              const reg = Math.min(8, log.time.totalHours);
              return (
                <tr key={dateStr} className="border-b border-slate-200">
                  <td className="py-1.5 px-2.5 font-bold text-slate-900">{day}</td>
                  <td className="py-1.5 px-2 text-center font-mono">{log.time.startTime}</td>
                  <td className="py-1.5 px-2 text-center font-mono">{log.time.endTime}</td>
                  <td className="py-1.5 px-2 text-center text-slate-600">{log.time.breakMinutes}m</td>
                  <td className="py-1.5 px-2 text-center text-slate-700">{log.time.laborCategory}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{reg.toFixed(1)}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold text-amber-800">
                    {log.time.overtimeHours > 0 ? log.time.overtimeHours.toFixed(1) : '-'}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                    {log.time.totalHours.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
              <td colSpan={5} className="py-2 px-2.5 text-slate-900 uppercase">Weekly Totals</td>
              <td className="py-2 px-2 text-right font-mono">{totalRegular.toFixed(1)}</td>
              <td className="py-2 px-2 text-right font-mono">{totalOvertime.toFixed(1)}</td>
              <td className="py-2 px-2.5 text-right font-mono text-sm">{totalHours.toFixed(1)} hrs</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Unit Details Breakdown */}
      <div className="mb-6 page-break-inside-avoid">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          2. Units & Equipment Serviced Breakdown ({allUnits.length} Units)
        </h2>
        {allUnits.length > 0 ? (
          <div className="space-y-3">
            {allUnits.map((item, idx) => (
              <div key={idx} className="border border-slate-300 rounded p-3 text-xs bg-slate-50/50">
                <div className="flex justify-between items-start border-b border-slate-200 pb-1 mb-1.5">
                  <div className="font-bold text-slate-900 text-sm">
                    {item.unit.unitNumber}{' '}
                    <span className="text-slate-500 font-normal text-xs">
                      {item.unit.equipmentType ? `(${item.unit.equipmentType})` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-700">Status: {item.unit.status}</span>
                    <span className="text-slate-500 text-[11px] block">{item.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-1.5">
                  <div>Location: <span className="font-medium text-slate-800">{item.unit.location || 'N/A'}</span></div>
                  <div>Ticket / Work Order: <span className="font-medium text-slate-800">{item.unit.workOrderNumber || 'N/A'}</span></div>
                </div>

                <div className="mb-1 text-slate-800">
                  <span className="font-semibold text-slate-700">Work Performed: </span>
                  {item.unit.workPerformed || 'Standard service completed.'}
                </div>

                {item.unit.partsUsed.length > 0 && (
                  <div className="text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-200 mt-1">
                    <span className="font-semibold">Parts & Materials Used: </span>
                    {item.unit.partsUsed.map((p) => `${p.quantity}x ${p.description} (${p.partNumber})`).join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No equipment units recorded this week.</p>
        )}
      </div>

      {/* Photo Documentation Grid */}
      {allPhotos.length > 0 && (
        <div className="mb-6 page-break-inside-avoid">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            3. Attached Photographic Evidence ({allPhotos.length} Photos)
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {allPhotos.map((item, idx) => (
              <div key={idx} className="border border-slate-300 rounded overflow-hidden text-[11px] bg-slate-50">
                <div className="aspect-4/3 bg-slate-200 overflow-hidden">
                  <img src={item.photo.dataUrl} alt={item.photo.caption} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <div className="flex justify-between font-bold text-slate-800 text-[10px]">
                    <span>[{item.photo.category}]</span>
                    <span>{item.date}</span>
                  </div>
                  {item.unitName && <p className="text-[10px] text-slate-600 truncate">Unit: {item.unitName}</p>}
                  <p className="text-slate-700 text-[10px] mt-0.5 line-clamp-2">{item.photo.caption || 'Photo log'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign-off Section */}
      <div className="border-t-2 border-slate-900 pt-4 mt-8 page-break-inside-avoid">
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-8 mb-1">
              <span className="italic text-slate-600 font-mono text-sm">{profile.workerName}</span>
            </div>
            <span className="font-bold text-slate-800 block">TECHNICIAN SIGNATURE</span>
            <span className="text-[11px] text-slate-500">I certify that the above hours and units are accurate.</span>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-8 mb-1 flex items-end justify-between">
              <span className="italic text-slate-600 font-mono text-sm">
                {supervisorSignature ? supervisorSignature.signedBy : ''}
              </span>
              {supervisorSignature && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(supervisorSignature.signedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <span className="font-bold text-slate-800 block">SUPERVISOR APPROVAL</span>
            <span className="text-[11px] text-slate-500">
              {supervisorSignature ? 'Approved and signed off' : 'Pending weekly supervisor review'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
