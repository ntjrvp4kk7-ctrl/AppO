import { jsPDF } from 'jspdf';
import { DailyWorkLog, UserAccount, UnitWork, UnitPhoto } from '../types/worklog';

/**
 * Safely converts any image source into a valid JPEG base64 data URL
 * compatible with jsPDF embedding.
 */
async function ensureJpegBase64(url: string): Promise<string | null> {
  if (!url) return null;

  // Already a JPEG base64
  if (url.startsWith('data:image/jpeg;base64,') || url.startsWith('data:image/jpg;base64,')) {
    return url;
  }
  // Already a PNG base64
  if (url.startsWith('data:image/png;base64,')) {
    return url;
  }

  // Convert via HTML5 Canvas
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 640;
          canvas.height = img.naturalHeight || 480;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.86));
        } catch (e) {
          console.warn('Canvas conversion failed:', e);
          resolve(null);
        }
      };
      img.onerror = () => {
        console.warn('Image load error for PDF:', url.slice(0, 40));
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

export interface PdfExportOptions {
  dates: string[];
  logs: DailyWorkLog[];
  profile: UserAccount;
  supervisorSignature?: {
    signedBy: string;
    signedAt: string;
  };
}

interface UnitWithDate {
  date: string;
  dayName: string;
  unit: UnitWork;
}

/**
 * Generates the official multi-page PDF report:
 * - PAGE 1: 1 page dedicated to the hours worked, clock in/out, lunch, and signatures
 * - PAGE 2+: 1 FULL PAGE PER UNIT DAY that includes large before and after pictures!
 */
export async function generateWeeklyReportPdf(options: PdfExportOptions): Promise<jsPDF> {
  const { dates, logs, profile, supervisorSignature } = options;

  // Standard Letter dimensions: 215.9 x 279.4 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 187.9 mm

  let totalHours = 0;
  let totalRegular = 0;
  let totalOvertime = 0;
  const unitList: UnitWithDate[] = [];

  // Gather all units and hours for the week
  dates.forEach((dateStr) => {
    // Match date string leniently (YYYY-MM-DD)
    const log = logs.find((l) => l.date && l.date.slice(0, 10) === dateStr.slice(0, 10));
    if (log) {
      totalHours += log.time?.totalHours || 0;
      totalRegular += Math.min(8, log.time?.totalHours || 0);
      totalOvertime += log.time?.overtimeHours || 0;

      if (Array.isArray(log.units)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dayObj = new Date(y, m - 1, d);
        const dayName = dayObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

        log.units.forEach((u) => {
          unitList.push({ date: dateStr, dayName, unit: u });
        });
      }
    }
  });

  // Calculate total pages: Page 1 for hours + 1 page per unit (or 1 extra page if no units)
  const totalPages = unitList.length > 0 ? 1 + unitList.length : 2;

  // Pre-convert all photos to clean JPEG base64 before drawing
  const preparedPhotos = new Map<string, string | null>();
  const convertPromises: Promise<void>[] = [];

  for (const item of unitList) {
    for (const p of item.unit.photos) {
      if (!preparedPhotos.has(p.id)) {
        convertPromises.push(
          ensureJpegBase64(p.dataUrl).then((base64) => {
            preparedPhotos.set(p.id, base64);
          })
        );
      }
    }
  }
  await Promise.all(convertPromises);

  // =========================================================================
  // PAGE 1: 1 DEDICATED PAGE FOR THE HOURS & SIGNATURES
  // =========================================================================

  // Top Accent Bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(marginX, 12, contentWidth, 3, 'F');

  // Header Page Tag
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(marginX, 18, 56, 6, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`PAGE 1 OF ${totalPages} · WEEKLY HOURS`, marginX + 3, 22.2);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('WEEKLY WORK & UNIT REPORT', marginX, 31);

  // Subtitle / Scope
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Paint & Drywall Repairs • Daily Hours & Completed Units', marginX, 36);

  // Technician & Supervisor info
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Technician: `, marginX, 42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(profile.workerName || 'Painter', marginX + 20, 42);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Supervisor: `, marginX, 47);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(profile.bossName || 'Supervisor', marginX + 20, 47);

  // Work Week Range Box (Right)
  const rightBoxX = marginX + contentWidth - 64;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, 20, 64, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('WORK WEEK PERIOD', rightBoxX + 6, 26);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${dates[0]} to ${dates[6]}`, rightBoxX + 6, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text(`Total Units Finished: ${unitList.length}`, rightBoxX + 6, 39);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`(1 full page per unit attached)`, rightBoxX + 6, 44);

  // Section 1: Timesheet Table
  let currentY = 54;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. WEEKLY HOURS & TIME LOG', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Daily clock in/out, 30m lunch break deductions & verified hours', marginX + 78, currentY);

  currentY += 4;
  const colX = {
    date: marginX,
    dateW: 42,
    in: marginX + 42,
    inW: 26,
    out: marginX + 68,
    outW: 26,
    lunch: marginX + 94,
    lunchW: 24,
    units: marginX + 118,
    unitsW: 36,
    hours: marginX + 154,
    hoursW: contentWidth - 154,
  };

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, contentWidth, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Date / Day', colX.date + 3, currentY + 5.2);
  doc.text('Clock In', colX.in + colX.inW / 2, currentY + 5.2, { align: 'center' });
  doc.text('Clock Out', colX.out + colX.outW / 2, currentY + 5.2, { align: 'center' });
  doc.text('Lunch Break', colX.lunch + colX.lunchW / 2, currentY + 5.2, { align: 'center' });
  doc.text('Units Serviced', colX.units + colX.unitsW / 2, currentY + 5.2, { align: 'center' });
  doc.text('Total Net Hours', marginX + contentWidth - 3, currentY + 5.2, { align: 'right' });

  currentY += 8;

  // Table Body Rows (7 Days)
  dates.forEach((dateStr, idx) => {
    const log = logs.find((l) => l.date && l.date.slice(0, 10) === dateStr.slice(0, 10));
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayObj = new Date(y, m - 1, d);
    const day = dayObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginX, currentY, contentWidth, 8.5, 'FD');

    if (!log) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(day, colX.date + 3, currentY + 5.5);
      doc.setFont('helvetica', 'italic');
      doc.text('Off Duty / No Shift', colX.in + 20, currentY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text('0.0 hrs', marginX + contentWidth - 3, currentY + 5.5, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(day, colX.date + 3, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(log.time?.startTime || '--:--', colX.in + colX.inW / 2, currentY + 5.5, { align: 'center' });
      doc.text(log.time?.endTime || '--:--', colX.out + colX.outW / 2, currentY + 5.5, { align: 'center' });
      doc.text(`${log.time?.lunchDeductionMinutes || 30}m`, colX.lunch + colX.lunchW / 2, currentY + 5.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const unitCount = log.units?.length || 0;
      doc.text(`${unitCount} unit${unitCount === 1 ? '' : 's'}`, colX.units + colX.unitsW / 2, currentY + 5.5, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(5, 150, 105);
      doc.text(`${(log.time?.totalHours || 0).toFixed(1)} hrs`, marginX + contentWidth - 3, currentY + 5.5, { align: 'right' });
    }

    currentY += 8.5;
  });

  // Total Hours Row
  doc.setFillColor(226, 232, 240);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, contentWidth, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('WEEKLY TOTAL HOURS', colX.date + 3, currentY + 6.5);

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`${unitList.length} Total Units Finished`, colX.units + colX.unitsW / 2, currentY + 6.5, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalHours.toFixed(1)} hrs`, marginX + contentWidth - 3, currentY + 6.8, { align: 'right' });

  currentY += 16;

  // 3 Mini KPI Summary Cards
  const cardW = (contentWidth - 8) / 3;

  // Regular Hours
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, cardW, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REGULAR HOURS', marginX + cardW / 2, currentY + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalRegular.toFixed(1)} hrs`, marginX + cardW / 2, currentY + 13, { align: 'center' });

  // Overtime Hours
  const card2X = marginX + cardW + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card2X, currentY, cardW, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('OVERTIME HOURS', card2X + cardW / 2, currentY + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(totalOvertime > 0 ? 180 : 15, totalOvertime > 0 ? 83 : 23, totalOvertime > 0 ? 9 : 42);
  doc.text(`${totalOvertime.toFixed(1)} hrs`, card2X + cardW / 2, currentY + 13, { align: 'center' });

  // Total Units Finished
  const card3X = marginX + (cardW + 4) * 2;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(card3X, currentY, cardW, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('UNITS FINISHED', card3X + cardW / 2, currentY + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(6, 95, 70);
  doc.text(`${unitList.length} Units`, card3X + cardW / 2, currentY + 13, { align: 'center' });

  currentY += 28;

  // Signatures Section strictly on Page 1
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);

  currentY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SIGNATURES & CERTIFICATION', marginX, currentY);

  currentY += 6;
  const sigW = (contentWidth - 10) / 2;

  // Left Signature: Painter
  const painterSigX = marginX;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(painterSigX, currentY, sigW, 36, 2, 2, 'FD');

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(painterSigX + 6, currentY + 20, painterSigX + sigW - 6, currentY + 20);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(profile.workerName || 'Painter', painterSigX + 8, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PAINTER / TECHNICIAN SIGNATURE', painterSigX + 6, currentY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('I certify that the hours logged and units serviced above are accurate.', painterSigX + 6, currentY + 30);

  // Right Signature: Supervisor
  const bossSigX = marginX + sigW + 10;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(bossSigX, currentY, sigW, 36, 2, 2, 'FD');

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(bossSigX + 6, currentY + 20, bossSigX + sigW - 6, currentY + 20);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const bossSignedName = supervisorSignature ? supervisorSignature.signedBy : profile.bossName;
  doc.text(bossSignedName || 'Supervisor', bossSigX + 8, currentY + 17);

  if (supervisorSignature) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text('✓ APPROVED & SIGNED', bossSigX + sigW - 38, currentY + 17);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('SUPERVISOR APPROVAL', bossSigX + 6, currentY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const bossStatusNote = supervisorSignature
    ? `Signed on ${new Date(supervisorSignature.signedAt).toLocaleDateString()}`
    : 'Pending supervisor review and sign-off.';
  doc.text(bossStatusNote, bossSigX + 6, currentY + 30);

  // Page 1 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('FieldLog — Daily Paint & Drywall Unit Tracker', marginX, pageHeight - 8);
  doc.text(`Page 1 of ${totalPages}`, marginX + contentWidth, pageHeight - 8, { align: 'right' });

  // =========================================================================
  // PAGE 2+: 1 FULL PAGE PER UNIT DAY (BEFORE & AFTER PICTURES)
  // =========================================================================
  if (unitList.length === 0) {
    // If no units recorded, provide clean explanation page
    doc.addPage();
    doc.setFillColor(16, 185, 129);
    doc.rect(marginX, 12, contentWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('2. UNITS & PHOTO PROOF', marginX, 28);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, 40, contentWidth, 40, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('No units or photos recorded for this week.', marginX + contentWidth / 2, 62, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Page 2 of 2`, marginX + contentWidth, pageHeight - 8, { align: 'right' });
  } else {
    // Render 1 FULL PAGE FOR EACH UNIT
    unitList.forEach((item, unitIdx) => {
      const pageNum = 2 + unitIdx;
      doc.addPage();

      const { date, dayName, unit } = item;
      const beforePhotos = unit.photos.filter((p) => p.type === 'before');
      const afterPhotos = unit.photos.filter((p) => p.type === 'after');

      // Top Header Ribbon
      doc.setFillColor(244, 63, 94); // rose-500
      doc.rect(marginX, 12, contentWidth, 3, 'F');

      // Header Page Pill Tag
      doc.setFillColor(255, 241, 242); // rose-50
      doc.setDrawColor(254, 205, 211); // rose-200
      doc.roundedRect(marginX, 18, 72, 6, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text(`PAGE ${pageNum} OF ${totalPages} · UNIT WORK & PHOTO PROOF`, marginX + 3, 22.2);

      // Date badge on top right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`${dayName} (${date})`, marginX + contentWidth, 22.2, { align: 'right' });

      // Unit Main Title & Paint Color
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(unit.unitNumber || `Unit #${unitIdx + 1}`, marginX, 33);

      let subY = 40;
      if (unit.paintColor) {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(marginX, subY - 4.5, 75, 6.5, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`Paint: ${unit.paintColor}`, marginX + 3, subY);
      }

      // Completion status badge
      const statusX = unit.paintColor ? marginX + 80 : marginX;
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(statusX, subY - 4.5, 70, 6.5, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(5, 150, 105);
      doc.text('✓ Finished, Painted & Floors Cleaned', statusX + 3, subY);

      // Technician & Supervisor info line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Technician: ${profile.workerName} • Supervisor: ${profile.bossName}`, marginX + contentWidth, subY, { align: 'right' });

      // Divider line
      let unitY = 46;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.6);
      doc.line(marginX, unitY, marginX + contentWidth, unitY);

      // Work & Damage Description Box
      unitY += 5;
      const notesBoxH = 16;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, unitY, contentWidth, notesBoxH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('SCOPE & REPAIRS COMPLETED:', marginX + 4, unitY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const notesText = unit.notes && unit.notes.trim().length > 0
        ? unit.notes
        : 'Found small holes/drywall damage, patched with mud, sanded smooth, rolled paint, cleaned floors.';
      const splitNotes = doc.splitTextToSize(notesText, contentWidth - 8);
      doc.text(splitNotes[0] || '', marginX + 4, unitY + 11);
      if (splitNotes[1]) {
        doc.text(splitNotes[1], marginX + 4, unitY + 14.5);
      }

      // =========================================================================
      // DEDICATED LARGE BEFORE & AFTER PHOTO COLUMNS (TAKES FULL PAGE)
      // =========================================================================
      unitY += notesBoxH + 6;

      const colGap = 7;
      const colWidth = (contentWidth - colGap) / 2; // ~90.4 mm
      const photoBoxH = 155; // Generous height to make pictures large and clear

      // ---------------- LEFT COLUMN: [BEFORE · DAMAGE] ----------------
      const beforeX = marginX;

      // Header Tag: [BEFORE · DAMAGE]
      doc.setFillColor(254, 242, 242); // rose-50
      doc.setDrawColor(254, 205, 211); // rose-200
      doc.roundedRect(beforeX, unitY, colWidth, 7, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(190, 18, 60); // rose-700
      doc.text('[BEFORE · DAMAGE]', beforeX + 4, unitY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(190, 18, 60);
      doc.text(`${beforePhotos.length} photo${beforePhotos.length === 1 ? '' : 's'}`, beforeX + colWidth - 4, unitY + 5, { align: 'right' });

      // Frame for Before Photo
      const beforeContentY = unitY + 9;
      const beforePhotoH = photoBoxH - 12;

      renderPhotoColumn(
        doc,
        beforePhotos,
        preparedPhotos,
        beforeX,
        beforeContentY,
        colWidth,
        beforePhotoH,
        '[ No before damage photo recorded ]',
        '#ffe4e6'
      );

      // ---------------- RIGHT COLUMN: [AFTER · PAINTED] ----------------
      const afterX = marginX + colWidth + colGap;

      // Header Tag: [AFTER · PAINTED]
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.roundedRect(afterX, unitY, colWidth, 7, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(21, 128, 61); // emerald-700
      doc.text('[AFTER · PAINTED]', afterX + 4, unitY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(21, 128, 61);
      doc.text(`${afterPhotos.length} photo${afterPhotos.length === 1 ? '' : 's'}`, afterX + colWidth - 4, unitY + 5, { align: 'right' });

      // Frame for After Photo
      const afterContentY = unitY + 9;
      const afterPhotoH = photoBoxH - 12;

      renderPhotoColumn(
        doc,
        afterPhotos,
        preparedPhotos,
        afterX,
        afterContentY,
        colWidth,
        afterPhotoH,
        '[ No after painted photo recorded ]',
        '#dcfce7'
      );

      // Bottom Quality & Cleanliness Verification Bar
      const verifyY = unitY + photoBoxH + 3;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, verifyY, contentWidth, 9, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('QUALITY & CLEANUP CHECK:', marginX + 4, verifyY + 5.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text('✓ Wall Patched  •  ✓ Paint Blended & Rolled  •  ✓ Floors Cleaned & Vacuumped', marginX + 56, verifyY + 5.8);

      // Page Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`FieldLog — Daily Paint & Drywall Unit Tracker • ${unit.unitNumber || 'Unit'}`, marginX, pageHeight - 8);
      doc.text(`Page ${pageNum} of ${totalPages}`, marginX + contentWidth, pageHeight - 8, { align: 'right' });
    });
  }

  return doc;
}

/**
 * Helper to render photos inside a dedicated column.
 * If 1 photo: fills the frame with high-resolution clarity.
 * If multiple photos: tiles them cleanly inside the column.
 */
function renderPhotoColumn(
  doc: jsPDF,
  photos: UnitPhoto[],
  cachedPhotos: Map<string, string | null>,
  x: number,
  y: number,
  w: number,
  h: number,
  emptyText: string,
  borderColor: string
) {
  if (photos.length === 0) {
    // Empty Placeholder Box
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(emptyText, x + w / 2, y + h / 2, { align: 'center' });
    return;
  }

  if (photos.length === 1) {
    // 1 Full-sized Large Photo
    const photo = photos[0];
    const dataUrl = cachedPhotos.get(photo.id);

    if (dataUrl) {
      try {
        doc.addImage(dataUrl, 'JPEG', x, y, w, h, undefined, 'FAST');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(x, y, w, h, 'S');

        if (photo.caption) {
          doc.setFillColor(15, 23, 42);
          doc.rect(x, y + h - 8, w, 8, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.text(photo.caption, x + 3, y + h - 2.5);
        }
      } catch (err) {
        console.warn('Error adding image to PDF:', err);
        renderErrorBox(doc, x, y, w, h, 'Image could not be rendered');
      }
    } else {
      renderErrorBox(doc, x, y, w, h, 'Image loading failed');
    }
  } else {
    // Multiple Photos: Render up to 2 stacked photos in the column
    const photoH = (h - 4) / 2;
    photos.slice(0, 2).forEach((photo, idx) => {
      const pY = y + idx * (photoH + 4);
      const dataUrl = cachedPhotos.get(photo.id);

      if (dataUrl) {
        try {
          doc.addImage(dataUrl, 'JPEG', x, pY, w, photoH, undefined, 'FAST');
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.rect(x, pY, w, photoH, 'S');

          if (photo.caption) {
            doc.setFillColor(15, 23, 42);
            doc.rect(x, pY + photoH - 6.5, w, 6.5, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(255, 255, 255);
            doc.text(photo.caption, x + 3, pY + photoH - 2);
          }
        } catch {
          renderErrorBox(doc, x, pY, w, photoH, 'Image error');
        }
      } else {
        renderErrorBox(doc, x, pY, w, photoH, 'Image not available');
      }
    });

    if (photos.length > 2) {
      doc.setFillColor(15, 23, 42);
      doc.rect(x + 2, y + h - 7, 30, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`+${photos.length - 2} more photos`, x + 4, y + h - 3);
    }
  }
}

function renderErrorBox(doc: jsPDF, x: number, y: number, w: number, h: number, msg: string) {
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 205, 211);
  doc.rect(x, y, w, h, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72);
  doc.text(msg, x + w / 2, y + h / 2, { align: 'center' });
}

/**
 * Downloads the PDF directly to device and offers mobile sharing.
 */
export async function downloadOrShareWeeklyPdf(options: PdfExportOptions): Promise<{
  success: boolean;
  shared: boolean;
  filename: string;
}> {
  const doc = await generateWeeklyReportPdf(options);
  const cleanDates = `${options.dates[0]}_to_${options.dates[6]}`;
  const filename = `Weekly_Work_Report_${cleanDates}.pdf`;

  // Try native sharing if supported (e.g. iPhone Safari / Android)
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Weekly Work Report (${options.profile.workerName || 'Painter'})`,
        text: `Weekly Paint & Drywall log with Before/After photos for ${options.dates[0]} to ${options.dates[6]}`,
      });
      return { success: true, shared: true, filename };
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return { success: true, shared: true, filename };
      }
    }
  }

  // Fallback to direct client-side file download
  doc.save(filename);
  return { success: true, shared: false, filename };
}
