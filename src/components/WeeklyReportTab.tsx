import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Mail,
  FileSpreadsheet,
  Copy,
  Check,
  Clock,
  Paintbrush,
  Camera,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { DailyWorkLog, UserAccount, WorkPhoto, UnitRepair } from '../types/worklog';
import { getWeekRange, shiftWeek, formatDisplayDate, formatShortDate } from '../utils/dateUtils';
import { exportWeekToCsv, generateBossEmailContent } from '../utils/storage';
import { WeeklyPrintView } from './WeeklyPrintView';

interface WeeklyReportTabProps {
  currentDate: string;
  logs: DailyWorkLog[];
  profile: UserAccount;
  onSelectDate: (dateStr: string) => void;
  onOpenPhotoViewer: (photo: WorkPhoto) => void;
  onSaveLogs: (logs: DailyWorkLog[]) => void;
}

export const WeeklyReportTab: React.FC<WeeklyReportTabProps> = ({
  currentDate,
  logs,
  profile,
  onSelectDate,
  onOpenPhotoViewer,
  onSaveLogs,
}) => {
  const [weekStart, setWeekStart] = useState<string>(() => {
    return getWeekRange(currentDate || new Date()).start;
  });

  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [signerName, setSignerName] = useState(profile.bossName);

  const weekRange = getWeekRange(weekStart);
  const dates = weekRange.dates;

  const handlePrevWeek = () => {
    setWeekStart(shiftWeek(weekStart, -1));
  };

  const handleNextWeek = () => {
    setWeekStart(shiftWeek(weekStart, 1));
  };

  const handleCurrentWeek = () => {
    setWeekStart(getWeekRange(new Date()).start);
  };

  // Compute stats
  let totalHours = 0;
  let totalRegular = 0;
  let totalOvertime = 0;
  let totalRepairsCount = 0;
  let totalPhotosCount = 0;
  const weekPhotos: { photo: WorkPhoto; repair?: UnitRepair; date: string }[] = [];
  const weekRepairs: { repair: UnitRepair; date: string }[] = [];

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log) {
      totalHours += log.time.totalHours;
      totalRegular += Math.min(8, log.time.totalHours);
      totalOvertime += log.time.overtimeHours;
      totalRepairsCount += log.repairs.length;
      totalPhotosCount += log.photos.length;

      log.repairs.forEach((r) => {
        weekRepairs.push({ repair: r, date: dateStr });
      });

      log.photos.forEach((p) => {
        const r = log.repairs.find((item) => item.id === p.repairId);
        weekPhotos.push({ photo: p, repair: r, date: dateStr });
      });
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    exportWeekToCsv(dates, logs, profile);
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
      {/* Printable Report View (Visible only during window.print) */}
      <WeeklyPrintView
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
      />

      <div className="no-print space-y-4">
        {/* Week Selector Bar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                Weekly Paint & Drywall Report
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {formatShortDate(dates[0])} – {formatShortDate(dates[6])}
              </h2>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 rounded-xl border border-neutral-700/80 transition-colors"
            >
              Current Week
            </button>
            {isWeekApproved ? (
              <span className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl">
                <Check className="w-3.5 h-3.5" />
                Boss Approved
              </span>
            ) : (
              <button
                onClick={() => setShowSignoffModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-colors flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Boss Sign-off
              </button>
            )}
          </div>
        </div>

        {/* Weekly KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-semibold">Total Hours</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono-numbers">
              {totalHours.toFixed(1)} <span className="text-xs font-normal text-neutral-400">hrs</span>
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">
              {totalRegular.toFixed(1)} reg • {totalOvertime.toFixed(1)} OT
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-semibold">Units Repaired</span>
              <Paintbrush className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white font-mono-numbers">
              {totalRepairsCount}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">
              Across {dates.filter((d) => logs.some((l) => l.date === d && l.repairs.length > 0)).length} days
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-semibold">Photo Proofs</span>
              <Camera className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-black text-white font-mono-numbers">
              {totalPhotosCount}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">
              Before / Damage & After
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-semibold">Overtime</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className={`text-xl font-black font-mono-numbers ${totalOvertime > 0 ? 'text-amber-400' : 'text-neutral-400'}`}>
              {totalOvertime.toFixed(1)} <span className="text-xs font-normal text-neutral-400">hrs</span>
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">
              {totalOvertime > 0 ? 'OT payable' : 'Standard week'}
            </div>
          </div>
        </div>

        {/* Action Toolbar for Boss Export */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-200">Export Report for Boss</span>
            <span className="text-[11px] text-neutral-400">
              Boss: {profile.bossName} ({profile.bossEmail || 'No email configured'})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs active:scale-[0.98] transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleEmailBoss}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 font-semibold rounded-xl text-xs active:scale-[0.98] transition-all"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Email Boss</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 font-semibold rounded-xl text-xs active:scale-[0.98] transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV Sheet</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 font-semibold rounded-xl text-xs active:scale-[0.98] transition-all"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Daily Breakdown List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-100">Daily Breakdown</h3>
            <span className="text-xs text-neutral-400 font-mono-numbers">
              {dates[0]} to {dates[6]}
            </span>
          </div>

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
                  className="bg-neutral-950 border border-neutral-800/80 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                    className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-neutral-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-20">
                        <span className="text-xs font-bold text-white block">{dayName}</span>
                        <span className="text-[10px] text-neutral-500">
                          {log ? log.time.laborCategory : 'Off Duty'}
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
                        {log ? (
                          <>
                            <span className="font-mono text-neutral-300">
                              {log.time.startTime} - {log.time.endTime}
                            </span>
                            <span>•</span>
                            <span>{log.repairs.length} repair{log.repairs.length === 1 ? '' : 's'}</span>
                            <span>•</span>
                            <span>{log.photos.length} photo{log.photos.length === 1 ? '' : 's'}</span>
                          </>
                        ) : (
                          <span className="italic text-neutral-500">No shift hours recorded</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {log ? (
                        <div className="text-right">
                          <span className="text-sm font-bold text-white font-mono-numbers">
                            {log.time.totalHours.toFixed(1)} <span className="text-[11px] font-normal text-neutral-400">hrs</span>
                          </span>
                          {log.time.overtimeHours > 0 && (
                            <span className="text-[10px] text-amber-400 block font-mono">
                              +{log.time.overtimeHours.toFixed(1)} OT
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500 font-mono">0.0 hrs</span>
                      )}

                      <div className="text-neutral-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3.5 bg-neutral-900/70 border-t border-neutral-800 text-xs space-y-3">
                      {log ? (
                        <>
                          <div>
                            <span className="font-semibold text-neutral-300 block mb-1.5">
                              Units & Repairs on {dayName}:
                            </span>
                            {log.repairs.length > 0 ? (
                              <div className="space-y-2">
                                {log.repairs.map((r) => (
                                  <div
                                    key={r.id}
                                    className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-300 space-y-1"
                                  >
                                    <div className="flex justify-between font-bold text-white">
                                      <span>{r.unitNumber} • {r.roomArea}</span>
                                      <span className="text-emerald-400 font-semibold">{r.repairStage}</span>
                                    </div>
                                    <div className="text-[11px] text-amber-400 font-medium">
                                      {r.damageType} {r.damageSize ? `(${r.damageSize})` : ''} • Color: {r.paintColor} [{r.paintSheen}]
                                    </div>
                                    {r.workDescription && (
                                      <p className="text-[11px] text-neutral-400 mt-0.5">{r.workDescription}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-neutral-500 italic">No specific units recorded.</p>
                            )}
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => onSelectDate(dateStr)}
                              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold border border-amber-500/20 transition-colors"
                            >
                              Open & Edit {dayName} Log
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-neutral-400">No work log created for this day.</p>
                          <button
                            onClick={() => onSelectDate(dateStr)}
                            className="mt-2 px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded-lg text-xs hover:bg-amber-400"
                          >
                            Create Log for {dayName}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Before & After Photos Gallery */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-100">
              Weekly Before / Damage & After Proof ({weekPhotos.length})
            </h3>
            <span className="text-xs text-neutral-400">Tap to inspect</span>
          </div>

          {weekPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {weekPhotos.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenPhotoViewer(item.photo)}
                  className="bg-neutral-950 border border-neutral-800/80 rounded-xl overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-colors"
                >
                  <div className="aspect-4/3 bg-neutral-900 overflow-hidden relative">
                    <img
                      src={item.photo.dataUrl}
                      alt={item.photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span
                      className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        item.photo.category === 'After / Finished'
                          ? 'bg-emerald-600 text-white'
                          : item.photo.category === 'Damage / Hole' || item.photo.category === 'Before Repair'
                          ? 'bg-rose-600 text-white'
                          : 'bg-black/70 text-amber-300'
                      }`}
                    >
                      {item.photo.category}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-neutral-200 truncate">
                      {item.photo.caption || 'Photo'}
                    </p>
                    <p className="text-[9px] text-neutral-500">
                      {item.date} {item.repair ? `• ${item.repair.unitNumber}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-500 text-xs italic">
              No photos attached to logs in this week.
            </div>
          )}
        </div>
      </div>

      {/* Supervisor Sign-Off Modal */}
      {showSignoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400">
              <UserCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Supervisor Weekly Sign-Off</h3>
            </div>
            <p className="text-xs text-neutral-400">
              Sign off on {profile.workerName}'s timesheet ({totalHours.toFixed(1)} total hours, {weekRepairs.length} units repaired) for {dates[0]} to {dates[6]}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Supervisor Full Name
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-neutral-400">
                <span>Regular Hours:</span>
                <span className="font-mono text-white">{totalRegular.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Overtime Hours:</span>
                <span className="font-mono text-amber-400 font-bold">{totalOvertime.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Total Unit Repairs:</span>
                <span className="font-mono text-white">{weekRepairs.length} repairs</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowSignoffModal(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveWeek}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                Approve & Stamp Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
