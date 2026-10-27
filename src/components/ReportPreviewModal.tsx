import React, { useState } from 'react';
import { X, Download, Share2, Check, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { DailyWorkLog, UserAccount, UnitWork } from '../types/worklog';
import { downloadOrShareWeeklyPdf, generateWeeklyReportPdf } from '../utils/pdfGenerator';

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

interface UnitWithDate {
  date: string;
  dayName: string;
  unit: UnitWork;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  dates,
  logs,
  profile,
  supervisorSignature,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

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
        setExportStatus('Shared PDF!');
      } else {
        setExportStatus('PDF Saved!');
      }
      setTimeout(() => setExportStatus(null), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPdfBlob = async () => {
    try {
      setIsExporting(true);
      setExportStatus('Preparing view...');
      const doc = await generateWeeklyReportPdf({
        dates,
        logs,
        profile,
        supervisorSignature,
      });
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setExportStatus(null);
    } catch (err) {
      console.error('Failed to open PDF:', err);
      setExportStatus('Error opening');
      setTimeout(() => setExportStatus(null), 2500);
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
            <h2 className="text-sm font-extrabold text-white truncate">
              Weekly PDF Report ({totalPages} Pages Total)
            </h2>
            <p className="text-[11px] text-zinc-400 truncate">
              Page 1 for Hours • 1 Page Per Unit ({unitList.length} units with Before & After photos)
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
                <span>Generating...</span>
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
            onClick={handleOpenPdfBlob}
            disabled={isExporting}
            className="hidden sm:flex py-2 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 font-semibold rounded-xl text-xs active:scale-95 transition-all items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Open generated PDF file in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>Open in Tab</span>
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

      {/* Sub-header banner */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-400">
        <span className="font-semibold text-zinc-300">
          Document Structure: 1 page for hours + 1 full page per unit with photos
        </span>
        <span className="text-[11px] text-zinc-500">
          ↓ Scroll through all {totalPages} pages below
        </span>
      </div>

      {/* Main Scrollable View for all pages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-zinc-950/80 flex flex-col items-center gap-8">
        {/* =========================================================================
            PAGE 1: THE HOURS (WEEKLY HOURS & SIGNATURES)
           ========================================================================= */}
        <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-5 sm:p-8 border border-slate-200 relative">
          {/* Top Emerald Accent Ribbon */}
          <div className="h-1.5 bg-emerald-500 rounded-full w-full mb-4" />

          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-4 mb-5 gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                PAGE 1 OF {totalPages} · WEEKLY HOURS
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
                Work Week Period
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 block">
                {dates[0]} to {dates[6]}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">
                {unitList.length} Units Finished ({totalPages} Pages Total)
              </span>
            </div>
          </div>

          {/* Section 1: Timesheet Table */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                1. Weekly Hours Breakdown
              </h3>
              <span className="text-[11px] text-slate-500">
                Daily clock in / out & 30m lunch deductions
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                    <th className="py-2.5 px-3 text-left font-bold">Date / Day</th>
                    <th className="py-2.5 px-2 text-center font-bold">Clock In</th>
                    <th className="py-2.5 px-2 text-center font-bold">Clock Out</th>
                    <th className="py-2.5 px-2 text-center font-bold">Lunch Break</th>
                    <th className="py-2.5 px-2 text-center font-bold">Units Serviced</th>
                    <th className="py-2.5 px-3 text-right font-bold">Total Net Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {dates.map((dateStr, idx) => {
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
                          {log.time?.startTime || '--:--'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-medium text-slate-800">
                          {log.time?.endTime || '--:--'}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600">
                          {log.time?.lunchDeductionMinutes || 30}m
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-900">
                          {log.units?.length || 0} unit{(log.units?.length || 0) === 1 ? '' : 's'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-emerald-800 text-xs sm:text-sm">
                          {(log.time?.totalHours || 0).toFixed(1)} hrs
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
                      {unitList.length} Units Finished
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm sm:text-base font-black text-slate-950">
                      {totalHours.toFixed(1)} hrs
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* KPI statistics cards */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Regular Hours:</span>
                <span className="font-bold text-slate-900">{totalRegular.toFixed(1)} hrs</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
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

          {/* Signatures Section strictly on Page 1 */}
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
                    : 'Pending supervisor review and sign-off.'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-3 mt-6">
            <span>FieldLog — Daily Paint & Drywall Unit Tracker</span>
            <span>Page 1 of {totalPages}</span>
          </div>
        </div>

        {/* =========================================================================
            SUBSEQUENT PAGES: 1 DEDICATED FULL PAGE PER UNIT DAY (WITH BEFORE/AFTER)
           ========================================================================= */}
        {unitList.map((item, idx) => {
          const pageNum = 2 + idx;
          const { date, dayName, unit } = item;
          const beforePhotos = unit.photos.filter((p) => p.type === 'before');
          const afterPhotos = unit.photos.filter((p) => p.type === 'after');

          return (
            <div
              key={unit.id + '-' + idx}
              className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-5 sm:p-8 border border-slate-200 relative"
            >
              {/* Top Accent Ribbon */}
              <div className="h-1.5 bg-rose-500 rounded-full w-full mb-4" />

              {/* Page Pill & Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-3 mb-4 gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                    PAGE {pageNum} OF {totalPages} · UNIT WORK & PHOTO PROOF
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 mt-1.5">
                    {unit.unitNumber || `Unit #${idx + 1}`}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {unit.paintColor && (
                      <span className="text-xs text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-300 font-bold">
                        Paint: {unit.paintColor}
                      </span>
                    )}
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                      ✓ Finished & Cleaned
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Day Serviced
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 block">
                    {dayName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block">
                    {date}
                  </span>
                </div>
              </div>

              {/* Work Scope / Damage Description Box */}
              <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <span className="font-black text-slate-800 uppercase tracking-wider block text-[11px] mb-1">
                  Scope & Repairs Completed:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {unit.notes && unit.notes.trim().length > 0
                    ? unit.notes
                    : 'Small drywall damages and holes patched with hot mud, sanded flush, painted with matching color, and floors swept/wiped clean.'}
                </p>
              </div>

              {/* DEDICATED LARGE BEFORE & AFTER PHOTO COLUMNS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ---------------- [BEFORE · DAMAGE] ---------------- */}
                <div className="border border-rose-200 rounded-2xl p-3.5 bg-rose-50/40">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="font-black text-rose-700 text-xs tracking-wider uppercase">
                      [BEFORE · DAMAGE]
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                      {beforePhotos.length} photo{beforePhotos.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {beforePhotos.length > 0 ? (
                    <div className="photo-grid photos-container">
                      {beforePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="w-full min-h-[160px] max-h-[260px] bg-slate-950 rounded-xl overflow-hidden border border-rose-200 shadow-sm relative flex items-center justify-center p-1"
                        >
                          <img
                            src={photo.dataUrl}
                            alt="Before Damage"
                            className="max-h-[240px] w-auto max-w-full object-contain mx-auto"
                          />
                          {photo.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/85 px-2.5 py-1 text-[11px] text-white">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 italic text-xs bg-white/70 rounded-xl border border-dashed border-rose-200">
                      [ No before damage photo recorded ]
                    </div>
                  )}
                </div>

                {/* ---------------- [AFTER · PAINTED] ---------------- */}
                <div className="border border-emerald-200 rounded-2xl p-3.5 bg-emerald-50/40">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="font-black text-emerald-700 text-xs tracking-wider uppercase">
                      [AFTER · PAINTED]
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      {afterPhotos.length} photo{afterPhotos.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {afterPhotos.length > 0 ? (
                    <div className="photo-grid photos-container">
                      {afterPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="w-full min-h-[160px] max-h-[260px] bg-slate-950 rounded-xl overflow-hidden border border-emerald-200 shadow-sm relative flex items-center justify-center p-1"
                        >
                          <img
                            src={photo.dataUrl}
                            alt="After Painted"
                            className="max-h-[240px] w-auto max-w-full object-contain mx-auto"
                          />
                          {photo.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/85 px-2.5 py-1 text-[11px] text-white">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 italic text-xs bg-white/70 rounded-xl border border-dashed border-emerald-200">
                      [ No after painted photo recorded ]
                    </div>
                  )}
                </div>
              </div>

              {/* Quality & Cleanliness Verification */}
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-700 gap-1">
                <span className="font-bold">Quality & Floor Cleanup:</span>
                <span className="text-emerald-700 font-semibold">
                  ✓ Mud Sanded Smooth • ✓ Paint Blended • ✓ Floors Vacuumed & Wiped
                </span>
              </div>

              {/* Page Footer */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-3 mt-4">
                <span>FieldLog — Paint & Drywall Unit Tracker • {unit.unitNumber || 'Unit'}</span>
                <span>Page {pageNum} of {totalPages}</span>
              </div>
            </div>
          );
        })}

        {/* Floating Bottom Download Bar on Mobile */}
        <div className="sticky bottom-4 z-20 flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl text-sm shadow-2xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating {totalPages}-Page PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Save / Download PDF ({totalPages} Pages)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
