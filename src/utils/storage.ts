import { DailyWorkLog, UserAccount, UnitWork, UnitPhoto } from '../types/worklog';
import { getTodayISODate, calculateHours, getWeekRange, formatDisplayDate, formatTime12h } from './dateUtils';
import { RECOVERED_UNIT_1324_LOG, TBRRABBITBIZ_WEEK_LOGS } from './recoveredData';
import { idbGet, idbSet } from './indexedDb';

const STORAGE_KEY_LOGS = 'paint_patch_worklog_v3';
const STORAGE_KEY_AUTH = 'paint_patch_auth_v3';
const STORAGE_KEY_BACKUPS = 'paint_patch_snapshots_v1';

export const DEFAULT_USER: UserAccount = {
  id: 'user-default',
  email: 'tbrrabbitbiz@gmail.com',
  workerName: 'Coleby Braddy',
  bossName: 'Jermaine',
  bossEmail: 'tbrrabbitbiz@gmail.com',
};

export interface WorkLogSnapshot {
  id: string;
  timestamp: number;
  label: string;
  unitCount: number;
  totalHours: number;
  logs: DailyWorkLog[];
}

export function getStoredAuth(): { token: string | null; user: UserAccount } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.user) {
        return {
          token: parsed.token || null,
          user: {
            ...DEFAULT_USER,
            ...parsed.user,
            workerName: parsed.user.workerName || 'Coleby Braddy',
            bossName: parsed.user.bossName || 'Jermaine',
            bossEmail: parsed.user.bossEmail || 'tbrrabbitbiz@gmail.com',
          },
        };
      }
    }
  } catch (e) {
    console.error('Failed reading auth state', e);
  }
  return { token: null, user: DEFAULT_USER };
}

export function saveStoredAuth(token: string | null, user: UserAccount): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ token, user }));
  } catch (e) {
    console.error('Failed saving auth state', e);
  }
}

export function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

export async function deleteAccountAndResetData(token: string | null): Promise<void> {
  if (token) {
    try {
      await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.warn('Server delete account error:', err);
    }
  }

  // Clear all local storage keys
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_BACKUPS);
    localStorage.removeItem('has_seen_fieldlog_tutorial');
  } catch (e) {
    console.warn('Error clearing localStorage during account deletion', e);
  }

  // Clear IndexedDB
  try {
    await idbSet(STORAGE_KEY_LOGS, []);
    await idbSet('snapshots', []);
  } catch (e) {
    console.warn('Error clearing IndexedDB during account deletion', e);
  }
}

/**
 * Check if logs contain the unwanted dummy demo units (Unit 304, Unit 306, etc.)
 */
export function isDemoData(logs: DailyWorkLog[]): boolean {
  if (!Array.isArray(logs) || logs.length === 0) return false;
  return logs.some((l) =>
    l.units.some(
      (u) =>
        u.unitNumber === 'Unit 304' ||
        u.unitNumber === 'Unit 306' ||
        u.unitNumber === 'Unit 212' ||
        u.unitNumber === 'Unit 108' ||
        (u.notes && u.notes.includes('20min hot mud, sanded, rolled paint')) ||
        (u.notes && u.notes.includes('Touched up scuffs in hallway'))
    )
  );
}

/**
 * Automatic rolling snapshots so user work is never lost again
 */
export function getSavedSnapshots(): WorkLogSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKUPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Could not read snapshots', e);
  }
  return [];
}

function stripHeavyDataForSnapshot(logs: DailyWorkLog[]): DailyWorkLog[] {
  return logs.map((l) => ({
    ...l,
    units: l.units.map((u) => ({
      ...u,
      photos: u.photos.map((p) => ({
        id: p.id,
        type: p.type,
        timestamp: p.timestamp,
        caption: p.caption,
        dataUrl: p.dataUrl ? p.dataUrl.slice(0, 80) + '...[thumbnail]' : '',
      })),
    })),
  }));
}

