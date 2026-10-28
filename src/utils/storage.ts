import { DailyWorkLog, UserAccount, UnitWork, UnitPhoto } from '../types/worklog';
import { getTodayISODate, calculateHours, getWeekRange, formatDisplayDate } from './dateUtils';
import { RECOVERED_UNIT_1324_LOG } from './recoveredData';

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

export function saveSnapshot(logs: DailyWorkLog[], label: string): void {
  try {
    if (!Array.isArray(logs) || logs.length === 0) return;
    const currentSnapshots = getSavedSnapshots();
    const totalHours = logs.reduce((acc, l) => acc + (l.time?.totalHours || 0), 0);
    const unitCount = logs.reduce((acc, l) => acc + (l.units?.length || 0), 0);

    const newSnapshot: WorkLogSnapshot = {
      id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      label,
      unitCount,
      totalHours,
      logs: JSON.parse(JSON.stringify(logs)),
    };

    // Keep up to 20 newest snapshots
    const updated = [newSnapshot, ...currentSnapshots].slice(0, 20);
    localStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(updated));
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

export function getStoredLogs(): DailyWorkLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // If it was overwritten by the demo button, automatically replace with user's recovered Unit 1324
        if (isDemoData(parsed)) {
          console.warn('Detected unwanted demo data; replacing with recovered Unit 1324 data.');
          const recovered = [RECOVERED_UNIT_1324_LOG];
          saveStoredLogs(recovered, 'Automatic recovery of Unit 1324');
          return recovered;
        }
        if (parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Failed reading logs from localStorage', e);
  }

  // Check legacy keys
  const legacy = scanAndRecoverLegacyData();
  if (legacy && legacy.length > 0) {
    saveStoredLogs(legacy, 'Recovered from previous version');
    return legacy;
  }

  // Clean default: Return the recovered real user Unit 1324 log (Coleby Braddy, Jermaine)
  const recovered = [RECOVERED_UNIT_1324_LOG];
  saveStoredLogs(recovered, 'Restored initial real work log');
  return recovered;
}

export function saveStoredLogs(logs: DailyWorkLog[], reason = 'Save'): void {
  try {
    // Take a snapshot before saving changes if we already have non-demo logs
    const existingRaw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (existingRaw) {
      try {
        const existing = JSON.parse(existingRaw);
        if (Array.isArray(existing) && existing.length > 0 && !isDemoData(existing)) {
          saveSnapshot(existing, `Backup before: ${reason}`);
        }
      } catch {
        // ignore
      }
    }
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed saving logs to localStorage', e);
  }
}

/**
 * Restore user's real Unit 1324 log from Monday Oct 26
 */
export function restoreUserUnit1324(currentLogs: DailyWorkLog[]): DailyWorkLog[] {
  const existingIndex = currentLogs.findIndex((l) => l.date === RECOVERED_UNIT_1324_LOG.date);
  let updated: DailyWorkLog[];

  if (existingIndex >= 0) {
    updated = [...currentLogs];
    // Check if Unit 1324 is already in units
    const hasUnit1324 = updated[existingIndex].units.some((u) => u.unitNumber.includes('1324'));
    if (!hasUnit1324) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        time: RECOVERED_UNIT_1324_LOG.time,
        units: [...RECOVERED_UNIT_1324_LOG.units, ...updated[existingIndex].units],
      };
    } else {
      updated[existingIndex] = RECOVERED_UNIT_1324_LOG;
    }
  } else {
    updated = [RECOVERED_UNIT_1324_LOG, ...currentLogs];
  }

  saveStoredLogs(updated, 'Restored Unit 1324 with photos');
  return updated;
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

      return `${day}: ${log.time.startTime} - ${log.time.endTime} (${log.time.totalHours.toFixed(1)} hrs) • ${u_count(log.units.length)}`;
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
