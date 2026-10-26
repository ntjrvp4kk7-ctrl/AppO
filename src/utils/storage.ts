import { DailyWorkLog, WorkerProfile, WorkPhoto, UnitDetail } from '../types/worklog';
import { getTodayISODate, calculateHours, getWeekRange, formatDisplayDate } from './dateUtils';
import { createSvgPhotoDataUrl } from './photoUtils';

const STORAGE_KEY_LOGS = 'fieldlog_daily_logs_v1';
const STORAGE_KEY_PROFILE = 'fieldlog_worker_profile_v1';

export const DEFAULT_PROFILE: WorkerProfile = {
  workerName: 'Marcus Vance',
  workerTitle: 'Lead Field Maintenance Tech',
  employeeId: 'TECH-4091',
  companyName: 'Apex Mechanical & Facility Services',
  companyPhone: '(555) 382-9901',
  bossName: 'Dave Henderson',
  bossEmail: 'd.henderson@apexfacilities.com',
  hourlyRate: 38.5,
  dailyOtThreshold: 8,
};

export function getStoredProfile(): WorkerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed reading worker profile', e);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile: WorkerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed saving worker profile', e);
  }
}

export function generateSeedLogs(): DailyWorkLog[] {
  const currentWeek = getWeekRange(new Date());
  const dates = currentWeek.dates; // Monday to Sunday of current week

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
        laborCategory: 'Scheduled Maintenance',
        overtimeHours: 0,
        totalHours: 8.0,
      },
      safetyCheckCompleted: true,
      weatherConditions: 'Clear, 68°F',
      status: 'Submitted',
      generalNotes: 'Routine quarterly maintenance rounds completed on South Rooftop chillers. All pressures within nominal threshold.',
      units: [
        {
          id: 'u-101',
          unitNumber: 'Roof Unit #4 (Carrier 15-Ton)',
          equipmentType: 'Packaged HVAC Chiller',
          location: 'Building B - Rooftop South Deck',
          workOrderNumber: 'WO-99120',
          status: 'Tested & Passed',
          workPerformed: 'Replaced air filters (MERV 13), lubricated blower motor bearings, flushed condensate P-trap line, and inspected electrical contactor.',
          partsUsed: [
            { id: 'p-1', partNumber: 'FLTR-20x25x2', description: 'Pleated MERV 13 Filter', quantity: 4 },
            { id: 'p-2', partNumber: 'LUBE-SYN-4', description: 'Synthetic Bearing Grease Tube', quantity: 1 },
          ],
          technicianNotes: 'Minor surface rust noticed on drain pan; treated with zinc cold galvanize.',
        },
        {
          id: 'u-102',
          unitNumber: 'Suite 204 Fan Coil',
          equipmentType: 'Hydronic Fan Coil Unit',
          location: '2nd Floor North - Suite 204 Closet',
          workOrderNumber: 'WO-99124',
          status: 'Completed',
          workPerformed: 'Replaced faulty actuator valve (honeywell 24v) causing uneven temperature complaints.',
          partsUsed: [
            { id: 'p-3', partNumber: 'VLV-HW-24V', description: 'Honeywell Zone Actuator', quantity: 1 },
          ],
          technicianNotes: 'Thermostat calibrated and verified 71°F setpoint reached in 20 minutes.',
        },
      ],
      photos: [
        {
          id: 'ph-1',
          dataUrl: createSvgPhotoDataUrl('Roof Unit #4 - Blower Assembly', 'New MERV 13 filters installed & bearings lubed', '#0284c7'),
          category: 'Work Done',
          caption: 'New filters seated properly and blower motor cleaned.',
          unitId: 'u-101',
          timestamp: `${mon}T10:45:00.000Z`,
        },
        {
          id: 'ph-2',
          dataUrl: createSvgPhotoDataUrl('Carrier Nameplate & Serial', 'Model 50TCQ014 | S/N 4918X02914', '#10b981'),
          category: 'Equipment Tag',
          caption: 'Equipment serial tag verified for quarterly warranty tracking.',
          unitId: 'u-101',
          timestamp: `${mon}T11:15:00.000Z`,
        },
      ],
    },
    {
      id: `log-${tue}`,
      date: tue,
      time: {
        startTime: '07:00',
        endTime: '16:30',
        breakMinutes: 30,
        laborCategory: 'Emergency Repair',
        overtimeHours: 1.0,
        totalHours: 9.0,
      },
      safetyCheckCompleted: true,
      weatherConditions: 'Overcast, light mist',
      status: 'Submitted',
      generalNotes: 'Called out for emergency no-cool complaint in Medical Lab 102. Diagnosed burnt contactor and grounded dual-run capacitor.',
      units: [
        {
          id: 'u-201',
          unitNumber: 'Unit RTU-2 (Medical Cleanroom)',
          equipmentType: 'Trane High Efficiency RTU',
          location: 'East Wing Lab Exterior Pad',
          workOrderNumber: 'WO-99158',
          status: 'Tested & Passed',
          workPerformed: 'Disconnected power, discharged capacitor safely, replaced 45/5 MFD capacitor and 2-pole 30A contactor. Meggered compressor windings (normal resistance).',
          partsUsed: [
            { id: 'p-4', partNumber: 'CAP-45-5-440', description: 'Dual Round Run Capacitor', quantity: 1 },
            { id: 'p-5', partNumber: 'CON-2P-30A', description: '2-Pole 30 Amp Contactor', quantity: 1 },
          ],
          technicianNotes: 'Amp draw on compressor: 14.8A (RLA 18.2A). System running cold, delta T is 19.5°F.',
        },
      ],
      photos: [
        {
          id: 'ph-3',
          dataUrl: createSvgPhotoDataUrl('Burnt Contactor Pitted Contacts', 'Pitted points caused intermittent high amp surge', '#ef4444'),
          category: 'Issue / Damage',
          caption: 'Burnt contactor found during electrical diagnostic check.',
          unitId: 'u-201',
          timestamp: `${tue}T09:20:00.000Z`,
        },
        {
          id: 'ph-4',
          dataUrl: createSvgPhotoDataUrl('New Contactor & Capacitor Installed', 'Wired cleanly, zip tied, amp draw tested', '#10b981'),
          category: 'After',
          caption: 'Replacement contactor & capacitor installed. Tested within spec.',
          unitId: 'u-201',
          timestamp: `${tue}T11:40:00.000Z`,
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
        laborCategory: 'Regular Service',
        overtimeHours: 0,
        totalHours: 8.0,
      },
      safetyCheckCompleted: true,
      weatherConditions: 'Sunny, 72°F',
      status: 'Submitted',
      generalNotes: 'Multi-unit tenant turnover inspection at Grandview Commercial complex.',
      units: [
        {
          id: 'u-301',
          unitNumber: 'Unit #310 - Server Closet Split',
          equipmentType: 'Mitsubishi Mini-Split 18k BTU',
          location: 'Building C - Server Room 310',
          workOrderNumber: 'WO-99182',
          status: 'Completed',
          workPerformed: 'Deep chemical coil cleaning on indoor evaporator, cleared drain line with nitrogen blast, checked refrigerant subcooling.',
          partsUsed: [
            { id: 'p-6', partNumber: 'CHEM-COIL-FOAM', description: 'Nu-Calgon Evap Foam Can', quantity: 1 },
          ],
          technicianNotes: 'Server room temp stabilized at 66°F.',
        },
        {
          id: 'u-302',
          unitNumber: 'Unit #312 - Office VAV Box',
          equipmentType: 'Titus Variable Air Volume Box',
          location: 'Ceiling Plenum above Office 312',
          workOrderNumber: 'WO-99185',
          status: 'Parts Needed',
          workPerformed: 'Damper motor shaft binding. Tried recalibrating 0-10V signal from BMS, motor gears stripped.',
          partsUsed: [],
          technicianNotes: 'Need Belimo LMB24-SR actuator. Placed damper at 50% fixed bypass temporarily.',
        },
      ],
      photos: [
        {
          id: 'ph-5',
          dataUrl: createSvgPhotoDataUrl('Evaporator Coil Deep Cleaning', 'Chemical foam applied & rinsed clean', '#0284c7'),
          category: 'Work Done',
          caption: 'Evaporator coil deep foam cleaning in server room split unit.',
          unitId: 'u-301',
          timestamp: `${wed}T13:10:00.000Z`,
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
        laborCategory: 'Inspection',
        overtimeHours: 0,
        totalHours: 8.0,
      },
      safetyCheckCompleted: true,
      weatherConditions: 'Partly cloudy, 65°F',
      status: 'Submitted',
      generalNotes: 'Annual backflow and mechanical safety inspections with city inspector.',
      units: [
        {
          id: 'u-401',
          unitNumber: 'Boiler #1 (Lochinvar 500k BTU)',
          equipmentType: 'Hydronic Heating Boiler',
          location: 'Central Basement Mechanical Room',
          workOrderNumber: 'WO-99201',
          status: 'Tested & Passed',
          workPerformed: 'Tested low-water cutoff safety switch, verified gas train pressure, safety relief valve pop test passed.',
          partsUsed: [],
          technicianNotes: 'Inspector signed annual certification tag #B-2026-99.',
        },
      ],
      photos: [
        {
          id: 'ph-6',
          dataUrl: createSvgPhotoDataUrl('Passed Inspection Tag 2026', 'Signed by City Mech Inspector', '#10b981'),
          category: 'Equipment Tag',
          caption: '2026 City boiler inspection certificate affixed to front panel.',
          unitId: 'u-401',
          timestamp: `${thu}T14:30:00.000Z`,
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

  // First time initialization: seed realistic logs
  const seeds = generateSeedLogs();
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

  // Create clean initial log for date
  const hours = calculateHours('07:30', '16:00', 30);
  return {
    id: `log-${dateStr}-${Date.now().toString(36)}`,
    date: dateStr,
    time: {
      startTime: '07:30',
      endTime: '16:00',
      breakMinutes: 30,
      laborCategory: 'Regular Service',
      totalHours: hours.totalHours,
      overtimeHours: hours.overtimeHours,
    },
    safetyCheckCompleted: true,
    weatherConditions: '',
    status: 'Draft',
    generalNotes: '',
    units: [],
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
  return updated;
}

export function deleteLog(dateStr: string, logs: DailyWorkLog[]): DailyWorkLog[] {
  const updated = logs.filter((l) => l.date !== dateStr);
  saveStoredLogs(updated);
  return updated;
}

export function exportWeekToCsv(dates: string[], logs: DailyWorkLog[], profile: WorkerProfile): void {
  const rows: string[][] = [
    ['WEEKLY WORK LOG REPORT', profile.companyName],
    ['Technician:', profile.workerName, 'Tech ID:', profile.employeeId],
    ['Supervisor:', profile.bossName, 'Supervisor Email:', profile.bossEmail],
    ['Report Generated:', new Date().toLocaleString()],
    [''],
    ['Date', 'Day', 'Start', 'End', 'Break (min)', 'Total Hrs', 'OT Hrs', 'Labor Category', 'Units Worked', 'Status', 'Daily Summary Notes'],
  ];

  let weekTotalHours = 0;
  let weekOtHours = 0;

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    const dayName = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    if (log) {
      const unitsList = log.units.map((u) => `${u.unitNumber} (${u.status})`).join('; ') || 'None';
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
        `"${(log.generalNotes || '').replace(/"/g, '""')}"`,
      ]);
      weekTotalHours += log.time.totalHours;
      weekOtHours += log.time.overtimeHours;
    } else {
      rows.push([dateStr, dayName, '-', '-', '0', '0.0', '0.0', 'Off', 'None', 'Off', 'Off duty / No entry']);
    }
  });

  rows.push(['']);
  rows.push(['TOTALS', '', '', '', '', weekTotalHours.toFixed(1), weekOtHours.toFixed(1), '']);

  // Detailed Unit Breakdown
  rows.push(['']);
  rows.push(['DETAILED UNIT WORK BREAKDOWN']);
  rows.push(['Date', 'Unit / Equipment', 'Location', 'Work Order #', 'Status', 'Work Performed', 'Parts Used']);

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log && log.units.length > 0) {
      log.units.forEach((u) => {
        const partsStr = u.partsUsed.map((p) => `${p.quantity}x ${p.description} [${p.partNumber}]`).join(', ') || 'None';
        rows.push([
          dateStr,
          `"${u.unitNumber.replace(/"/g, '""')}"`,
          `"${u.location.replace(/"/g, '""')}"`,
          u.workOrderNumber,
          u.status,
          `"${u.workPerformed.replace(/"/g, '""')}"`,
          `"${partsStr.replace(/"/g, '""')}"`,
        ]);
      });
    }
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Weekly_Work_Log_${profile.workerName.replace(/\s+/g, '_')}_${dates[0]}_to_${dates[6]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateBossEmailContent(dates: string[], logs: DailyWorkLog[], profile: WorkerProfile): { subject: string; body: string; mailtoUrl: string } {
  const weekStart = formatDisplayDate(dates[0]);
  const weekEnd = formatDisplayDate(dates[6]);

  const subject = `Weekly Work Log Report: ${profile.workerName} (${dates[0]} - ${dates[6]})`;

  let totalHours = 0;
  let totalOt = 0;
  let totalPhotos = 0;
  const unitSummaries: string[] = [];

  const dailyLines = dates.map((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    const day = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    if (log) {
      totalHours += log.time.totalHours;
      totalOt += log.time.overtimeHours;
      totalPhotos += log.photos.length;

      log.units.forEach((u) => {
        unitSummaries.push(`• [${dateStr}] ${u.unitNumber} (${u.status}) - ${u.workPerformed.slice(0, 80)}...`);
      });

      return `${day}: ${log.time.startTime} - ${log.time.endTime} | ${log.time.totalHours.toFixed(1)} hrs (${log.time.overtimeHours > 0 ? log.time.overtimeHours + ' OT' : 'Reg'}) | Units: ${log.units.length} | Photos: ${log.photos.length}`;
    }
    return `${day}: Off / No hours logged`;
  });

  const body = `Hi ${profile.bossName},

Here is my weekly work log summary for the week of ${weekStart} to ${weekEnd}.

==============================
HOURS & TIMESHEET SUMMARY
==============================
Technician: ${profile.workerName} (${profile.employeeId})
Company: ${profile.companyName}
Total Hours: ${totalHours.toFixed(1)} hrs
Regular Hours: ${(totalHours - totalOt).toFixed(1)} hrs
Overtime Hours: ${totalOt.toFixed(1)} hrs
Total Units Serviced: ${unitSummaries.length}
Attached Photos: ${totalPhotos} photo(s) on file

DAILY LOGS BREAKDOWN:
---------------------------------------------
${dailyLines.join('\n')}

KEY UNITS & EQUIPMENT SERVICED:
---------------------------------------------
${unitSummaries.length > 0 ? unitSummaries.join('\n') : 'No unit details logged this week.'}

Complete detailed timesheet with photo attachments and parts logs is ready in the FieldLog portal.

Thanks,
${profile.workerName}
${profile.companyPhone}`;

  const mailtoUrl = `mailto:${encodeURIComponent(profile.bossEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}