export function saveSnapshot(logs: DailyWorkLog[], label: string): void {
  try {
    if (!Array.isArray(logs) || logs.length === 0) return;
    const currentSnapshots = getSavedSnapshots();
    const totalHours = logs.reduce((acc, l) => acc + (l.time?.totalHours || 0), 0);
    const unitCount = logs.reduce((acc, l) => acc + (l.units?.length || 0), 0);

    const lightweightLogs = stripHeavyDataForSnapshot(logs);
    const newSnapshot: WorkLogSnapshot = {
      id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      label,
      unitCount,
      totalHours,
      logs: lightweightLogs,
    };

    // Store up to 5 lightweight snapshots in localStorage without consuming quota
    const updated = [newSnapshot, ...currentSnapshots].slice(0, 5);
    localStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(updated));
    idbSet('snapshots', [newSnapshot, ...currentSnapshots].slice(0, 20)).catch(() => {});
  } catch (e) {
    console.warn('Snapshot creation skipped', e);
  }
}

/**
 * Check older localStorage keys to recover previous work
 */
export function scanAndRecoverLegacyData(): DailyWorkLog[] | null {
  const legacyKeys = [
    'paint_patch_worklog_v2',
    'paint_patch_worklog_v1',
    'paint_patch_worklog',
    'paint_patch_logs',
    'fieldlog_logs',
    'worklogs',
  ];

  for (const k of legacyKeys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && !isDemoData(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Continue search
    }
  }
  return null;
}

export function syncTBRRabbitBizWeek(currentLogs: DailyWorkLog[]): DailyWorkLog[] {
  let updated = [...currentLogs];
  for (const tbrLog of TBRRABBITBIZ_WEEK_LOGS) {
    const idx = updated.findIndex((l) => l.date === tbrLog.date);
    if (idx >= 0) {
      if (tbrLog.date === '2026-10-26') {
        const existingUnits = updated[idx].units || [];
        const unit1324 = existingUnits.find((u) => u.unitNumber.includes('1324'));
        if (unit1324) {
          unit1324.unitNumber = '1324 2 Bedroom / Olympus';
          if (!unit1324.notes || !unit1324.notes.includes('Olympus')) {
            unit1324.notes = '1324 2 Bedroom / Olympus. ' + (unit1324.notes || 'Found small holes/drywall damage, patched with mud, sanded smooth, rolled paint, cleaned floors.');
          }
        } else {
          updated[idx].units = [...tbrLog.units, ...existingUnits];
        }
      } else {
        if (!updated[idx].units || updated[idx].units.length === 0) {
          updated[idx] = tbrLog;
        }
      }
    } else {
      updated.push(tbrLog);
    }
  }

  updated.sort((a, b) => a.date.localeCompare(b.date));
  return updated;
}

export function getStoredLogs(): DailyWorkLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // If it was overwritten by the demo button, automatically replace with TBRRABBITBIZ week
        if (isDemoData(parsed)) {
          console.warn('Detected unwanted demo data; replacing with TBRRABBITBIZ week.');
          saveStoredLogs(TBRRABBITBIZ_WEEK_LOGS, 'Automatic recovery of TBRRABBITBIZ week');
          return TBRRABBITBIZ_WEEK_LOGS;
        }
        if (parsed.length > 0) {
          const synced = syncTBRRabbitBizWeek(parsed);
          saveStoredLogs(synced, 'Synced TBRRABBITBIZ work week');
          return synced;
        }
      }
    }
  } catch (e) {
    console.error('Failed reading logs from localStorage', e);
  }

  // Check legacy keys
  const legacy = scanAndRecoverLegacyData();
  if (legacy && legacy.length > 0) {
    const synced = syncTBRRabbitBizWeek(legacy);
    saveStoredLogs(synced, 'Recovered from previous version and synced');
    return synced;
  }

  // Clean default: Return the full 5-day TBRRABBITBIZ work week
  saveStoredLogs(TBRRABBITBIZ_WEEK_LOGS, 'Restored initial TBRRABBITBIZ work week');
  return TBRRABBITBIZ_WEEK_LOGS;
}

