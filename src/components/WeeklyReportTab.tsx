import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Copy,
  Check,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Calendar,
  Share2,
  Smartphone,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import { DailyWorkLog, UserAccount, UnitPhoto } from '../types/worklog';
import { getWeekRange, shiftWeek, formatShortDate, formatTime12h } from '../utils/dateUtils';
import { generateBossEmailContent } from '../utils/storage';
import { ReportPreviewModal } from './ReportPreviewModal';
import { downloadOrShareWeeklyPdf } from '../utils/pdfGenerator';
import {
  downloadStandaloneHtmlReport,
  openStandaloneHtmlReport,
} from '../utils/htmlReportGenerator';

interface WeeklyReportTabProps {
  currentDate?: string;
  logs: DailyWorkLog[];
  profile: UserAccount;
  selectedWeekStart?: string;
  onWeekChange?: (weekStart: string) => void;
  onSelectWeekStart?: (weekStart: string) => void;
  onSelectDate?: (dateStr: string) => void;
  onOpenPhotoViewer?: (photo: UnitPhoto, unitLabel: string) => void;
  onSaveLogs?: (logs: DailyWorkLog[]) => void;
  onOpenAuth?: () => void;
  onUpdateProfile?: (updated: UserAccount) => void;
}

export const WeeklyReportTab: React.FC<WeeklyReportTabProps> = ({
  currentDate = '',
  logs,
  profile,
  selectedWeekStart,
  onWeekChange,
  onSelectWeekStart,
  onSelectDate,
  onOpenPhotoViewer,
  onSaveLogs,
  onUpdateProfile,
}) => {
  const [internalWeekStart, setInternalWeekStart] = useState<string>(() => {
    return selectedWeekStart || getWeekRange(currentDate || new Date()).start;
  });

  const weekStart = selectedWeekStart || internalWeekStart;
  const setWeekStart = (w: string) => {
    setInternalWeekStart(w);
    if (onWeekChange) onWeekChange(w);
    if (onSelectWeekStart) onSelectWeekStart(w);
  };

  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditBossModal, setShowEditBossModal] = useState(false);
  const [bossNameInput, setBossNameInput] = useState(profile.bossName || 'Jermaine');
  const [bossEmailInput, setBossEmailInput] = useState(profile.bossEmail || 'tbrrabbitbiz@gmail.com');
  const [signerName, setSignerName] = useState(profile.bossName);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloadedStatus, setPdfDownloadedStatus] = useState<string | null>(null);
  const [htmlDownloadedStatus, setHtmlDownloadedStatus] = useState<string | null>(null);

  useEffect(() => {
    setBossNameInput(profile.bossName || '');
    setBossEmailInput(profile.bossEmail || '');
    setSignerName(profile.bossName || '');
  }, [profile.bossName, profile.bossEmail]);

  const handleSaveBossInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserAccount = {
      ...profile,
      bossName: bossNameInput.trim() || 'Supervisor',
      bossEmail: bossEmailInput.trim(),
    };
    if (onUpdateProfile) {
      onUpdateProfile(updatedUser);
    }
    setShowEditBossModal(false);
  };

  const weekRange = getWeekRange(weekStart);
  const dates = weekRange.dates;

  const handlePrevWeek = () => setWeekStart(shiftWeek(weekStart, -1));
  const handleNextWeek = () => setWeekStart(shiftWeek(weekStart, 1));
  const handleCurrentWeek = () => setWeekStart(getWeekRange(new Date()).start);

  let totalHours = 0;
  let totalRegular = 0;
  let totalOvertime = 0;
  let totalUnitsCount = 0;
  let totalPhotosCount = 0;

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log) {
      totalHours += log.time.totalHours;
      totalRegular += Math.min(8, log.time.totalHours);
      totalOvertime += log.time.overtimeHours;
      totalUnitsCount += log.units.length;
      log.units.forEach((u) => {
        totalPhotosCount += u.photos.length;
      });
    }
  });

  // Action 1: Standalone HTML report for Android Boss
  const handleDownloadHtmlReport = () => {
    try {
      downloadStandaloneHtmlReport({
        dates,
        logs,
        profile,
        supervisorSignature: isWeekApproved
          ? {
              signedBy: signerName || profile.bossName,
              signedAt: new Date().toISOString(),
            }
          : undefined,
      });
      setHtmlDownloadedStatus('Saved Web Report!');
      setTimeout(() => setHtmlDownloadedStatus(null), 3000);
    } catch (err) {
      console.error('Failed to export HTML report:', err);
      setHtmlDownloadedStatus('Failed');
      setTimeout(() => setHtmlDownloadedStatus(null), 3000);
    }
  };

  // Action 2: Direct PDF download
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setPdfDownloadedStatus('Building PDF...');
      const res = await downloadOrShareWeeklyPdf({
        dates,
        logs,
        profile,
        supervisorSignature: isWeekApproved
          ? {
              signedBy: signerName || profile.bossName,
              signedAt: new Date().toISOString(),
            }
          : undefined,
      });
      setPdfDownloadedStatus(res.shared ? 'Shared!' : 'Saved PDF!');
      setTimeout(() => setPdfDownloadedStatus(null), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setPdfDownloadedStatus('Export failed');
      setTimeout(() => setPdfDownloadedStatus(null), 3000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleEmailBoss = () => {
    const emailData = generateBossEmailContent(dates, logs, profile);
    window.location.href = emailData.mailtoUrl;
  };

  const handleCopySummary = () => {
    const emailData = generateBossEmailContent(dates, logs, profile);
    navigator.clipboard.writeText(emailData.body);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleApproveWeek = () => {
    const updated = logs.map((l) => {
      if (dates.includes(l.date)) {
        return {
          ...l,
          status: 'Approved' as const,
          supervisorSignature: {
            signedBy: signerName || profile.bossName,
            signedAt: new Date().toISOString(),
          },
        };
      }
      return l;
    });

    if (onSaveLogs) {
      onSaveLogs(updated);
    }
    setShowSignoffModal(false);
  };

  const isWeekApproved = dates.some((d) => {
    const l = logs.find((item) => item.date === d);
    return l?.status === 'Approved';
  });

  return (
    <div className="space-y-4">
      {/* iOS Week Picker Control */}
      <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevWeek}
            className="w-9 h-9 rounded-full bg-[#2c2c2e] hover:bg-[#38383a] text-[#0a84ff] active:opacity-60 transition-all flex items-center justify-center cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0a84ff] block">
              Work Week
            </span>
            <span className="text-[14px] font-bold text-white tracking-tight">
              {formatShortDate(dates[0])} – {formatShortDate(dates[6])}
            </span>
          </div>
          <button
            onClick={handleNextWeek}
            className="w-9 h-9 rounded-full bg-[#2c2c2e] hover:bg-[#38383a] text-[#0a84ff] active:opacity-60 transition-all flex items-center justify-center cursor-pointer"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCurrentWeek}
            className="px-3 py-1.5 text-[12px] font-semibold text-[#0a84ff] bg-[#2c2c2e] hover:bg-[#38383a] rounded-[9px] active:scale-95 transition-all cursor-pointer"
          >
            Current
          </button>

          {isWeekApproved ? (
            <span className="flex items-center gap-1 px-2.5 py-1.5 bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158] text-[12px] font-bold rounded-[9px]">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Approved
            </span>
          ) : (
            <button
              onClick={() => setShowSignoffModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#30d158] hover:bg-[#28b84d] text-black text-[12px] font-bold rounded-[9px] active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              Sign Off
            </button>
          )}
        </div>
      </div>

      {/* iOS Activity / Fitness Style Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Hours */}
        <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 p-3 text-center shadow-sm">
          <span className="text-[11px] font-medium text-[#8e8e93] block mb-0.5">Total Hours</span>
          <span className="text-[22px] font-bold text-white font-mono-numbers tracking-tight block">
            {totalHours.toFixed(1)}
          </span>
          <span className="text-[10px] text-[#8e8e93] font-medium block mt-0.5">
            {totalOvertime > 0 ? `+${totalOvertime.toFixed(1)}h OT` : 'Regular Time'}
          </span>
        </div>

        {/* Units */}
        <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 p-3 text-center shadow-sm">
          <span className="text-[11px] font-medium text-[#8e8e93] block mb-0.5">Units Serviced</span>
          <span className="text-[22px] font-bold text-[#0a84ff] font-mono-numbers tracking-tight block">
            {totalUnitsCount}
          </span>
          <span className="text-[10px] text-[#8e8e93] font-medium block mt-0.5">
            Finished units
          </span>
        </div>

        {/* Photos */}
        <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 p-3 text-center shadow-sm">
          <span className="text-[11px] font-medium text-[#8e8e93] block mb-0.5">Photo Proofs</span>
          <span className="text-[22px] font-bold text-[#30d158] font-mono-numbers tracking-tight block">
            {totalPhotosCount}
          </span>
          <span className="text-[10px] text-[#8e8e93] font-medium block mt-0.5">
            Before & after
          </span>
        </div>
      </div>

      {/* iOS Inset Group: Supervisor & Boss Details with Edit Option */}
      <div className="space-y-1.5">
        <div className="px-4 flex items-center justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8e8e93]">
            Supervisor & Email
          </span>
          <button
            type="button"
            onClick={() => setShowEditBossModal(true)}
            className="text-[13px] font-semibold text-[#0a84ff] active:opacity-60 flex items-center gap-1 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Edit Boss
          </button>
        </div>

        <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0a84ff]/20 text-[#0a84ff] flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-white block">
                  {profile.bossName || 'Jermaine'}
                </span>
                <span className="text-[10px] font-semibold text-[#8e8e93] bg-[#2c2c2e] px-1.5 py-0.5 rounded">
                  Boss
                </span>
              </div>
              <span className="text-[12px] text-[#8e8e93] font-mono block mt-0.5">
                {profile.bossEmail || 'tbrrabbitbiz@gmail.com'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEditBossModal(true)}
            className="px-3 py-1.5 bg-[#2c2c2e] hover:bg-[#38383a] text-[#0a84ff] text-[13px] font-semibold rounded-[9px] active:scale-95 transition-all cursor-pointer"
          >
            Edit
          </button>
        </div>
      </div>

      {/* iOS Inset Group: Export Actions Specifically Designed for Boss */}
      <div className="space-y-1.5">
        <div className="px-4 flex items-center justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8e8e93]">
            Export & Send to Boss ({profile.bossName})
          </span>
          <span className="text-[11px] text-[#30d158] font-semibold">12-Hour Timesheet</span>
        </div>

        <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 overflow-hidden divide-y divide-[#38383a]/40 shadow-sm">
          {/* PRIMARY OPTION: Official PDF Report (Never blocked by email, opens on Android & iPhone) */}
          <div
            onClick={handleDownloadPdf}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors bg-gradient-to-r from-[#0a84ff]/15 to-transparent"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#0a84ff] text-white flex items-center justify-center font-bold shadow-sm">
                <Download className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-bold text-white block">
                    Send / Download PDF Report (.pdf)
                  </span>
                  <span className="text-[9px] font-bold text-[#30d158] bg-[#30d158]/20 px-1.5 py-0.5 rounded">
                    RECOMMENDED FOR BOSS
                  </span>
                </div>
                <span className="text-[11px] text-[#8e8e93]">
                  12-hr timesheet on Page 1 + all unit photos • Never blocked by email
                </span>
              </div>
            </div>

            <div>
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 text-[#0a84ff] animate-spin" />
              ) : pdfDownloadedStatus ? (
                <span className="text-[12px] font-semibold text-[#30d158] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {pdfDownloadedStatus}
                </span>
              ) : (
                <span className="text-[13px] font-semibold text-[#0a84ff]">Get PDF</span>
              )}
            </div>
          </div>

          {/* Row 2: Email Supervisor (Whole timesheet in email body so boss gets it even without opening attachments) */}
          <div
            onClick={handleEmailBoss}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#30d158]/20 text-[#30d158] flex items-center justify-center font-bold">
                <Mail className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white block">
                  Email Timesheet to {profile.bossName}
                </span>
                <span className="text-[11px] text-[#8e8e93] truncate max-w-[220px]">
                  {profile.bossEmail || 'Full 12-hr timesheet & units written directly in email body'}
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
          </div>

          {/* Row 3: Copy SMS / WhatsApp Text Summary */}
          <div
            onClick={handleCopySummary}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#ff9f0a]/20 text-[#ff9f0a] flex items-center justify-center font-bold">
                <Copy className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white block">Copy Text for SMS / WhatsApp</span>
                <span className="text-[11px] text-[#8e8e93]">12-hour breakdown ready to text directly to Jermaine</span>
              </div>
            </div>

            {copiedText ? (
              <span className="text-[12px] font-semibold text-[#30d158] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Copied
              </span>
            ) : (
              <span className="text-[13px] font-semibold text-[#0a84ff]">Copy</span>
            )}
          </div>

          {/* Row 4: View & Print Full Report */}
          <div
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#bf5af2]/20 text-[#bf5af2] flex items-center justify-center font-bold">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white block">View & Print Full Report</span>
                <span className="text-[11px] text-[#8e8e93]">Review all pages with unstretched photos + 1-tap print</span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
          </div>

          {/* Row 5: Standalone Web Report (.html) */}
          <div
            onClick={handleDownloadHtmlReport}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors opacity-80 hover:opacity-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#8e8e93]/20 text-[#8e8e93] flex items-center justify-center font-bold">
                <Smartphone className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[14px] font-medium text-white block">
                  Save Web Report (.html)
                </span>
                <span className="text-[11px] text-[#8e8e93]">
                  Offline backup file (Note: Email apps often block .html attachments; use PDF or Email above)
                </span>
              </div>
            </div>

            <div>
              {htmlDownloadedStatus ? (
                <span className="text-[12px] font-semibold text-[#30d158] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {htmlDownloadedStatus}
                </span>
              ) : (
                <span className="text-[12px] font-medium text-[#8e8e93]">Save file</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* iOS Inset Group: Day-by-Day Breakdown */}
      <div className="space-y-1.5">
        <div className="px-4">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8e8e93]">
            Daily Breakdown & Units
          </span>
        </div>

        <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 overflow-hidden divide-y divide-[#38383a]/40 shadow-sm">
          {dates.map((dateStr) => {
            const log = logs.find((l) => l.date === dateStr);
            const isExpanded = expandedDay === dateStr;
            const [y, m, d] = dateStr.split('-').map(Number);
            const dayObj = new Date(y, m - 1, d);
            const dayName = dayObj.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = dayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const hours = log?.time.totalHours || 0;
            const units = log?.units || [];
            const hasActivity = hours > 0 || units.length > 0;

            return (
              <div key={dateStr} className="transition-colors">
                {/* Day Header Row */}
                <div
                  onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex flex-col items-center justify-center text-center font-mono-numbers ${
                        hasActivity ? 'bg-[#0a84ff]/20 text-[#0a84ff]' : 'bg-[#2c2c2e] text-[#8e8e93]'
                      }`}
                    >
                      <span className="text-[10px] font-bold leading-none">{dayName.slice(0, 3)}</span>
                      <span className="text-[12px] font-black leading-none mt-0.5">{dayObj.getDate()}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-white">{monthDay}</span>
                        {log?.status === 'Approved' && (
                          <span className="text-[10px] font-bold text-[#30d158] bg-[#30d158]/15 px-1.5 py-0.2 rounded">
                            Approved
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#8e8e93]">
                        {hasActivity
                          ? `${formatTime12h(log?.time.startTime)} – ${formatTime12h(log?.time.endTime, true)} • ${units.length} unit${
                              units.length === 1 ? '' : 's'
                            }`
                          : 'Off Duty'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[14px] font-bold font-mono-numbers text-white">
                      {hours > 0 ? `${hours.toFixed(1)}h` : '—'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#8e8e93]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#8e8e93]" />
                    )}
                  </div>
                </div>

                {/* Expanded Day Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-[#161618] border-t border-[#2c2c2e]/60 space-y-3">
                    {/* Time Summary */}
                    {hasActivity && log?.time && (
                      <div className="p-2.5 bg-[#1c1c1e] rounded-[12px] border border-[#2c2c2e] flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 text-[#8e8e93]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {formatTime12h(log.time.startTime)} to {formatTime12h(log.time.endTime, true)} ({log.time.lunchDeductionMinutes}m lunch)
                          </span>
                        </div>
                        <span className="font-bold text-white font-mono-numbers">
                          {log.time.totalHours.toFixed(1)} net hrs
                        </span>
                      </div>
                    )}

                    {/* Units Serviced */}
                    {units.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8e8e93] block">
                          Units Serviced ({units.length}):
                        </span>

                        {units.map((unit) => {
                          const before = unit.photos.filter((p) => p.type === 'before');
                          const after = unit.photos.filter((p) => p.type === 'after');

                          return (
                            <div
                              key={unit.id}
                              className="p-3 bg-[#1c1c1e] rounded-[12px] border border-[#2c2c2e] space-y-2"
                            >
                              <div className="flex justify-between items-center text-[13px] font-bold text-white">
                                <span>{unit.unitNumber || 'Unit'}</span>
                                {unit.paintColor && (
                                  <span className="text-[11px] font-normal text-[#8e8e93]">
                                    Paint: {unit.paintColor}
                                  </span>
                                )}
                              </div>
                              {unit.notes && (
                                <p className="text-[12px] text-[#8e8e93]">{unit.notes}</p>
                              )}

                              {/* Photo Proof Strip (Displays ALL photos without slicing!) */}
                              {(before.length > 0 || after.length > 0) && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex justify-between items-center text-[10px] font-semibold text-[#8e8e93]">
                                    <span>All Photos ({before.length + after.length}):</span>
                                    <span>Tap to view full resolution</span>
                                  </div>

                                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {before.map((p, idx) => (
                                      <div
                                        key={p.id}
                                        onClick={() => onOpenPhotoViewer && onOpenPhotoViewer(p, `${unit.unitNumber} (Before #${idx + 1})`)}
                                        className="w-16 h-16 rounded-[8px] overflow-hidden bg-black border border-[#ff453a]/60 shrink-0 cursor-pointer relative active:scale-95 transition-transform"
                                      >
                                        <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                                        <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-[#ff453a] font-bold text-center py-0.5">
                                          Before #{idx + 1}
                                        </span>
                                      </div>
                                    ))}
                                    {after.map((p, idx) => (
                                      <div
                                        key={p.id}
                                        onClick={() => onOpenPhotoViewer && onOpenPhotoViewer(p, `${unit.unitNumber} (After #${idx + 1})`)}
                                        className="w-16 h-16 rounded-[8px] overflow-hidden bg-black border border-[#30d158]/60 shrink-0 cursor-pointer relative active:scale-95 transition-transform"
                                      >
                                        <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                                        <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-[#30d158] font-bold text-center py-0.5">
                                          After #{idx + 1}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[#8e8e93] italic text-center py-2 text-xs">No units recorded for this day.</p>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onSelectDate && onSelectDate(dateStr)}
                        className="text-[12px] font-semibold text-[#0a84ff] hover:underline"
                      >
                        Edit This Day's Log →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Supervisor Sign-Off iOS Modal */}
      {showSignoffModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 p-0 sm:p-4">
          <div className="w-full max-w-sm bg-[#1c1c1e] rounded-t-[24px] sm:rounded-[20px] border border-[#2c2c2e] p-5 space-y-4 shadow-2xl">
            {/* Grabber */}
            <div className="w-9 h-1 rounded-full bg-[#3a3a3c] mx-auto sm:hidden" />

            <div className="text-center space-y-1">
              <h3 className="text-[18px] font-bold text-white tracking-tight">
                Supervisor Approval
              </h3>
              <p className="text-[12px] text-[#8e8e93]">
                Approve {totalHours.toFixed(1)} hours and {totalUnitsCount} completed units for {dates[0]} to {dates[6]}.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8e8e93]">
                Supervisor Name
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="e.g. Jermaine"
                className="w-full h-11 px-3.5 bg-[#2c2c2e] rounded-[10px] text-[14px] text-white border border-[#3a3a3c] focus:outline-none focus:border-[#0a84ff]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSignoffModal(false)}
                className="h-11 rounded-[12px] bg-[#2c2c2e] text-[#f2f2f7] font-semibold text-[14px] hover:bg-[#38383a] active:scale-98 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveWeek}
                className="h-11 rounded-[12px] bg-[#30d158] text-black font-bold text-[14px] hover:bg-[#28b84d] active:scale-98 transition-all shadow-md shadow-[#30d158]/20"
              >
                Sign & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Multi-Page Interactive Preview Modal */}
      {showPreviewModal && (
        <ReportPreviewModal
          isOpen={showPreviewModal}
          dates={dates}
          logs={logs}
          profile={profile}
          supervisorSignature={
            isWeekApproved
              ? {
                  signedBy: signerName || profile.bossName,
                  signedAt: new Date().toISOString(),
                }
              : undefined
          }
          onClose={() => setShowPreviewModal(false)}
          onPrint={() => window.print()}
          onUpdateProfile={onUpdateProfile}
        />
      )}
      {/* Edit Supervisor & Email Modal */}
      {showEditBossModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-[#1C1C1E] border-t sm:border border-[#2C2C2E] rounded-t-[28px] sm:rounded-[24px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-250">
            {/* Grab handle */}
            <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
              <div className="w-9 h-1 rounded-full bg-[#38383A]" />
            </div>

            {/* Nav Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C2E]">
              <button
                type="button"
                onClick={() => setShowEditBossModal(false)}
                className="text-[17px] text-[#0A84FF] active:opacity-60"
              >
                Cancel
              </button>
              <span className="text-[17px] font-semibold text-white">Edit Supervisor</span>
              <button
                type="button"
                onClick={handleSaveBossInfo}
                className="text-[17px] font-bold text-[#0A84FF] active:opacity-60"
              >
                Save
              </button>
            </div>

            <form onSubmit={handleSaveBossInfo} className="p-4 space-y-4">
              <div className="bg-[#2C2C2E]/60 rounded-[14px] border border-[#3A3A3C] divide-y divide-[#3A3A3C] overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <label className="text-[15px] font-medium text-[#8E8E93] w-28 shrink-0">
                    Boss Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bossNameInput}
                    onChange={(e) => setBossNameInput(e.target.value)}
                    placeholder="e.g. Jermaine"
                    className="w-full bg-transparent text-right text-[15px] text-white focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <label className="text-[15px] font-medium text-[#8E8E93] w-28 shrink-0">
                    Boss Email
                  </label>
                  <input
                    type="email"
                    required
                    value={bossEmailInput}
                    onChange={(e) => setBossEmailInput(e.target.value)}
                    placeholder="tbrrabbitbiz@gmail.com"
                    className="w-full bg-transparent text-right text-[15px] text-white focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-[12px] text-[#8E8E93] px-2 leading-relaxed">
                This supervisor name and email will be used on all weekly reports, PDF timesheets, HTML exports, and 1-tap emails.
              </p>

              <button
                type="submit"
                className="w-full py-3 bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white text-[16px] font-semibold rounded-[12px] transition-all shadow-sm cursor-pointer"
              >
                Update Supervisor & Email
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
