import React from 'react';
import { DailyWorkLog, UserAccount, WorkPhoto, UnitRepair } from '../types/worklog';

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
  const allRepairs: { date: string; repair: UnitRepair }[] = [];
  const allPhotos: { date: string; photo: WorkPhoto; repair?: UnitRepair }[] = [];

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log) {
      totalHours += log.time.totalHours;
      totalRegular += Math.min(8, log.time.totalHours);
      totalOvertime += log.time.overtimeHours;

      log.repairs.forEach((r) => {
        allRepairs.push({ date: dateStr, repair: r });
      });

      log.photos.forEach((p) => {
        const r = log.repairs.find((item) => item.id === p.repairId);
        allPhotos.push({ date: dateStr, photo: p, repair: r });
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
              Paint & Drywall Weekly Work Report
            </h1>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
              {profile.companyName}
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
            <span className="text-slate-500 font-semibold block">PAINTER / TECHNICIAN</span>
            <span className="font-bold text-slate-900 text-sm">{profile.workerName}</span>
            <span className="text-slate-600 block">{profile.email}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-semibold block">SUPERVISOR</span>
            <span className="font-bold text-slate-900 text-sm">{profile.bossName}</span>
            <span className="text-slate-600 block">{profile.bossEmail || 'No email set'}</span>
          </div>
        </div>
      </div>

      {/* Timesheet Summary Table */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          1. Weekly Labor Hours & Activity
        </h2>
        <table className="w-full text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
              <th className="py-2 px-2.5 text-left font-bold">Date / Day</th>
              <th className="py-2 px-2 text-center font-bold">Start</th>
              <th className="py-2 px-2 text-center font-bold">End</th>
              <th className="py-2 px-2 text-center font-bold">Break</th>
              <th className="py-2 px-2 text-left font-bold">Primary Activity</th>
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
                    <td colSpan={6} className="py-1.5 px-2 text-center italic">Off duty</td>
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
                  <td className="py-1.5 px-2 text-left text-slate-800">{log.time.laborCategory}</td>
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

      {/* Paint & Drywall Unit Breakdown */}
      <div className="mb-6 page-break-inside-avoid">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          2. Paint & Drywall Repairs by Unit ({allRepairs.length} Total Units)
        </h2>
        {allRepairs.length > 0 ? (
          <div className="space-y-3">
            {allRepairs.map((item, idx) => (
              <div key={idx} className="border border-slate-300 rounded p-3 text-xs bg-slate-50/50">
                <div className="flex justify-between items-start border-b border-slate-200 pb-1 mb-1.5">
                  <div className="font-bold text-slate-900 text-sm">
                    {item.repair.unitNumber} • {item.repair.roomArea}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-800">{item.repair.repairStage}</span>
                    <span className="text-slate-500 text-[11px] block">{item.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 mb-1.5">
                  <div>
                    <span className="font-semibold text-slate-600">Damage Fixed:</span>{' '}
                    {item.repair.damageType} {item.repair.damageSize ? `(${item.repair.damageSize})` : ''}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Paint Spec:</span>{' '}
                    {item.repair.paintColor} [{item.repair.paintSheen}]
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 mb-1.5">
                  <div>
                    <span className="font-semibold text-slate-600">Texture Match:</span>{' '}
                    {item.repair.textureType}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Mud / Primer:</span>{' '}
                    {item.repair.compoundUsed || 'N/A'} {item.repair.primerUsed ? `• ${item.repair.primerUsed}` : ''}
                  </div>
                </div>

                {item.repair.workDescription && (
                  <div className="text-slate-800 mt-1 pt-1 border-t border-slate-200">
                    <span className="font-semibold text-slate-600">Work Performed:</span>{' '}
                    {item.repair.workDescription}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No paint or drywall repairs recorded this week.</p>
        )}
      </div>

      {/* Photographic Proof (Damage / Before and After) */}
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
                    <span className={item.photo.category === 'After / Finished' ? 'text-emerald-700' : 'text-rose-700'}>
                      [{item.photo.category}]
                    </span>
                    <span>{item.date}</span>
                  </div>
                  {item.repair && (
                    <p className="text-[10px] text-slate-600 truncate font-semibold">
                      {item.repair.unitNumber} ({item.repair.roomArea})
                    </p>
                  )}
                  <p className="text-slate-700 text-[10px] mt-0.5 line-clamp-2">{item.photo.caption || 'Photo log'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boss Approval Signature Section */}
      <div className="border-t-2 border-slate-900 pt-4 mt-8 page-break-inside-avoid">
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-8 mb-1">
              <span className="italic text-slate-600 font-mono text-sm">{profile.workerName}</span>
            </div>
            <span className="font-bold text-slate-800 block">PAINTER SIGNATURE</span>
            <span className="text-[11px] text-slate-500">I verify that all drywall repairs, texture, and paint are complete.</span>
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
              {supervisorSignature ? 'Signed off & approved' : 'Pending weekly review'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
