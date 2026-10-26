import { DailyWorkLog, UserAccount, UnitWork, UnitPhoto } from '../types/worklog';
import { getTodayISODate, calculateHours, getWeekRange, formatDisplayDate } from './dateUtils';
import { createModernSamplePhoto } from './photoUtils';

const STORAGE_KEY_LOGS = 'paint_patch_worklog_v3';
const STORAGE_KEY_AUTH = 'paint_patch_auth_v3';

export const DEFAULT_USER: UserAccount = {
  id: 'user-demo',
  email: 'painter@worklog.app',
  workerName: 'Alex Rivera',
  bossName: 'Dave Miller',
  bossEmail: 'dave@propertymanagement.com',
};

export function getStoredAuth(): { token: string | null; user: UserAccount } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.user) {
        return { token: parsed.token || null, user: parsed.user };
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

export function generateSampleLogs(): DailyWorkLog[] {
  const currentWeek = getWeekRange(new Date());
  const dates = currentWeek.dates; // Monday to Sunday

  const mon = dates[0];
  const tue = dates[1];
  const wed = dates[2];
  const thu = dates[3];

  return [
    {
      id: `log-${mon}`,
      date: mon,
      time: {
        startTime: '07:30',
        endTime: '16:00',
        lunchDeductionMinutes: 30,
        totalHours: 8.0,
        overtimeHours: 0,
      },
      status: 'Submitted',
      units: [
        {
          id: 'u-1',
          unitNumber: 'Unit 304',
          paintColor: 'SW Agreeable Gray',
          notes: 'Found 2 small holes behind entry door. Mudded with 20min hot mud, sanded, rolled paint, cleaned floors.',
          isCompleted: true,
          photos: [
            {
              id: 'p-1',
              type: 'before',
              dataUrl: createModernSamplePhoto('before', 'Unit 304 - Living Room', 'Small hole behind front door'),
              timestamp: `${mon}T08:15:00.000Z`,
              caption: 'Hole found behind door before patch',
            },
            {
              id: 'p-2',
              type: 'after',
              dataUrl: createModernSamplePhoto('after', 'Unit 304 - Living Room', 'Patched, painted & floor wiped clean'),
              timestamp: `${mon}T14:45:00.000Z`,
              caption: 'Painted with Agreeable Gray, seamless finish',
            },
          ],
        },
        {
          id: 'u-2',
          unitNumber: 'Unit 306',
          paintColor: 'Pure White (Ceiling & Trim)',
          notes: 'Touched up scuffs in hallway and baseboards, cleaned up.',
          isCompleted: true,
          photos: [
            {
              id: 'p-3',
              type: 'before',
              dataUrl: createModernSamplePhoto('before', 'Unit 306 - Hallway', 'Heavy scuff marks along hallway wall'),
              timestamp: `${mon}T15:00:00.000Z`,
              caption: 'Scuffs and small nail pop before prep',
            },
            {
              id: 'p-4',
              type: 'after',
              dataUrl: createModernSamplePhoto('after', 'Unit 306 - Hallway', 'Sanded, rolled 1 coat, wiped clean'),
              timestamp: `${mon}T15:45:00.000Z`,
              caption: 'Clean finished hallway',
            },
          ],
        },
      ],
    },
    {
      id: `log-${tue}`,
      date: tue,
      time: {
        startTime: '07:30',
        endTime: '16:00',
        lunchDeductionMinutes: 30,
        totalHours: 8.0,
        overtimeHours: 0,
      },
      status: 'Submitted',
      units: [
        {
          id: 'u-3',
          unitNumber: 'Unit 212',
          paintColor: 'Behr Swiss Coffee',
          notes: 'Master bedroom drywall stress crack. Mesh taped, 2 coats mud, textured and painted.',
          isCompleted: true,
          photos: [
            {
              id: 'p-5',
              type: 'before',
              dataUrl: createModernSamplePhoto('before', 'Unit 212 - Master Bed', 'Corner wall crack before mud'),
              timestamp: `${tue}T09:00:00.000Z`,
              caption: 'Corner crack taped and mudded',
            },
            {
              id: 'p-6',
              type: 'after',
              dataUrl: createModernSamplePhoto('after', 'Unit 212 - Master Bed', 'Texture matched, painted & floor vacuumed'),
              timestamp: `${tue}T15:00:00.000Z`,
              caption: 'Finished wall and cleaned floors',
            },
          ],
        },
      ],
    },
    {
      id: `log-${wed}`,
      date: wed,
      time: {
        startTime: '07:30',
        endTime: '16:00',
        lunchDeductionMinutes: 30,
        totalHours: 8.0,
        overtimeHours: 0,
      },
      status: 'Submitted',
      units: [
        {
          id: 'u-4',
          unitNumber: 'Unit 108',
          paintColor: 'Repose Gray',
          notes: 'Kitchen dining area anchor holes patched and wall repainted.',
          isCompleted: true,
          photos: [
            {
              id: 'p-7',
              type: 'before',
              dataUrl: createModernSamplePhoto('before', 'Unit 108 - Dining', 'Wall anchor holes and torn drywall paper'),
              timestamp: `${wed}T08:30:00.000Z`,
              caption: 'Damage from anchors removed',
            },
            {
              id: 'p-8',
              type: 'after',
              dataUrl: createModernSamplePhoto('after', 'Unit 108 - Dining', 'Skimmed, textured & painted 2 coats'),
              timestamp: `${wed}T14:30:00.000Z`,
              caption: 'Wall repainted and floor mopped',
            },
          ],
        },
      ],
    },
    {
      id: `log-${thu}`,
      date: thu,
      time: {
        startTime: '07:30',
        endTime: '16:00',
        lunchDeductionMinutes: 30,
        totalHours: 8.0,
        overtimeHours: 0,
      },
      status: 'Submitted',
      units: [
        {
          id: 'u-5',
          unitNumber: 'Unit 415',
          paintColor: 'SW Alabaster',
          notes: 'Bath ceiling moisture spot scraped, Kilz primed and painted.',
          isCompleted: true,
          photos: [
            {
              id: 'p-9',
              type: 'before',
              dataUrl: createModernSamplePhoto('before', 'Unit 415 - Bathroom', 'Peeling paint on ceiling spot'),
              timestamp: `${thu}T10:00:00.000Z`,
              caption: 'Peeling spot scraped before mud',
            },
            {
              id: 'p-10',
              type: 'after',
              dataUrl: createModernSamplePhoto('after', 'Unit 415 - Bathroom', 'Primed, painted flat white, floor cleaned'),
              timestamp: `${thu}T15:15:00.000Z`,
              caption: 'Repaired and finished',
            },
          ],
        },
      ],
    },
  ];
}

export function getStoredLogs(): DailyWorkLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading logs from localStorage', e);
  }

  const seeds = generateSampleLogs();
  saveStoredLogs(seeds);
  return seeds;
}

