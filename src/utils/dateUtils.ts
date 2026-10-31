export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr || !timeStr.trim()) return '--:--';
  const trimmed = timeStr.trim();

  // If already in 12-hour AM/PM format, normalize spacing and return
  if (/am|pm/i.test(trimmed)) {
    return trimmed.replace(/([0-9])([a-zA-Z])/g, '$1 $2').toUpperCase();
  }

  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;

  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return trimmed;

  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minStr = String(m).padStart(2, '0');
  return `${hour12}:${minStr} ${period}`;
}

export function calculateHours(startTime: string, endTime: string, breakMinutes: number): { totalHours: number; regularHours: number; overtimeHours: number } {
  if (!startTime || !endTime) {
    return { totalHours: 0, regularHours: 0, overtimeHours: 0 };
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight shift if end is before start
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const diffMinutes = endMinutes - startMinutes - (breakMinutes || 0);
  const validMinutes = Math.max(0, diffMinutes);
  const totalHours = Math.round((validMinutes / 60) * 100) / 100;

  const regularHours = Math.min(8, totalHours);
  const overtimeHours = Math.round(Math.max(0, totalHours - 8) * 100) / 100;

  return { totalHours, regularHours, overtimeHours };
}

/**
 * Returns Monday and Sunday for the week containing the given date
 */
export function getWeekRange(dateOrDateStr: Date | string = new Date()): { start: string; end: string; dates: string[] } {
  let targetDate: Date;
  if (typeof dateOrDateStr === 'string') {
    const [y, m, d] = dateOrDateStr.split('-').map(Number);
    targetDate = new Date(y, m - 1, d);
  } else {
    targetDate = new Date(dateOrDateStr);
  }

  // Get day of week (0 is Sunday, 1 is Monday, ...)
  const day = targetDate.getDay();
  // Distance to Monday (if Sunday (0), distance is -6)
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatISODate(d));
  }

  return {
    start: dates[0],
    end: dates[6],
    dates,
  };
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayISODate(): string {
  return formatISODate(new Date());
}

export function shiftWeek(currentWeekStart: string, weekOffset: number): string {
  const [y, m, d] = currentWeekStart.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weekOffset * 7);
  return formatISODate(date);
}