export function saveStoredLogs(logs: DailyWorkLog[], reason = 'Save'): void {
  // 1. Asynchronously persist full data to IndexedDB (virtually unlimited quota)
  idbSet(STORAGE_KEY_LOGS, logs).catch(() => {});

  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (existingRaw && (reason.startsWith('Backup before') || reason.includes('submit') || reason.includes('Restored'))) {
      try {
        const existing = JSON.parse(existingRaw);
        if (Array.isArray(existing) && existing.length > 0 && !isDemoData(existing)) {
          saveSnapshot(existing, reason);
        }
      } catch {
        // ignore
      }
    }
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.warn('localStorage quota exceeded; cleaning bloated backups and retrying...', e);
    try {
      // Clear bloated backup snapshots and legacy keys from localStorage
      localStorage.removeItem(STORAGE_KEY_BACKUPS);
      localStorage.removeItem('paint_patch_worklog_v2');
      localStorage.removeItem('paint_patch_worklog_v1');
      localStorage.removeItem('paint_patch_worklog');
      localStorage.removeItem('paint_patch_logs');
      localStorage.removeItem('fieldlog_logs');
      localStorage.removeItem('worklogs');

      // Retry saving
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (innerErr) {
      console.warn('Fallback to lightweight localStorage cache; full data safe in IndexedDB and memory', innerErr);
      try {
        const trimmed = logs.map((log) => ({
          ...log,
          units: log.units.map((u) => ({
            ...u,
            photos: u.photos.slice(0, 3),
          })),
        }));
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(trimmed));
      } catch {
        // Handled: IndexedDB and active state maintain full data
      }
    }
  }
}

export async function getStoredLogsAsync(): Promise<DailyWorkLog[]> {
  try {
    const idbLogs = await idbGet<DailyWorkLog[]>(STORAGE_KEY_LOGS);
    if (Array.isArray(idbLogs) && idbLogs.length > 0 && !isDemoData(idbLogs)) {
      return syncTBRRabbitBizWeek(idbLogs);
    }
  } catch (err) {
    console.warn('IndexedDB read fallback to localStorage', err);
  }
  return getStoredLogs();
}

/**
 * Restore complete TBRRABBITBIZ work week (Monday - Friday) from user's schedule notes
 */
export function restoreTBRRabbitBizWeek(currentLogs: DailyWorkLog[]): DailyWorkLog[] {
  const mondayPhotos =
    currentLogs.find((l) => l.date === '2026-10-26')?.units?.[0]?.photos ||
    RECOVERED_UNIT_1324_LOG.units[0].photos;

  const mondayWithPhotos: DailyWorkLog = {
    ...RECOVERED_UNIT_1324_LOG,
    units: [
      {
        ...RECOVERED_UNIT_1324_LOG.units[0],
        unitNumber: '1324 2 Bedroom / Olympus',
        notes: '1324 2 Bedroom / Olympus. Found small holes/drywall damage, patched with mud, sanded smooth, rolled paint, cleaned floors.',
        photos: mondayPhotos,
      },
    ],
  };

  const freshWeek: DailyWorkLog[] = [
    mondayWithPhotos,
    TBRRABBITBIZ_WEEK_LOGS[1],
    TBRRABBITBIZ_WEEK_LOGS[2],
    TBRRABBITBIZ_WEEK_LOGS[3],
    TBRRABBITBIZ_WEEK_LOGS[4],
  ];

  const otherDates = currentLogs.filter((l) => l.date < '2026-10-26' || l.date > '2026-10-31');
  const merged = [...freshWeek, ...otherDates].sort((a, b) => a.date.localeCompare(b.date));

  saveStoredLogs(merged, 'Restored complete TBRRABBITBIZ work week');
  syncLogsToServer(merged);
  return merged;
}

/**
 * Restore user's real Unit 1324 log from Monday Oct 26 (backward-compatible)
 */
export function restoreUserUnit1324(currentLogs: DailyWorkLog[]): DailyWorkLog[] {
  return restoreTBRRabbitBizWeek(currentLogs);
}

/**
 * Rollback to a saved snapshot
 */
export function restoreFromSnapshot(snapshotId: string): DailyWorkLog[] | null {
  const snapshots = getSavedSnapshots();
  const target = snapshots.find((s) => s.id === snapshotId);
  if (target && Array.isArray(target.logs)) {
    saveStoredLogs(target.logs, `Restored snapshot: ${target.label}`);
    return target.logs;
  }
  return null;
}

