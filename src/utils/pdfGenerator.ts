import { jsPDF } from 'jspdf';
import { DailyWorkLog, UserAccount, UnitWork, UnitPhoto } from '../types/worklog';

export interface ProcessedPhoto {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Safely converts any image source into a valid JPEG base64 data URL
 * and extracts natural dimensions to prevent stretching.
 */
async function ensureJpegBase64(url: string): Promise<ProcessedPhoto | null> {
  if (!url) return null;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const natW = img.naturalWidth || 800;
          const natH = img.naturalHeight || 600;

          const canvas = document.createElement('canvas');
          canvas.width = natW;
          canvas.height = natH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: url, width: natW, height: natH });
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const jpegData = canvas.toDataURL('image/jpeg', 0.88);
          resolve({
            dataUrl: jpegData,
            width: natW,
            height: natH,
          });
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

interface TaggedPhoto {
  photo: UnitPhoto;
  category: 'before' | 'after';
  indexInCategory: number;
  totalInCategory: number;
}

type UnitPage =
  | {
      kind: 'overview';
      unit: UnitWork;
      date: string;
      dayName: string;
      unitIdx: number;
      beforePhotos: UnitPhoto[];
      afterPhotos: UnitPhoto[];
      hasMorePages: boolean;
    }
  | {
      kind: 'photo-grid';
      unit: UnitWork;
      date: string;
      dayName: string;
      unitIdx: number;
      photos: TaggedPhoto[];
      gridPageNum: number;
      totalGridPages: number;
    };

