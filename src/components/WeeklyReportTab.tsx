import React, { useState } from 'react';
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
} from 'lucide-react';
import { DailyWorkLog, UserAccount, UnitPhoto } from '../types/worklog';
import { getWeekRange, shiftWeek, formatShortDate } from '../utils/dateUtils';
import { generateBossEmailContent } from '../utils/storage';
import { ReportPreviewModal } from './ReportPreviewModal';
import { downloadOrShareWeeklyPdf } from '../utils/pdfGenerator';

interface WeeklyReportTabProps {
  currentDate: string;
  logs: DailyWorkLog[];
  profile: UserAccount;
  selectedWeekStart?: string;
  onWeekChange?: (weekStart: string) => void;
  onSelectDate: (dateStr: string) => void;
  onOpenPhotoViewer: (photo: UnitPhoto, unitLabel: string) => void;
  onSaveLogs: (logs: DailyWorkLog[]) => void;
}

export const WeeklyReportTab: React.FC<WeeklyReportTabProps> = ({
  currentDate,
  logs,
  profile,
  selectedWeekStart,
  onWeekChange,
  onSelectDate,
  onOpenPhotoViewer,
  onSaveLogs,
}) => {
  const [internalWeekStart, setInternalWeekStart] = useState<string>(() => {
    return selectedWeekStart || getWeekRange(currentDate || new Date()).start;
  });

  const weekStart = selectedWeekStart || internalWeekStart;
  const setWeekStart = (w: string) => {
    setInternalWeekStart(w);
    if (onWeekChange) onWeekChange(w);
  };

  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [signerName, setSignerName] = useState(profile.bossName);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloadedStatus, setPdfDownloadedStatus] = useState<string | null>(null);

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
    window.open(emailData.mailtoUrl, '_blank');
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

    onSaveLogs(updated);
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

      {/* iOS Inset Group: Export Actions */}
      <div className="space-y-1.5">
        <div className="px-4">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8e8e93]">
            Export & Send to Boss ({profile.bossName})
          </span>
        </div>

        <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 overflow-hidden divide-y divide-[#38383a]/40 shadow-sm">
          {/* Primary Row: Direct PDF Download */}
          <div
            onClick={handleDownloadPdf}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#ff453a]/20 text-[#ff453a] flex items-center justify-center font-bold">
                <Download className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white block">Download PDF Report</span>
                <span className="text-[11px] text-[#8e8e93]">Includes weekly hours & all unit photos</span>
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
                <span className="text-[13px] font-semibold text-[#0a84ff]">Download</span>
              )}
            </div>
          </div>

          {/* Row 2: View & Scroll Full Report */}
          <div
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#0a84ff]/20 text-[#0a84ff] flex items-center justify-center font-bold">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white block">View & Scroll Report</span>
                <span className="text-[11px] text-[#8e8e93]">Interactive multi-page preview</span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
          </div>

          {/* Row 3: Email Supervisor */}
          <div
            onClick={handleEmailBoss}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#5856d6]/20 text-[#5856d6] flex items-center justify-center font-bold">
                <Mail className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white block">Email Boss</span>
                <span className="text-[11px] text-[#8e8e93]">{profile.bossEmail || 'Send prefilled email'}</span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
          </div>

          {/* Row 4: Copy Summary */}
          <div
            onClick={handleCopySummary}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#252528] active:bg-[#2c2c2e] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#636366]/30 text-white flex items-center justify-center font-bold">
                <Copy className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white block">Copy Text Summary</span>
                <span className="text-[11px] text-[#8e8e93]">Paste into iMessage or SMS</span>
              </div>
            </div>

            {copiedText ? (
              <span className="text-[12px] font-semibold text-[#30d158]">Copied!</span>
            ) : (
              <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
            )}
          </div>
        </div>
      </div>

      {/* Daily Shifts & Units Inset Table */}
      <div className="space-y-1.5">
        <div className="px-4">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8e8e93]">
            Shifts & Units This Week
          </span>
        </div>

        <div className="bg-[#1c1c1e] rounded-[16px] border border-[#2c2c2e]/70 overflow-hidden divide-y divide-[#38383a]/40 shadow-sm">
          {dates.map((dateStr) => {
            const log = logs.find((l) => l.date === dateStr);
            const dayName = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const isExpanded = expandedDay === dateStr;

            return (
              <div key={dateStr} className="transition-colors">
                <div
                  onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#252528] active:bg-[#2c2c2e]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#2c2c2e] flex items-center justify-center text-[#8e8e93] font-semibold text-xs">
                      {dayName.slice(0, 3)}
                    </div>
                    <div>
                      <span className="text-[14px] font-semibold text-white block">{dayName}</span>
                      <span className="text-[11px] text-[#8e8e93]">
                        {log ? `${log.units.length} unit${log.units.length === 1 ? '' : 's'}` : 'Off Duty'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {log ? (
                      <span className="text-[15px] font-bold text-white font-mono-numbers">
                        {log.time.totalHours.toFixed(1)} <span className="text-[12px] font-normal text-[#8e8e93]">hrs</span>
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#636366] font-mono-numbers">0.0</span>
                    )}
                    <div className="text-[#8e8e93]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-3 bg-[#161618] border-t border-[#2c2c2e] space-y-3">
                    {log && log.units.length > 0 ? (
                      <div className="space-y-2">
                        {log.units.map((unit) => {
                          const before = unit.photos.filter((p) => p.type === 'before');
                          const after = unit.photos.filter((p) => p.type === 'after');

                          return (
                            <div
                              key={unit.id}
                              className="p-3 bg-[#1c1c1e] rounded-[12px] border border-[#2c2c2e] space-y-1.5"
                            >
                              <div className="flex justify-between items-center text-[13px] font-bold text-white">
                                <span>{unit.unitNumber || 'Unit'}</span>
                                {unit.paintColor && (
                                  <span className="text-[11px] font-normal text-[#8e8e93]">
                                    {unit.paintColor}
                                  </span>
                                )}
                              </div>
                              {unit.notes && (
                                <p className="text-[12px] text-[#8e8e93]">{unit.notes}</p>
                              )}

                              {/* Mini Photo Proof Strip */}
                              {(before.length > 0 || after.length > 0) && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[10px] font-semibold text-[#8e8e93]">
                                    Photos ({before.length + after.length}):
                                  </span>
                                  <div className="flex gap-1.5 overflow-x-auto">
                                    {before.slice(0, 3).map((p) => (
                                      <div
                                        key={p.id}
                                        onClick={() => onOpenPhotoViewer(p, unit.unitNumber)}
                                        className="w-10 h-10 rounded-[6px] overflow-hidden bg-black border border-[#ff453a]/40 shrink-0 cursor-pointer"
                                      >
                                        <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                    {after.slice(0, 3).map((p) => (
                                      <div
                                        key={p.id}
                                        onClick={() => onOpenPhotoViewer(p, unit.unitNumber)}
                                        className="w-10 h-10 rounded-[6px] overflow-hidden bg-black border border-[#30d158]/40 shrink-0 cursor-pointer"
                                      >
                                        <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
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
                        onClick={() => onSelectDate(dateStr)}
                        className="px-3 py-1.5 bg-[#2c2c2e] hover:bg-[#38383a] text-[#0a84ff] rounded-[9px] text-[12px] font-semibold transition-colors cursor-pointer"
                      >
                        Edit {dayName}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* iOS Bottom Sheet: Supervisor Sign-Off Modal */}
      {showSignoffModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1c1c1e] border-t sm:border border-[#38383a] rounded-t-[24px] sm:rounded-[20px] p-5 space-y-4 shadow-2xl">
            {/* Grab Handle */}
            <div className="w-9 h-1 bg-[#8e8e93]/40 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

            <div className="flex items-center gap-2 text-[#30d158]">
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
              <h3 className="text-[17px] font-bold text-white">Supervisor Approval</h3>
            </div>
            <p className="text-[13px] text-[#8e8e93]">
              Verify and approve {profile.workerName}'s timesheet ({totalHours.toFixed(1)} hrs, {totalUnitsCount} units finished) for {dates[0]} to {dates[6]}.
            </p>

            <div>
              <label className="block text-[12px] font-semibold text-[#8e8e93] mb-1.5">
                Supervisor Name
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full bg-[#2c2c2e] border border-[#3a3a3c] rounded-[12px] px-3.5 py-2.5 text-[15px] text-white focus:outline-none focus:border-[#0a84ff]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#38383a]/60">
              <button
                type="button"
                onClick={() => setShowSignoffModal(false)}
                className="px-4 py-2 text-[14px] text-[#8e8e93] hover:text-white cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveWeek}
                className="px-5 py-2.5 bg-[#30d158] hover:bg-[#28b84d] text-black font-bold text-[14px] rounded-[12px] shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Approve Week
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
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
        onPrint={() => {
          setShowPreviewModal(false);
          setTimeout(() => {
            window.print();
          }, 150);
        }}
      />
    </div>
  );
};
