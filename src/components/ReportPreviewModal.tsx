import React, { useState } from 'react';
import { X, Download, Share2, Check, FileText, Printer, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { DailyWorkLog, UserAccount, UnitWork } from '../types/worklog';
import { downloadOrShareWeeklyPdf } from '../utils/pdfGenerator';

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
  onPrint?: () => void;
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
  const [activeView, setActiveView] = useState<'all' | 'page1' | 'page2'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

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

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      setExportStatus('Generating PDF...');
      const res = await downloadOrShareWeeklyPdf({
        dates,
        logs,
        profile,
        supervisorSignature,
      });
      if (res.shared) {
        setExportStatus('Shared successfully!');
      } else {
        setExportStatus('PDF Downloaded!');
      }
      setTimeout(() => setExportStatus(null), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
      setExportStatus('Export failed. Retrying...');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-150 no-print">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800 px-3 sm:px-6 py-3 shadow-lg flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h2 className="text-sm font-extrabold text-white truncate">Weekly PDF Report</h2>
            <p className="text-[11px] text-zinc-400 truncate">
              Page 1 (Hours & Signatures) • Page 2 (Units & Photos)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Saving...</span>
              </>
            ) : exportStatus ? (
              <>
                <Check className="w-4 h-4 text-zinc-950" />
                <span>{exportStatus}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sub-header Navigation: Page switchers & Mobile instructions */}
      <div className="bg-zinc-900/90 border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveView('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeView === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Full Report (Scroll)
          </button>
          <button
            onClick={() => setActiveView('page1')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeView === 'page1'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Page 1: Time
          </button>
          <button
            onClick={() => setActiveView('page2')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeView === 'page2'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Page 2: Photos ({allUnitsWithDate.length})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500">
          <span>↓ Scroll freely up and down</span>
        </div>
      </div>

      {/* Main Scrollable Canvas for Pages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-zinc-950/80 flex flex-col items-center gap-6">
        {/* ================= PAGE 1: THE TIME ================= */}
        {(activeView === 'all' || activeView === 'page1') && (
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-5 sm:p-8 border border-slate-200">
            {/* Top Accent Ribbon */}
            <div className="h-1.5 bg-emerald-500 rounded-full w-full mb-4" />

            {/* Document Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-4 mb-5 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  PAGE 1 OF 2 · WEEKLY HOURS
                </span>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 mt-1.5">
                  Weekly Work & Unit Report
                </h1>
                <p className="text-xs text-slate-600">
                  Technician: <strong className="text-slate-900">{profile.workerName}</strong> • Supervisor: <strong className="text-slate-900">{profile.bossName}</strong>
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Report Week
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 block">
                  {dates[0]} to {dates[6]}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">
                  {allUnitsWithDate.length} Units Finished
                </span>
              </div>
            </div>

            {/* Hours Table */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  1. Weekly Hours Breakdown
                </h3>
                <span className="text-[11px] text-slate-500">
                  Clock in / out & lunch deductions
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                      <th className="py-2.5 px-3 text-left font-bold">Date / Day</th>
                      <th className="py-2.5 px-2 text-center font-bold">Clock In</th>
                      <th className="py-2.5 px-2 text-center font-bold">Clock Out</th>
                      <th className="py-2.5 px-2 text-center font-bold">Lunch</th>
                      <th className="py-2.5 px-2 text-center font-bold">Units Serviced</th>
                      <th className="py-2.5 px-3 text-right font-bold">Total Net Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dates.map((dateStr, idx) => {
                      const log = logs.find((l) => l.date === dateStr);
                      const day = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      });

                      if (!log) {
                        return (
                          <tr
                            key={dateStr}
                            className={`border-b border-slate-200 text-slate-400 ${
                              idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                            }`}
                          >
                            <td className="py-2 px-3 font-medium text-slate-500">{day}</td>
                            <td colSpan={4} className="py-2 px-2 text-center italic text-slate-400">
                              Off Duty / No Shift
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-400">0.0 hrs</td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={dateStr}
                          className={`border-b border-slate-200 ${
                            idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-slate-900">{day}</td>
                          <td className="py-2 px-2 text-center font-mono font-medium text-slate-800">
                            {log.time.startTime}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-medium text-slate-800">
                            {log.time.endTime}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600">
                            {log.time.lunchDeductionMinutes}m
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-slate-900">
                            {log.units.length} unit{log.units.length === 1 ? '' : 's'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-emerald-800 text-xs sm:text-sm">
                            {log.time.totalHours.toFixed(1)} hrs
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold border-t-2 border-slate-900">
                      <td colSpan={4} className="py-3 px-3 text-slate-950 uppercase font-black text-xs">
                        Weekly Total Hours
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-900 text-xs">
                        {allUnitsWithDate.length} Units Finished
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm sm:text-base font-black text-slate-950">
                        {totalHours.toFixed(1)} hrs
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Regular vs Overtime stats */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Regular Hours:</span>
                  <span className="font-bold text-slate-900">{totalRegular.toFixed(1)} hrs</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Overtime Hours:</span>
                  <span
                    className={`font-bold ${
                      totalOvertime > 0 ? 'text-amber-700' : 'text-slate-900'
                    }`}
                  >
                    {totalOvertime.toFixed(1)} hrs
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Signatures Section strictly on Page 1 */}
            <div className="border-t-2 border-slate-900 pt-6 mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="border-b border-slate-400 pb-5 mb-2">
                    <span className="italic font-mono text-base text-slate-900">
                      {profile.workerName}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 uppercase block text-xs">
                    Painter / Technician Signature
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    I certify that the above hours and units are accurate.
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="border-b border-slate-400 pb-5 mb-2 flex justify-between items-end">
                    <span className="italic font-mono text-base text-slate-900">
                      {supervisorSignature ? supervisorSignature.signedBy : profile.bossName}
                    </span>
                    {supervisorSignature && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Approved
                      </span>
                    )}
                  </div>
                  <span className="font-black text-slate-900 uppercase block text-xs">
                    Supervisor Approval
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {supervisorSignature
                      ? `Signed on ${new Date(supervisorSignature.signedAt).toLocaleDateString()}`
                      : 'Pending review by supervisor'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-3 mt-6">
              <span>FieldLog • Paint & Drywall Unit Tracker</span>
              <span>Page 1 of 2</span>
            </div>
          </div>
        )}

        {/* Scroll Divider Indicator when viewing all pages */}
        {activeView === 'all' && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900/90 border border-zinc-800 text-zinc-400 rounded-full text-xs font-bold tracking-wider">
            <span>↓ PAGE 2: PICTURES & UNITS (BEFORE & AFTER) ↓</span>
          </div>
        )}

        {/* ================= PAGE 2: PICTURES & UNITS (BEFORE & AFTER) ================= */}
        {(activeView === 'all' || activeView === 'page2') && (
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-5 sm:p-8 border border-slate-200">
            {/* Top Accent Ribbon */}
            <div className="h-1.5 bg-rose-500 rounded-full w-full mb-4" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-3 mb-5 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                  PAGE 2 OF 2 · PHOTO DOCUMENTATION
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 mt-1.5">
                  2. Units Patched & Painted (Photo Proof)
                </h2>
                <p className="text-xs text-slate-600">
                  Wall damage patched, painted & floors cleaned before leaving
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Units
                </span>
                <span className="text-base font-black text-slate-900">
                  {allUnitsWithDate.length} Units
                </span>
              </div>
            </div>

            {allUnitsWithDate.length > 0 ? (
              <div className="space-y-5">
                {allUnitsWithDate.map(({ date, unit }) => {
                  const beforePhotos = unit.photos.filter((p) => p.type === 'before');
                  const afterPhotos = unit.photos.filter((p) => p.type === 'after');

                  return (
                    <div
                      key={unit.id}
                      className="border border-slate-300 rounded-xl p-4 bg-slate-50/60 text-xs shadow-sm"
                    >
                      {/* Unit Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 mb-2.5 gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-slate-950">
                            {unit.unitNumber || 'Unit'}
                          </span>
                          {unit.paintColor && (
                            <span className="text-xs text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 font-bold">
                              Paint: {unit.paintColor}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded text-[11px]">
                            {unit.isCompleted ? '✓ Completed & Cleaned' : 'Work Logged'}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-slate-500">
                            {date}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Damages Description */}
                      {unit.notes && (
                        <p className="text-xs text-slate-700 mb-3 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                          {unit.notes}
                        </p>
                      )}

                      {/* Side by side Before and After columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* BEFORE COLUMN */}
                        <div className="border border-rose-200 rounded-xl p-3 bg-rose-50/40">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-rose-700 text-xs tracking-wider uppercase">
                              [BEFORE · DAMAGE]
                            </span>
                            <span className="text-[10px] font-semibold text-rose-600">
                              {beforePhotos.length} photo{beforePhotos.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {beforePhotos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {beforePhotos.map((p) => (
                                <div
                                  key={p.id}
                                  className="aspect-4/3 bg-slate-200 rounded-lg overflow-hidden border border-rose-200 shadow-sm"
                                >
                                  <img
                                    src={p.dataUrl}
                                    alt="Before Damage"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-slate-400 italic text-xs bg-white/60 rounded-lg border border-dashed border-rose-200">
                              No before photo taken
                            </div>
                          )}
                        </div>

                        {/* AFTER COLUMN */}
                        <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/40">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-emerald-700 text-xs tracking-wider uppercase">
                              [AFTER · PAINTED]
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              {afterPhotos.length} photo{afterPhotos.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {afterPhotos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {afterPhotos.map((p) => (
                                <div
                                  key={p.id}
                                  className="aspect-4/3 bg-slate-200 rounded-lg overflow-hidden border border-emerald-200 shadow-sm"
                                >
                                  <img
                                    src={p.dataUrl}
                                    alt="After Painted"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-slate-400 italic text-xs bg-white/60 rounded-lg border border-dashed border-emerald-200">
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
              <div className="py-12 text-center text-slate-400 italic border border-dashed border-slate-300 rounded-xl bg-slate-50">
                No units or photos recorded this week.
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-3 mt-6">
              <span>FieldLog • Paint & Drywall Unit Tracker</span>
              <span>Page 2 of 2</span>
            </div>
          </div>
        )}

        {/* Floating Bottom Action Bar on Mobile */}
        <div className="sticky bottom-4 z-20 flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl text-sm shadow-2xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating PDF File...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Save / Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
