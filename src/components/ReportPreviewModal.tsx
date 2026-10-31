import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Check,
  FileText,
  ExternalLink,
  Loader2,
  Printer,
  Copy,
  Smartphone,
  Globe,
  Mail,
} from 'lucide-react';
import { DailyWorkLog, UserAccount, UnitWork } from '../types/worklog';
import { downloadOrShareWeeklyPdf, generateWeeklyReportPdf } from '../utils/pdfGenerator';
import {
  downloadStandaloneHtmlReport,
  openStandaloneHtmlReport,
} from '../utils/htmlReportGenerator';
import { generateBossEmailContent } from '../utils/storage';
import { formatTime12h } from '../utils/dateUtils';

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
  onPrint,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

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

  // Option 1: Standalone HTML report for Android Boss (Guaranteed 100% reliable)
  const handleDownloadHtmlReport = () => {
    try {
      downloadStandaloneHtmlReport({
        dates,
        logs,
        profile,
        supervisorSignature,
      });
      setExportStatus('Saved Web Report (.html)!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (err) {
      console.error('Failed to export HTML report:', err);
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleOpenHtmlReportTab = () => {
    openStandaloneHtmlReport({
      dates,
      logs,
      profile,
      supervisorSignature,
    });
  };

  // Option 2: Native Browser Print / Save as PDF
  const handleNativePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // Option 3: Copy Formatted Text for SMS / WhatsApp / Email
  const handleCopyText = () => {
    const emailData = generateBossEmailContent(dates, logs, profile);
    navigator.clipboard.writeText(emailData.body);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Option 4: Direct PDF file download
  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      setExportStatus('Building PDF...');
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 no-print">
      {/* iOS Modal Navigation Bar */}
      <div className="sticky top-0 z-30 bg-[#1c1c1e]/90 backdrop-blur-xl border-b border-[#2c2c2e] px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Close / Done Button */}
          <button
            onClick={onClose}
            className="text-[16px] font-normal text-[#0a84ff] active:opacity-60 transition-opacity cursor-pointer"
          >
            Done
          </button>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-[16px] font-bold text-white tracking-tight">
              Weekly Report Preview
            </h2>
            <p className="text-[11px] text-[#8e8e93]">
              Page 1 for Hours • {unitList.length} Units with All Photos Uncut
            </p>
          </div>

          {/* Quick Print Button */}
          <button
            onClick={handleNativePrint}
            className="text-[15px] font-semibold text-[#0a84ff] flex items-center gap-1 active:opacity-60 transition-opacity cursor-pointer"
            title="Print or Save as PDF using Chrome native print"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>

        {/* Boss Export Action Bar (Specially tuned for sending to Android Supervisor) */}
        <div className="mt-3 pt-3 border-t border-[#2c2c2e] max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">
              Send to Boss:
            </span>
            {exportStatus && (
              <span className="text-[11px] font-bold text-[#30d158] bg-[#30d158]/15 px-2 py-0.5 rounded-full">
                {exportStatus}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Recommendation for Android: Standalone Web Report */}
            <button
              onClick={handleDownloadHtmlReport}
              className="h-8 px-3 bg-[#0a84ff] hover:bg-[#0070e0] active:scale-95 text-white font-semibold text-[12px] rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Download standalone .html report. Opens natively in Android Google Chrome with all full-res photos!"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Web Report (.html for Android)</span>
            </button>

            {/* Open Full Report in New Tab */}
            <button
              onClick={handleOpenHtmlReportTab}
              className="h-8 px-2.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] active:scale-95 text-[#f2f2f7] font-medium text-[12px] rounded-full flex items-center gap-1.5 border border-[#38383a] transition-all cursor-pointer"
              title="Open full visual report in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#8e8e93]" />
              <span className="hidden sm:inline">Open in Tab</span>
            </button>

            {/* Copy SMS / Text summary */}
            <button
              onClick={handleCopyText}
              className="h-8 px-2.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] active:scale-95 text-[#f2f2f7] font-medium text-[12px] rounded-full flex items-center gap-1.5 border border-[#38383a] transition-all cursor-pointer"
              title="Copy formatted hours and unit breakdown to paste into text message or email"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#30d158]" />
                  <span className="text-[#30d158]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8e8e93]" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            {/* Direct PDF export button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="h-8 px-3 bg-[#2c2c2e] hover:bg-[#3a3a3c] active:scale-95 text-white font-medium text-[12px] rounded-full flex items-center gap-1.5 border border-[#38383a] transition-all cursor-pointer disabled:opacity-50"
              title="Download multi-page PDF document"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#8e8e93]" />
                  <span>Save PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable View for all pages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-black/60 flex flex-col items-center gap-8">
        {/* =========================================================================
            PAGE 1: THE HOURS (WEEKLY HOURS & SIGNATURES)
           ========================================================================= */}
        <div className="w-full max-w-2xl bg-white text-slate-900 rounded-[20px] shadow-2xl p-6 sm:p-8 border border-slate-200 relative">
          {/* Top Emerald Accent Ribbon */}
          <div className="h-1.5 bg-emerald-500 rounded-full w-full mb-4" />

          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-4 mb-5 gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                PAGE 1 OF {totalPages} · TIME & HOURS SUMMARY
              </span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 mt-1.5">
                Weekly Work & Unit Report
              </h1>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p>
                  Technician: <strong className="text-slate-900 text-sm">{profile.workerName}</strong>
                  {profile.email && <span className="text-slate-500"> ({profile.email})</span>}
                </p>
                <p>
                  Supervisor: <strong className="text-slate-900">{profile.bossName}</strong>
                  {profile.bossEmail && <span className="text-slate-500"> ({profile.bossEmail})</span>}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Work Week Period
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                {dates[0]} to {dates[6]}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 block mt-1">
                ✓ {unitList.length} Units Finished
              </span>
            </div>
          </div>

          {/* Section 1: Timesheet Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                1. Weekly Hours Breakdown
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Standard 30m unpaid lunch break deducted
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-left">Date / Day</th>
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
                          {formatTime12h(log.time?.startTime)}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-medium text-slate-800">
                          {formatTime12h(log.time?.endTime)}
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
            EVERY SINGLE PHOTO IS DISPLAYED — UNGROUPED & FULL RESOLUTION
           ========================================================================= */}
        {unitList.map((item, idx) => {
          const pageNum = 2 + idx;
          const { date, dayName, unit } = item;
          const beforePhotos = unit.photos.filter((p) => p.type === 'before');
          const afterPhotos = unit.photos.filter((p) => p.type === 'after');

          return (
            <div
              key={unit.id + '-' + idx}
              className="w-full max-w-2xl bg-white text-slate-900 rounded-[20px] shadow-2xl p-6 sm:p-8 border border-slate-200 relative"
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

              {/* DEDICATED FULL-WIDTH BEFORE & AFTER PHOTO SECTIONS */}
              <div className="space-y-6">
                {/* ---------------- [BEFORE · DAMAGE] ---------------- */}
                <div className="border border-rose-200 rounded-2xl p-4 bg-rose-50/40">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-rose-700 text-xs tracking-wider uppercase">
                      [BEFORE · DAMAGE & PREP PHOTOS]
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                      {beforePhotos.length} photo{beforePhotos.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {beforePhotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {beforePhotos.map((photo, pIdx) => (
                        <div
                          key={photo.id}
                          className="w-full bg-slate-950 rounded-xl overflow-hidden border border-rose-200 shadow-sm relative flex flex-col items-center justify-center"
                        >
                          <div className="w-full h-[220px] flex items-center justify-center p-1 bg-black">
                            <img
                              src={photo.dataUrl}
                              alt={`Before Damage Photo ${pIdx + 1}`}
                              className="max-h-full max-w-full object-contain mx-auto"
                            />
                          </div>
                          <div className="absolute top-2 left-2 bg-rose-950/90 border border-rose-400 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">
                            Photo #{pIdx + 1}
                          </div>
                          {photo.caption && (
                            <div className="w-full bg-black/90 px-2.5 py-1 text-[11px] text-white border-t border-slate-800">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 italic text-xs bg-white/70 rounded-xl border border-dashed border-rose-200">
                      [ No before damage photo recorded ]
                    </div>
                  )}
                </div>

                {/* ---------------- [AFTER · PAINTED] ---------------- */}
                <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/40">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-emerald-700 text-xs tracking-wider uppercase">
                      [AFTER · PAINTED & CLEANED PHOTOS]
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      {afterPhotos.length} photo{afterPhotos.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {afterPhotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {afterPhotos.map((photo, pIdx) => (
                        <div
                          key={photo.id}
                          className="w-full bg-slate-950 rounded-xl overflow-hidden border border-emerald-200 shadow-sm relative flex flex-col items-center justify-center"
                        >
                          <div className="w-full h-[220px] flex items-center justify-center p-1 bg-black">
                            <img
                              src={photo.dataUrl}
                              alt={`After Painted Photo ${pIdx + 1}`}
                              className="max-h-full max-w-full object-contain mx-auto"
                            />
                          </div>
                          <div className="absolute top-2 left-2 bg-emerald-950/90 border border-emerald-400 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">
                            Photo #{pIdx + 1}
                          </div>
                          {photo.caption && (
                            <div className="w-full bg-black/90 px-2.5 py-1 text-[11px] text-white border-t border-slate-800">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 italic text-xs bg-white/70 rounded-xl border border-dashed border-emerald-200">
                      [ No after painted photo recorded ]
                    </div>
                  )}
                </div>
              </div>

              {/* Quality & Cleanliness Verification Bar */}
              <div className="mt-5 border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 flex flex-wrap justify-between items-center gap-2">
                <span className="text-slate-700">
                  Technician: <strong>{profile.workerName}</strong>
                </span>
                <span className="text-emerald-700 font-bold">
                  ✓ Wall Mudded, Paint Blended & Floors Swept Clean
                </span>
                <span className="text-slate-400 text-[10px]">
                  Page {pageNum} of {totalPages}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
