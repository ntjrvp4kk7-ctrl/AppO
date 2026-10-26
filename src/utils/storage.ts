import { DailyWorkLog, UserAccount, WorkPhoto, UnitRepair } from '../types/worklog';
import { getTodayISODate, calculateHours, getWeekRange, formatDisplayDate } from './dateUtils';
import { createPaintDrywallSvg } from './photoUtils';

const STORAGE_KEY_LOGS = 'fieldlog_paint_drywall_logs_v2';
const STORAGE_KEY_AUTH = 'fieldlog_paint_drywall_auth_v2';

export const DEFAULT_USER: UserAccount = {
  id: 'user-default',
  email: 'technician@paintpros.com',
  workerName: 'Carlos Rivera',
  bossName: 'Greg Mitchell',
  bossEmail: 'greg.m@primepropertiesmgmt.com',
  companyName: 'Apex Paint & Drywall Services',
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

export function generateSeedPaintDrywallLogs(): DailyWorkLog[] {
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
        breakMinutes: 30,
        laborCategory: 'Drywall Hanging & Patching',
        overtimeHours: 0,
        totalHours: 8.0,
      },
      status: 'Submitted',
      repairs: [
        {
          id: 'rep-101',
          unitNumber: 'Unit 304',
          roomArea: 'Living Room behind entry door',
          damageType: 'Doorknob / Fist Hole',
          damageSize: '6-inch diameter doorknob hole through 1/2in sheetrock',
          repairStage: 'Painted & Completed',
          paintColor: 'SW 7029 Agreeable Gray',
          paintSheen: 'Eggshell',
          primerUsed: 'Kilz 2 Latex Primer',
          compoundUsed: 'Easy Sand 20 + Plus 3 Finish',
          textureType: 'Orange Peel (Medium)',
          workDescription: 'Squared off hole, installed wood backing clip, fitted 1/2" drywall plug. Mesh taped, 2 coats hot mud, spray can orange peel texture matched surrounding wall. Primed and applied 2 coats SW Agreeable Gray.',
        },
        {
          id: 'rep-102',
          unitNumber: 'Unit 304',
          roomArea: 'Master Bedroom Closet',
          damageType: 'Drywall Stress Crack',
          damageSize: '3-foot vertical settling crack above closet header',
          repairStage: 'Painted & Completed',
          paintColor: 'SW 7005 Pure White',
          paintSheen: 'Flat / Matte',
          primerUsed: 'PVA Drywall Primer',
          compoundUsed: 'Plus 3 Lightweight',
          textureType: 'Orange Peel (Light)',
          workDescription: 'V-grooved crack, screwed loose drywall edges to stud, fibafuse taped, skimmed 2 tight coats, feathered and painted.',
        },
      ],
      photos: [
        {
          id: 'ph-1',
          dataUrl: createPaintDrywallSvg('damage', 'Unit 304 Living Room - Doorknob Hole', 'Before repair: 6" hole through sheetrock'),
          category: 'Damage / Hole',
          caption: 'Pre-existing doorknob hole in living room wall before patch.',
          repairId: 'rep-101',
          timestamp: `${mon}T08:15:00.000Z`,
        },
        {
          id: 'ph-2',
          dataUrl: createPaintDrywallSvg('patch', 'Unit 304 Living Room - Taped & Mudded', 'Backing installed, mesh taped & hot mud coat'),
          category: 'Mud / Patch Progress',
          caption: 'Backing block installed, drywall fitted, first coat Easy Sand 20 feathered out.',
          repairId: 'rep-101',
          timestamp: `${mon}T10:45:00.000Z`,
        },
        {
          id: 'ph-3',
          dataUrl: createPaintDrywallSvg('after', 'Unit 304 Living Room - Painted & Finished', 'Texture blended, 2 coats SW Agreeable Gray Eggshell'),
          category: 'After / Finished',
          caption: 'Seamless finish. Texture matched perfectly and paint blended with no flashing.',
          repairId: 'rep-101',
          timestamp: `${mon}T14:30:00.000Z`,
        },
        {
          id: 'ph-4',
          dataUrl: createPaintDrywallSvg('paintcan', 'Unit 304 Paint Code Can', 'SW 7029 Agreeable Gray - Eggshell Interior'),
          category: 'Paint Code / Can',
          caption: 'Paint formula tag verified on site for color continuity.',
          repairId: 'rep-101',
          timestamp: `${mon}T15:00:00.000Z`,
        },
      ],
    },
    {
      id: `log-${tue}`,
      date: tue,
      time: {
        startTime: '07:30',
        endTime: '16:30',
        breakMinutes: 30,
        laborCategory: 'Taping & Mudding',
        overtimeHours: 0.5,
        totalHours: 8.5,
      },
      status: 'Submitted',
      repairs: [
        {
          id: 'rep-201',
          unitNumber: 'Unit 212',
          roomArea: 'Master Bathroom Ceiling',
          damageType: 'Water Damage / Ceiling Leak',
          damageSize: '2x3 ft soggy sheetrock cutout from upstairs shower leak',
          repairStage: 'Painted & Completed',
          paintColor: 'Ceiling Bright White',
          paintSheen: 'Flat / Matte',
          primerUsed: 'Kilz Original Oil-Based Stain Blocker',
          compoundUsed: 'Easy Sand 45 + USG Sheetrock Joint Compound',
          textureType: 'Knockdown',
          workDescription: 'Removed moldy/wet drywall, verified leak above was repaired. Hung new 1/2" mold-tough sheetrock, taped, applied 2 coats joint compound. Blended knockdown texture with sponge/trowel, coated with oil stain blocker, rolled 2 coats ceiling flat.',
        },
      ],
      photos: [
        {
          id: 'ph-5',
          dataUrl: createPaintDrywallSvg('damage', 'Unit 212 Ceiling - Water Damage Cutout', 'Water stained drywall cut out to joists'),
          category: 'Damage / Hole',
          caption: 'Damage photo: ceiling cutout after upstairs tub leak resolved.',
          repairId: 'rep-201',
          timestamp: `${tue}T08:30:00.000Z`,
        },
        {
          id: 'ph-6',
          dataUrl: createPaintDrywallSvg('after', 'Unit 212 Ceiling - Textured & Painted', 'Oil primed stain blocker + 2 coats ceiling flat'),
          category: 'After / Finished',
          caption: 'Finished ceiling repair. Knockdown texture matched and stain 100% sealed.',
          repairId: 'rep-201',
          timestamp: `${tue}T15:45:00.000Z`,
        },
      ],
    },
    {
      id: `log-${wed}`,
      date: wed,
      time: {
        startTime: '07:30',
        endTime: '16:00',
        breakMinutes: 30,
        laborCategory: 'Texture Spray & Blend',
        overtimeHours: 0,
        totalHours: 8.0,
      },
      status: 'Submitted',
      repairs: [
        {
          id: 'rep-301',
          unitNumber: 'Unit 108',
          roomArea: 'Hallway outside kitchen',
          damageType: 'Corner Bead Dent / Pop',
          damageSize: '8-foot metal corner bead dented and popped loose',
          repairStage: 'Painted & Completed',
          paintColor: 'Behr Swiss Coffee (12B)',
          paintSheen: 'Eggshell',
          primerUsed: 'Zinsser 1-2-3 Bullseye',
          compoundUsed: 'Durabond 90 + Lightweight finish',
          textureType: 'Orange Peel (Medium)',
          workDescription: 'Removed crushed metal corner bead, installed new paper-faced vinyl corner bead with spray adhesive and staples. Applied 3 mud passes, sanded flush, matched orange peel spray, primed and painted.',
        },
      ],
      photos: [
        {
          id: 'ph-7',
          dataUrl: createPaintDrywallSvg('damage', 'Unit 108 Hallway - Dented Corner Bead', 'Cracked mud and dented metal corner bead from moving furniture'),
          category: 'Damage / Hole',
          caption: 'Damage photo: corner bead ruined by tenant furniture move.',
          repairId: 'rep-301',
          timestamp: `${wed}T08:00:00.000Z`,
        },
        {
          id: 'ph-8',
          dataUrl: createPaintDrywallSvg('after', 'Unit 108 Hallway - Straight Sharp Corner', 'New bead set, orange peel texture & painted'),
          category: 'After / Finished',
          caption: 'After: Crisp 90-degree corner, orange peel matched, no lines visible.',
          repairId: 'rep-301',
          timestamp: `${wed}T14:15:00.000Z`,
        },
      ],
    },
    {
      id: `log-${thu}`,
      date: thu,
      time: {
        startTime: '07:30',
        endTime: '16:00',
        breakMinutes: 30,
        laborCategory: 'Finish Painting',
        overtimeHours: 0,
        totalHours: 8.0,
      },
      status: 'Submitted',
      repairs: [
        {
          id: 'rep-401',
          unitNumber: 'Unit 415',
          roomArea: 'Dining Room Accent & Kitchen Wall',
          damageType: 'Nail Pops / Anchor Holes',
          damageSize: '18 heavy wall anchor blowouts & picture nail tears',
          repairStage: 'Painted & Completed',
          paintColor: 'SW 7015 Repose Gray',
          paintSheen: 'Satin',
          primerUsed: 'Kilz Hide-All Primer',
          compoundUsed: 'Plus 3 Joint Compound',
          textureType: 'Orange Peel (Light)',
          workDescription: 'Pushed back paper tears, countersunk loose fasteners, filled all anchor blowouts, spot textured, primed patches and rolled full wall to corner.',
        },
      ],
      photos: [
        {
          id: 'ph-9',
          dataUrl: createPaintDrywallSvg('damage', 'Unit 415 Dining - Anchor Tears', 'Blowouts from heavy TV mount anchors and wall hangings'),
          category: 'Damage / Hole',
          caption: 'Wall damage from anchor removal prior to repair.',
          repairId: 'rep-401',
          timestamp: `${thu}T09:00:00.000Z`,
        },
        {
          id: 'ph-10',
          dataUrl: createPaintDrywallSvg('after', 'Unit 415 Dining - Fresh Repose Gray', 'Filled, textured and rolled corner to corner'),
          category: 'After / Finished',
          caption: 'Wall completed and painted. Ready for tenant move-in.',
          repairId: 'rep-401',
          timestamp: `${thu}T15:00:00.000Z`,
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

  const seeds = generateSeedPaintDrywallLogs();
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
      breakMinutes: 30,
      laborCategory: 'Drywall Hanging & Patching',
      totalHours: hours.totalHours,
      overtimeHours: hours.overtimeHours,
    },
    status: 'Draft',
    repairs: [],
    photos: [],
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

  // Sync to server if token exists
  syncLogsToServer(updated);

  return updated;
}

export function deleteLog(dateStr: string, logs: DailyWorkLog[]): DailyWorkLog[] {
  const updated = logs.filter((l) => l.date !== dateStr);
  saveStoredLogs(updated);
  syncLogsToServer(updated);
  return updated;
}

// Server API Sync Helper
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

export function exportWeekToCsv(dates: string[], logs: DailyWorkLog[], profile: UserAccount): void {
  const rows: string[][] = [
    ['PAINT & DRYWALL WEEKLY WORK LOG', profile.companyName],
    ['Painter/Tech:', profile.workerName, 'Supervisor:', profile.bossName],
    ['Boss Email:', profile.bossEmail, 'Report Period:', `${dates[0]} to ${dates[6]}`],
    ['Report Date:', new Date().toLocaleString()],
    [''],
    ['TIMESHEET HOURS'],
    ['Date', 'Day', 'Start', 'End', 'Break (min)', 'Total Hrs', 'OT Hrs', 'Primary Activity', 'Repairs Completed', 'Status'],
  ];

  let weekTotalHours = 0;
  let weekOtHours = 0;

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    const dayName = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    if (log) {
      const unitsList = log.repairs.map((r) => `${r.unitNumber} (${r.damageType} - ${r.repairStage})`).join('; ') || 'None';
      rows.push([
        dateStr,
        dayName,
        log.time.startTime,
        log.time.endTime,
        String(log.time.breakMinutes),
        log.time.totalHours.toFixed(1),
        log.time.overtimeHours.toFixed(1),
        log.time.laborCategory,
        `"${unitsList.replace(/"/g, '""')}"`,
        log.status,
      ]);
      weekTotalHours += log.time.totalHours;
      weekOtHours += log.time.overtimeHours;
    } else {
      rows.push([dateStr, dayName, '-', '-', '0', '0.0', '0.0', 'Off', 'None', 'Off']);
    }
  });

  rows.push(['']);
  rows.push(['TOTALS', '', '', '', '', weekTotalHours.toFixed(1), weekOtHours.toFixed(1), '']);

  // Detailed Paint & Drywall Repair Log
  rows.push(['']);
  rows.push(['PAINT & DRYWALL UNITS & DAMAGES LOG']);
  rows.push(['Date', 'Unit / Apt #', 'Room / Area', 'Damage Type', 'Damage Size', 'Repair Stage', 'Paint Color', 'Sheen', 'Texture Type', 'Primer', 'Mud Compound', 'Work Performed']);

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log && log.repairs.length > 0) {
      log.repairs.forEach((r) => {
        rows.push([
          dateStr,
          `"${r.unitNumber.replace(/"/g, '""')}"`,
          `"${r.roomArea.replace(/"/g, '""')}"`,
          r.damageType,
          `"${(r.damageSize || '').replace(/"/g, '""')}"`,
          r.repairStage,
          `"${r.paintColor.replace(/"/g, '""')}"`,
          r.paintSheen,
          r.textureType,
          `"${(r.primerUsed || '').replace(/"/g, '""')}"`,
          `"${(r.compoundUsed || '').replace(/"/g, '""')}"`,
          `"${r.workDescription.replace(/"/g, '""')}"`,
        ]);
      });
    }
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Paint_Drywall_Report_${profile.workerName.replace(/\s+/g, '_')}_${dates[0]}_to_${dates[6]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateBossEmailContent(dates: string[], logs: DailyWorkLog[], profile: UserAccount): { subject: string; body: string; mailtoUrl: string } {
  const weekStart = formatDisplayDate(dates[0]);
  const weekEnd = formatDisplayDate(dates[6]);

  const subject = `Weekly Paint & Drywall Log: ${profile.workerName} (${dates[0]} - ${dates[6]})`;

  let totalHours = 0;
  let totalOt = 0;
  let totalPhotos = 0;
  const repairsSummary: string[] = [];

  const dailyLines = dates.map((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    const day = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    if (log) {
      totalHours += log.time.totalHours;
      totalOt += log.time.overtimeHours;
      totalPhotos += log.photos.length;

      log.repairs.forEach((r) => {
        repairsSummary.push(`• [${dateStr}] ${r.unitNumber} (${r.roomArea}): ${r.damageType} - ${r.repairStage}. Color: ${r.paintColor} [${r.paintSheen}].`);
      });

      return `${day}: ${log.time.startTime} - ${log.time.endTime} | ${log.time.totalHours.toFixed(1)} hrs | ${r_count(log.repairs.length)} | ${p_count(log.photos.length)}`;
    }
    return `${day}: Off duty`;
  });

  function r_count(count: number) {
    return `${count} unit repair${count === 1 ? '' : 's'}`;
  }
  function p_count(count: number) {
    return `${count} photo${count === 1 ? '' : 's'}`;
  }

  const body = `Hi ${profile.bossName},

Here is my weekly paint and drywall work report for ${weekStart} to ${weekEnd}.

=========================================
TIMESHEET & LABOR SUMMARY
=========================================
Technician: ${profile.workerName}
Company: ${profile.companyName}
Total Hours: ${totalHours.toFixed(1)} hrs (${(totalHours - totalOt).toFixed(1)} regular + ${totalOt.toFixed(1)} overtime)
Total Unit Repairs Completed: ${repairsSummary.length}
Attached Before/After Photos on File: ${totalPhotos} photo(s)

DAILY HOURS:
${dailyLines.join('\n')}

UNITS & DAMAGES FIXED THIS WEEK:
-----------------------------------------
${repairsSummary.length > 0 ? repairsSummary.join('\n') : 'No repairs logged this week.'}

All before, damage, and after painted photos with color codes are logged in FieldLog.

Thanks,
${profile.workerName}`;

  const mailtoUrl = `mailto:${encodeURIComponent(profile.bossEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}