/**
 * Generates the official multi-page PDF report:
 * - PAGE 1: 1 page dedicated to the hours worked, clock in/out, lunch, and signatures
 * - PAGE 2+: Dedicated pages per unit day displaying ALL uploaded before and after photos
 *   in a clean structured grid layout without stretching or any '+N more photos' buttons.
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

  // Build complete list of unit pages ensuring ALL photos are rendered without omission
  const unitPages: UnitPage[] = [];

  unitList.forEach((item, unitIdx) => {
    const { date, dayName, unit } = item;
    const allBefore = (unit.photos || []).filter((p) => p.type === 'before');
    const allAfter = (unit.photos || []).filter((p) => p.type === 'after');

    // Page 1 of this unit shows overview + first 2 before & after photos
    const firstBefore = allBefore.slice(0, 2);
    const firstAfter = allAfter.slice(0, 2);

    const remainingPhotos: TaggedPhoto[] = [];

    allBefore.slice(2).forEach((p, idx) => {
      remainingPhotos.push({
        photo: p,
        category: 'before',
        indexInCategory: idx + 3,
        totalInCategory: allBefore.length,
      });
    });

    allAfter.slice(2).forEach((p, idx) => {
      remainingPhotos.push({
        photo: p,
        category: 'after',
        indexInCategory: idx + 3,
        totalInCategory: allAfter.length,
      });
    });

    const hasMorePages = remainingPhotos.length > 0;

    unitPages.push({
      kind: 'overview',
      unit,
      date,
      dayName,
      unitIdx,
      beforePhotos: firstBefore,
      afterPhotos: firstAfter,
      hasMorePages,
    });

    // Chunk remaining photos into structured grid pages (up to 4 large photos per grid page)
    if (hasMorePages) {
      const chunkSize = 4;
      const totalGridPages = Math.ceil(remainingPhotos.length / chunkSize);
      for (let g = 0; g < totalGridPages; g++) {
        const chunk = remainingPhotos.slice(g * chunkSize, (g + 1) * chunkSize);
        unitPages.push({
          kind: 'photo-grid',
          unit,
          date,
          dayName,
          unitIdx,
          photos: chunk,
          gridPageNum: g + 1,
          totalGridPages,
        });
      }
    }
  });

  // Calculate total pages: Page 1 for hours + unit pages
  const totalPages = unitPages.length > 0 ? 1 + unitPages.length : 2;

  // Pre-convert and cache all photos with natural aspect ratios
  const preparedPhotos = new Map<string, ProcessedPhoto | null>();
  const convertPromises: Promise<void>[] = [];

  for (const item of unitList) {
    for (const p of item.unit.photos) {
      if (!preparedPhotos.has(p.id)) {
        convertPromises.push(
          ensureJpegBase64(p.dataUrl).then((res) => {
            preparedPhotos.set(p.id, res);
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
  doc.text(`(${unitPages.length} unit pages attached)`, rightBoxX + 6, 44);

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
  // PAGE 2+: DEDICATED FULL PAGES PER UNIT DAY (ALL PHOTOS IN STRUCTURED GRID)
  // =========================================================================
  if (unitPages.length === 0) {
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
    // Render each unit page
    unitPages.forEach((uPage, pageIdx) => {
      const pageNum = 2 + pageIdx;
      doc.addPage();

      if (uPage.kind === 'overview') {
        const { unit, date, dayName, beforePhotos, afterPhotos, hasMorePages } = uPage;
        const allBeforeCount = (unit.photos || []).filter((p) => p.type === 'before').length;
        const allAfterCount = (unit.photos || []).filter((p) => p.type === 'after').length;

        // Top Header Ribbon
        doc.setFillColor(244, 63, 94); // rose-500
        doc.rect(marginX, 12, contentWidth, 3, 'F');

        // Header Page Pill Tag
        doc.setFillColor(255, 241, 242); // rose-50
        doc.setDrawColor(254, 205, 211); // rose-200
        const pillW = hasMorePages ? 88 : 74;
        doc.roundedRect(marginX, 18, pillW, 6, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(225, 29, 72); // rose-600
        const pillText = hasMorePages
          ? `PAGE ${pageNum} OF ${totalPages} · UNIT WORK & SCOPE OVERVIEW`
          : `PAGE ${pageNum} OF ${totalPages} · UNIT WORK & PHOTO PROOF`;
        doc.text(pillText, marginX + 3, 22.2);

        // Date and Technician Info on Top Right (Separated lines, NO collision)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`${dayName} (${date})`, marginX + contentWidth, 21.5, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Tech: ${profile.workerName || 'Painter'}  •  Supervisor: ${profile.bossName || 'Supervisor'}`,
          marginX + contentWidth,
          26,
          { align: 'right' }
        );

        // Unit Main Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(unit.unitNumber || `Unit #${uPage.unitIdx + 1}`, marginX, 35);

        // Paint and Status Badges
        let badgeX = marginX;
        if (unit.paintColor) {
          doc.setFillColor(241, 245, 249);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(badgeX, 39, 65, 6.5, 1, 1, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          doc.text(`Paint: ${unit.paintColor}`, badgeX + 3, 43.5);
          badgeX += 70;
        }

        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(167, 243, 208);
        doc.roundedRect(badgeX, 39, 68, 6.5, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(5, 150, 105);
        doc.text('✓ Finished, Painted & Cleaned', badgeX + 3, 43.5);

        // Divider line
        let unitY = 48;
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.6);
        doc.line(marginX, unitY, marginX + contentWidth, unitY);

        // Work & Damage Description Box
        unitY += 5;
        const notesBoxH = 15;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, unitY, contentWidth, notesBoxH, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('SCOPE & REPAIRS COMPLETED:', marginX + 4, unitY + 4.8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const notesText =
          unit.notes && unit.notes.trim().length > 0
            ? unit.notes
            : 'Found small holes/drywall damage, patched with mud, sanded smooth, rolled paint, cleaned floors.';
        const splitNotes = doc.splitTextToSize(notesText, contentWidth - 8);
        doc.text(splitNotes[0] || '', marginX + 4, unitY + 10.5);
        if (splitNotes[1]) {
          doc.text(splitNotes[1], marginX + 4, unitY + 14);
        }

        // =========================================================================
        // SIDE-BY-SIDE COLUMNS: [BEFORE · DAMAGE] & [AFTER · PAINTED]
        // =========================================================================
        unitY += notesBoxH + 5;

        const colGap = 7;
        const colWidth = (contentWidth - colGap) / 2; // ~90.4 mm
        const photoBoxH = 155; // Generous height to make pictures large and clear

        // ---------------- LEFT COLUMN: [BEFORE · DAMAGE] ----------------
        const beforeX = marginX;

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
        const beforeLabel =
          allBeforeCount > 2
            ? `Showing 1–${beforePhotos.length} of ${allBeforeCount} photos`
            : `${beforePhotos.length} photo${beforePhotos.length === 1 ? '' : 's'}`;
        doc.text(beforeLabel, beforeX + colWidth - 4, unitY + 5, { align: 'right' });

        const beforeContentY = unitY + 9;
        const beforePhotoH = photoBoxH - 12;

        renderPhotoStack(
          doc,
          beforePhotos,
          preparedPhotos,
          beforeX,
          beforeContentY,
          colWidth,
          beforePhotoH,
          '[ No before damage photo recorded ]'
        );

        // ---------------- RIGHT COLUMN: [AFTER · PAINTED] ----------------
        const afterX = marginX + colWidth + colGap;

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
        const afterLabel =
          allAfterCount > 2
            ? `Showing 1–${afterPhotos.length} of ${allAfterCount} photos`
            : `${afterPhotos.length} photo${afterPhotos.length === 1 ? '' : 's'}`;
        doc.text(afterLabel, afterX + colWidth - 4, unitY + 5, { align: 'right' });

        const afterContentY = unitY + 9;
        const afterPhotoH = photoBoxH - 12;

        renderPhotoStack(
          doc,
          afterPhotos,
          preparedPhotos,
          afterX,
          afterContentY,
          colWidth,
          afterPhotoH,
          '[ No after painted photo recorded ]'
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
        const extraNote = hasMorePages
          ? `✓ Wall Patched • ✓ Paint Rolled • ✓ Floors Cleaned  (See Next Page for All ${unit.photos.length} Photos)`
          : `✓ Wall Patched  •  ✓ Paint Blended & Rolled  •  ✓ Floors Cleaned & Vacuumped`;
        doc.text(extraNote, marginX + 48, verifyY + 5.8);

        // Page Footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `FieldLog — Daily Paint & Drywall Unit Tracker • ${unit.unitNumber || 'Unit'}`,
          marginX,
          pageHeight - 8
        );
        doc.text(`Page ${pageNum} of ${totalPages}`, marginX + contentWidth, pageHeight - 8, {
          align: 'right',
        });
      } else if (uPage.kind === 'photo-grid') {
        // =========================================================================
        // DEDICATED STRUCTURED PHOTO GRID PAGE (UP TO 4 LARGE UNSTRETCHED PHOTOS)
        // =========================================================================
        const { unit, date, dayName, photos, gridPageNum, totalGridPages } = uPage;

        // Top Header Ribbon
        doc.setFillColor(244, 63, 94); // rose-500
        doc.rect(marginX, 12, contentWidth, 3, 'F');

        // Header Page Pill Tag
        doc.setFillColor(255, 241, 242);
        doc.setDrawColor(254, 205, 211);
        doc.roundedRect(marginX, 18, 98, 6, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(225, 29, 72);
        doc.text(
          `PAGE ${pageNum} OF ${totalPages} · ${unit.unitNumber || 'UNIT'} (PHOTO PROOFS PART ${gridPageNum}/${totalGridPages})`,
          marginX + 3,
          22.2
        );

        // Date and Technician Info on Top Right
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`${dayName} (${date})`, marginX + contentWidth, 21.5, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Tech: ${profile.workerName || 'Painter'}  •  Supervisor: ${profile.bossName || 'Supervisor'}`,
          marginX + contentWidth,
          26,
          { align: 'right' }
        );

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text(`${unit.unitNumber || 'Unit'} — Complete Photo Proofs`, marginX, 35);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `All repair & painting photos displayed in structured high-resolution grid (Part ${gridPageNum} of ${totalGridPages})`,
          marginX,
          40
        );

        // Divider
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.6);
        doc.line(marginX, 43, marginX + contentWidth, 43);

        // Render 2x2 Grid of Photos
        const gridStartY = 48;
        const gridGapX = 7;
        const gridGapY = 6;
        const colW = (contentWidth - gridGapX) / 2; // ~90.4 mm
        const gridAvailH = pageHeight - gridStartY - 16; // ~215 mm
        const cellH = (gridAvailH - gridGapY) / 2; // ~104.5 mm per cell

        photos.forEach((item, cellIdx) => {
          const col = cellIdx % 2;
          const row = Math.floor(cellIdx / 2);
          const cellX = marginX + col * (colW + gridGapX);
          const cellY = gridStartY + row * (cellH + gridGapY);

          renderSinglePhotoCard(
            doc,
            item,
            preparedPhotos,
            cellX,
            cellY,
            colW,
            cellH
          );
        });

        // Page Footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `FieldLog — Daily Paint & Drywall Unit Tracker • ${unit.unitNumber || 'Unit'}`,
          marginX,
          pageHeight - 8
        );
        doc.text(`Page ${pageNum} of ${totalPages}`, marginX + contentWidth, pageHeight - 8, {
          align: 'right',
        });
      }
    });
  }

  return doc;
}

/**
 * Renders up to 2 stacked photos in a column (for Overview page).
 * Photos preserve natural aspect ratio, centered, unstretched.
 */