export function getLogForDate(dateStr: string, logs: DailyWorkLog[]): DailyWorkLog {
  const existing = logs.find((l) => l.date === dateStr);
  if (existing) return existing;

  const hours = calculateHours('07:30', '16:00', 30);
  return {
    id: `log-${dateStr}-${Date.now().toString(36)}`,
    date: dateStr,
    time: {
      startTime: '07:30',
      endTime: '16:00',
      lunchDeductionMinutes: 30,
      totalHours: hours.totalHours,
      overtimeHours: hours.overtimeHours,
    },
    status: 'Draft',
    units: [],
  };
}

export function saveOrUpdateLog(log: DailyWorkLog, logs: DailyWorkLog[]): DailyWorkLog[] {
  const index = logs.findIndex((l) => l.date === log.date);
  let updated: DailyWorkLog[];
  if (index >= 0) {
    updated = [...logs];
    updated[index] = log;
  } else {
    updated = [log, ...logs];
  }
  saveStoredLogs(updated, `Updated log for ${log.date}`);
  syncLogsToServer(updated);
  return updated;
}

export async function syncLogsToServer(logs: DailyWorkLog[]): Promise<boolean> {
  const { token } = getStoredAuth();
  if (!token) return false;

  try {
    const res = await fetch('/api/worklogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ logs }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Network sync to server deferred', err);
    return false;
  }
}

export async function fetchLogsFromServer(): Promise<DailyWorkLog[] | null> {
  const { token } = getStoredAuth();
  if (!token) return null;

  try {
    const res = await fetch('/api/worklogs', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.logs) && data.logs.length > 0 && !isDemoData(data.logs)) {
        saveStoredLogs(data.logs, 'Fetched from server account');
        return data.logs;
      }
    }
  } catch (err) {
    console.warn('Could not fetch logs from server', err);
  }
  return null;
}

export function generateBossEmailContent(
  dates: string[],
  logs: DailyWorkLog[],
  profile: UserAccount
): { subject: string; body: string; mailtoUrl: string } {
  const weekStart = formatDisplayDate(dates[0]);
  const weekEnd = formatDisplayDate(dates[6]);

  const subject = `Weekly Work & Units: ${profile.workerName} (${dates[0]} - ${dates[6]})`;

  let totalHours = 0;
  let totalOt = 0;
  const unitSummaries: string[] = [];

  const dailyLines = dates.map((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    const day = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });
    if (log) {
      totalHours += log.time.totalHours;
      totalOt += log.time.overtimeHours;

      log.units.forEach((u) => {
        const beforeCount = u.photos.filter((p) => p.type === 'before').length;
        const afterCount = u.photos.filter((p) => p.type === 'after').length;
        unitSummaries.push(
          `• [${dateStr}] ${u.unitNumber}: ${u.paintColor || 'Standard'} | ${u.notes || 'Patched and painted'} (${beforeCount} before pics, ${afterCount} after pics)`
        );
      });

      return `${day}: ${formatTime12h(log.time.startTime)} - ${formatTime12h(log.time.endTime, true)} (${log.time.totalHours.toFixed(1)} hrs) • ${u_count(log.units.length)}`;
    }
    return `${day}: Off`;
  });

  function u_count(count: number) {
    return `${count} unit${count === 1 ? '' : 's'}`;
  }

  const body = `Hi ${profile.bossName},

Here is my work log and units completed for the week of ${weekStart} to ${weekEnd}.

===================================
WEEKLY HOURS
===================================
Total Hours: ${totalHours.toFixed(1)} hrs (${(totalHours - totalOt).toFixed(1)} reg / ${totalOt.toFixed(1)} OT)

HOURS BY DAY:
${dailyLines.join('\n')}

UNITS COMPLETED (PATCHED & PAINTED):
-----------------------------------
${unitSummaries.length > 0 ? unitSummaries.join('\n') : 'No units recorded this week.'}

All before and after damage photos have been documented in the app.

Thanks,
${profile.workerName}`;

  const mailtoUrl = `mailto:${encodeURIComponent(profile.bossEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}