export function saveStoredLogs(logs: DailyWorkLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed saving logs to localStorage', e);
  }
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
  saveStoredLogs(updated);
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
      if (Array.isArray(data.logs)) {
        saveStoredLogs(data.logs);
        return data.logs;
      }
    }
  } catch (err) {
    console.warn('Could not fetch logs from server', err);
  }
  return null;
}

export function generateBossEmailContent(dates: string[], logs: DailyWorkLog[], profile: UserAccount): { subject: string; body: string; mailtoUrl: string } {
  const weekStart = formatDisplayDate(dates[0]);
  const weekEnd = formatDisplayDate(dates[6]);

  const subject = `Weekly Work & Units: ${profile.workerName} (${dates[0]} - ${dates[6]})`;

  let totalHours = 0;
  let totalOt = 0;
  const unitSummaries: string[] = [];

  const dailyLines = dates.map((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    const day = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    if (log) {
      totalHours += log.time.totalHours;
      totalOt += log.time.overtimeHours;

      log.units.forEach((u) => {
        const beforeCount = u.photos.filter((p) => p.type === 'before').length;
        const afterCount = u.photos.filter((p) => p.type === 'after').length;
        unitSummaries.push(`• [${dateStr}] ${u.unitNumber}: ${u.paintColor || 'Standard'} | ${u.notes || 'Patched and painted'} (${beforeCount} before pics, ${afterCount} after pics)`);
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