function renderPhotoStack(
  doc: jsPDF,
  photos: UnitPhoto[],
  cachedPhotos: Map<string, ProcessedPhoto | null>,
  x: number,
  y: number,
  w: number,
  h: number,
  emptyText: string
) {
  if (photos.length === 0) {
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(emptyText, x + w / 2, y + h / 2, { align: 'center' });
    return;
  }

  const count = photos.length;
  const gap = 3.5;
  const slotH = (h - (count - 1) * gap) / count;

  photos.forEach((photo, idx) => {
    const slotY = y + idx * (slotH + gap);
    drawFittedPhotoBox(doc, photo, cachedPhotos, x, slotY, w, slotH);
  });
}

/**
 * Renders a single photo card inside a structured grid cell.
 * Features a distinct category banner header and unstretched photographic display.
 */
function renderSinglePhotoCard(
  doc: jsPDF,
  item: TaggedPhoto,
  cachedPhotos: Map<string, ProcessedPhoto | null>,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const isBefore = item.category === 'before';
  const tagH = 6.5;

  // Header Banner Tag
  if (isBefore) {
    doc.setFillColor(254, 242, 242); // rose-50
    doc.setDrawColor(254, 205, 211); // rose-200
  } else {
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208); // emerald-200
  }
  doc.roundedRect(x, y, w, tagH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  if (isBefore) {
    doc.setTextColor(190, 18, 60);
    doc.text(`[BEFORE · DAMAGE] Photo #${item.indexInCategory} of ${item.totalInCategory}`, x + 3.5, y + 4.7);
  } else {
    doc.setTextColor(21, 128, 61);
    doc.text(`[AFTER · PAINTED] Photo #${item.indexInCategory} of ${item.totalInCategory}`, x + 3.5, y + 4.7);
  }

  // Photo Display Box below header banner
  const photoY = y + tagH + 1.5;
  const photoH = h - tagH - 1.5;
  drawFittedPhotoBox(doc, item.photo, cachedPhotos, x, photoY, w, photoH);
}

