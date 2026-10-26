import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Mail,
  Copy,
  Check,
  Clock,
  Paintbrush,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DailyWorkLog, UserAccount, UnitPhoto } from '../types/worklog';
import { getWeekRange, shiftWeek, formatShortDate } from '../utils/dateUtils';
import { generateBossEmailContent } from '../utils/storage';
import { WeeklyPrintView } from './WeeklyPrintView';
import { ReportPreviewModal } from './ReportPreviewModal';

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

  const handlePrint = () => {
    window.print();
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
      <div className="no-print space-y-4">
        {/* Week Selector Bar */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                Weekly Report
              </span>
              <h2 className="text-sm font-extrabold text-white">
                {formatShortDate(dates[0])} – {formatShortDate(dates[6])}
              </h2>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCurrentWeek}
              className="px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 rounded-lg transition-colors"
            >
              This Week
            </button>
            {isWeekApproved ? (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg">
                <Check className="w-3.5 h-3.5" />
                Approved
              </span>
            ) : (
              <button
                onClick={() => setShowSignoffModal(true)}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30 transition-colors flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Boss Sign-off
              </button>
            )}
          </div>
        </div>

        {/* Weekly KPI Highlights */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 text-center">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-0.5">Total Hours</span>
            <span className="text-xl font-black text-white font-mono-numbers">
              {totalHours.toFixed(1)} <span className="text-xs font-normal text-zinc-500">hrs</span>
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              {totalRegular.toFixed(1)} reg • {totalOvertime.toFixed(1)} OT
            </span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 text-center">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-0.5">Units Finished</span>
            <span className="text-xl font-black text-emerald-400 font-mono-numbers">
              {totalUnitsCount}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              Patched & painted
            </span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 text-center">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-0.5">Photo Proofs</span>
            <span className="text-xl font-black text-white font-mono-numbers">
              {totalPhotosCount}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">
              Before / After pics
            </span>
          </div>
        </div>

        {/* Actions for Boss (NO SHEETS) */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-200">Send to Boss</span>
            <span className="text-zinc-500">{profile.bossName} ({profile.bossEmail || 'No email'})</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleEmailBoss}
              className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Email Boss</span>
            </button>

            <button
              onClick={() => setShowPreviewModal(true)}
              className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Daily Shifts & Units Accordion */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Shifts & Units This Week
          </h3>

          <div className="space-y-2">
            {dates.map((dateStr) => {
              const log = logs.find((l) => l.date === dateStr);
              const dayName = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const isExpanded = expandedDay === dateStr;

              return (
                <div
                  key={dateStr}
                  className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                    className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-white block">{dayName}</span>
                        <span className="text-[10px] text-zinc-500">
                          {log ? `${log.units.length} unit${log.units.length === 1 ? '' : 's'}` : 'Off'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {log ? (
                        <span className="text-sm font-bold text-white font-mono-numbers">
                          {log.time.totalHours.toFixed(1)} <span className="text-xs font-normal text-zinc-400">hrs</span>
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600 font-mono">0.0 hrs</span>
                      )}
                      <div className="text-zinc-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 text-xs space-y-3">
                      {log && log.units.length > 0 ? (
                        <div className="space-y-2.5">
                          {log.units.map((unit) => {
                            const before = unit.photos.filter((p) => p.type === 'before');
                            const after = unit.photos.filter((p) => p.type === 'after');

                            return (
                              <div
                                key={unit.id}
                                className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2"
                              >
                                <div className="flex justify-between items-center font-bold text-white">
                                  <span>{unit.unitNumber}</span>
                                  {unit.paintColor && (
                                    <span className="text-[11px] font-normal text-zinc-400">
                                      Color: {unit.paintColor}
                                    </span>
                                  )}
                                </div>
                                {unit.notes && (
                                  <p className="text-[11px] text-zinc-400">{unit.notes}</p>
                                )}

                                {/* Before & After Thumbnails */}
                                {(before.length > 0 || after.length > 0) && (
                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div>
                                      <span className="text-[10px] font-bold text-rose-400 block mb-1">
                                        Before ({before.length})
                                      </span>
                                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                                        {before.map((p) => (
                                          <div
                                            key={p.id}
                                            onClick={() => onOpenPhotoViewer(p, unit.unitNumber)}
                                            className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-800 cursor-pointer"
                                          >
                                            <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold text-emerald-400 block mb-1">
                                        After ({after.length})
                                      </span>
                                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                                        {after.map((p) => (
                                          <div
                                            key={p.id}
                                            onClick={() => onOpenPhotoViewer(p, unit.unitNumber)}
                                            className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-800 cursor-pointer"
                                          >
                                            <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-zinc-500 italic text-center py-2">No units recorded for this day.</p>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => onSelectDate(dateStr)}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
                        >
                          Open & Edit {dayName}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Supervisor Sign-Off Modal */}
      {showSignoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400">
              <UserCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Supervisor Approval</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Sign off on {profile.workerName}'s timesheet ({totalHours.toFixed(1)} hrs, {totalUnitsCount} units finished) for {dates[0]} to {dates[6]}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Supervisor Name
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowSignoffModal(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveWeek}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                Approve Week
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview & Scroll Modal */}
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