/**
 * Draws a single photo inside bounding box (x, y, w, h).
 * PRESERVES EXACT NATURAL ASPECT RATIO — NEVER STRETCHES.
 */
function drawFittedPhotoBox(
  doc: jsPDF,
  photo: UnitPhoto,
  cachedPhotos: Map<string, ProcessedPhoto | null>,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Outer frame & dark matte backing
  doc.setFillColor(15, 23, 42); // slate-900 backing
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

  const cached = cachedPhotos.get(photo.id);

  if (cached && cached.dataUrl) {
    try {
      const imgW = cached.width || 800;
      const imgH = cached.height || 600;
      const imgRatio = imgW / imgH;
      const boxRatio = w / h;

      let drawW = w;
      let drawH = h;

      if (imgRatio > boxRatio) {
        // Photo is proportionally wider than box: constrain to width, scale height
        drawW = w;
        drawH = w / imgRatio;
      } else {
        // Photo is proportionally taller than box: constrain to height, scale width
        drawH = h;
        drawW = h * imgRatio;
      }

      // Center inside bounding box
      const drawX = x + (w - drawW) / 2;
      const drawY = y + (h - drawH) / 2;

      // Draw JPEG image without any stretching
      doc.addImage(cached.dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');

      // Outline border
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, h, 1.5, 1.5, 'S');

      // Caption overlay if provided
      if (photo.caption && photo.caption.trim()) {
        const capH = Math.min(6.5, h * 0.18);
        doc.setFillColor(15, 23, 42);
        doc.rect(x, y + h - capH, w, capH, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(photo.caption, x + 2.5, y + h - 1.8);
      }
    } catch (err) {
      console.warn('Error adding image to PDF:', err);
      renderErrorBox(doc, x, y, w, h, 'Image could not be rendered');
    }
  } else {
    renderErrorBox(doc, x, y, w, h, 'Image loading failed');
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
