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
  unitIdx: number;
}

interface UngroupedPhoto {
  photo: UnitPhoto;
  category: 'before' | 'after';
  indexInCategory: number;
  totalInCategory: number;
  overallIndex: number;
  totalOverall: number;
}

type UnitPdfPage =
  | {
      type: 'unit-overview';
      unit: UnitWork;
      date: string;
      dayName: string;
      unitIdx: number;
      photos: UngroupedPhoto[];
      totalUnitPhotos: number;
      hasContinuation: boolean;
    }
  | {
      type: 'unit-photos-continuation';
      unit: UnitWork;
      date: string;
      dayName: string;
      unitIdx: number;
      photos: UngroupedPhoto[];
      totalUnitPhotos: number;
      continuationPageNum: number;
      totalContinuationPages: number;
    };

/**
 * Generates the official multi-page PDF report:
 * - PAGE 1: 1 dedicated page for the hours worked, clock in/out, lunch, and signatures
 * - PAGE 2+: Dedicated unit pages displaying ALL uploaded photos sequentially
 *   without grouping them into cramped 4-image blocks or omitting any pictures.
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
          unitList.push({
            date: dateStr,
            dayName,
            unit: u,
            unitIdx: unitList.length,
          });
        });
      }
    }
  });

  // Build complete list of pages ensuring NO photos are grouped into 4-packs
  // and EVERY SINGLE PHOTO is displayed in full sequence
  const unitPdfPages: UnitPdfPage[] = [];

  unitList.forEach((item) => {
    const { date, dayName, unit, unitIdx } = item;
    const beforeList = (unit.photos || []).filter((p) => p.type === 'before');
    const afterList = (unit.photos || []).filter((p) => p.type === 'after');

    const allUnitPhotos: UngroupedPhoto[] = [];

    beforeList.forEach((p, idx) => {
      allUnitPhotos.push({
        photo: p,
        category: 'before',
        indexInCategory: idx + 1,
        totalInCategory: beforeList.length,
        overallIndex: allUnitPhotos.length + 1,
        totalOverall: beforeList.length + afterList.length,
      });
    });

    afterList.forEach((p, idx) => {
      allUnitPhotos.push({
        photo: p,
        category: 'after',
        indexInCategory: idx + 1,
        totalInCategory: afterList.length,
        overallIndex: allUnitPhotos.length + 1,
        totalOverall: beforeList.length + afterList.length,
      });
    });

    const totalUnitPhotos = allUnitPhotos.length;
    // Page 1 of the unit displays unit overview + first 2 photos
    const firstTwo = allUnitPhotos.slice(0, 2);
    const remaining = allUnitPhotos.slice(2);
    const hasContinuation = remaining.length > 0;

    unitPdfPages.push({
      type: 'unit-overview',
      unit,
      date,
      dayName,
      unitIdx,
      photos: firstTwo,
      totalUnitPhotos,
      hasContinuation,
    });

    // Each continuation page displays up to 2 large ungrouped photos
    if (hasContinuation) {
      const chunkSize = 2;
      const totalContinuationPages = Math.ceil(remaining.length / chunkSize);
      for (let c = 0; c < totalContinuationPages; c++) {
        const chunk = remaining.slice(c * chunkSize, (c + 1) * chunkSize);
        unitPdfPages.push({
          type: 'unit-photos-continuation',
          unit,
          date,
          dayName,
          unitIdx,
          photos: chunk,
          totalUnitPhotos,
          continuationPageNum: c + 1,
          totalContinuationPages,
        });
      }
    }
  });

  // Calculate total pages: Page 1 for hours + all unit pages
  const totalPages = unitPdfPages.length > 0 ? 1 + unitPdfPages.length : 2;

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
  doc.text(`(${unitPdfPages.length} unit pages attached)`, rightBoxX + 6, 44);

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
  // PAGE 2+: DEDICATED UNIT PAGES (ALL PHOTOS DISPLAYED UNGROUPED & FULL SIZE)
  // =========================================================================
  if (unitPdfPages.length === 0) {
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
    unitPdfPages.forEach((uPage, pageIdx) => {
      const pageNum = 2 + pageIdx;
      doc.addPage();

      if (uPage.type === 'unit-overview') {
        const { unit, date, dayName, photos, totalUnitPhotos, hasContinuation } = uPage;

        // Top Header Ribbon
        doc.setFillColor(244, 63, 94); // rose-500
        doc.rect(marginX, 12, contentWidth, 3, 'F');

        // Header Page Pill Tag
        doc.setFillColor(255, 241, 242); // rose-50
        doc.setDrawColor(254, 205, 211); // rose-200
        const pillW = hasContinuation ? 86 : 74;
        doc.roundedRect(marginX, 18, pillW, 6, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(225, 29, 72); // rose-600
        const pillText = hasContinuation
          ? `PAGE ${pageNum} OF ${totalPages} · ${unit.unitNumber || 'UNIT'} OVERVIEW & PHOTOS`
          : `PAGE ${pageNum} OF ${totalPages} · UNIT WORK & PHOTO PROOF`;
        doc.text(pillText, marginX + 3, 22.2);

        // Date and Technician Info on Top Right (Separated lines, ZERO collision)
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

        // Paint and Status Badges (Cleanly placed, no text collision)
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
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.6);
        doc.line(marginX, 48, marginX + contentWidth, 48);

        // Work & Damage Description Box
        const notesBoxH = 15;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, 52, contentWidth, notesBoxH, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('SCOPE & REPAIRS COMPLETED:', marginX + 4, 56.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const notesText =
          unit.notes && unit.notes.trim().length > 0
            ? unit.notes
            : 'Found small holes/drywall damage, patched with mud, sanded smooth, rolled paint, cleaned floors.';
        const splitNotes = doc.splitTextToSize(notesText, contentWidth - 8);
        doc.text(splitNotes[0] || '', marginX + 4, 62);
        if (splitNotes[1]) {
          doc.text(splitNotes[1], marginX + 4, 65.5);
        }

        // Quality & Cleanliness Verification Bar
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, 70, contentWidth, 8, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text('QUALITY & CLEANUP:', marginX + 4, 75.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(5, 150, 105);
        const qualityNote = hasContinuation
          ? `✓ Wall Patched • ✓ Paint Rolled • ✓ Floors Cleaned (${totalUnitPhotos} Total Photos Uploaded — See Next Page for All)`
          : `✓ Wall Patched  •  ✓ Paint Blended & Rolled  •  ✓ Floors Cleaned & Vacuumped (${totalUnitPhotos} Photos)`;
        doc.text(qualityNote, marginX + 44, 75.5);

        // =========================================================================
        // UNGROUPED FULL-WIDTH PHOTOS ON PAGE 1
        // =========================================================================
        const photoStartY = 81;
        const availH = pageHeight - photoStartY - 14; // ~184 mm

        if (photos.length === 0) {
          doc.setFillColor(250, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(marginX, photoStartY, contentWidth, 54, 2, 2, 'FD');
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(148, 163, 184);
          doc.text('[ No before/after photos recorded for this unit ]', marginX + contentWidth / 2, photoStartY + 27, {
            align: 'center',
          });
        } else if (photos.length === 1) {
          // Exactly 1 huge unstretched photo
          drawSingleUngroupedPhoto(
            doc,
            photos[0],
            preparedPhotos,
            marginX,
            photoStartY,
            contentWidth,
            availH
          );
        } else {
          // Up to 2 full-width ungrouped photos stacked vertically
          const gap = 6;
          const slotH = (availH - gap) / 2; // ~89 mm each
          photos.forEach((item, idx) => {
            const slotY = photoStartY + idx * (slotH + gap);
            drawSingleUngroupedPhoto(
              doc,
              item,
              preparedPhotos,
              marginX,
              slotY,
              contentWidth,
              slotH
            );
          });
        }

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
      } else if (uPage.type === 'unit-photos-continuation') {
        // =========================================================================
        // CONTINUATION PAGES: LARGE UNGROUPED PHOTOS (UP TO 2 PER PAGE)
        // =========================================================================
        const { unit, date, dayName, photos, totalUnitPhotos, continuationPageNum, totalContinuationPages } = uPage;

        // Top Header Ribbon
        doc.setFillColor(244, 63, 94); // rose-500
        doc.rect(marginX, 12, contentWidth, 3, 'F');

        // Header Page Pill Tag
        doc.setFillColor(255, 241, 242);
        doc.setDrawColor(254, 205, 211);
        doc.roundedRect(marginX, 18, 92, 6, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(225, 29, 72);
        doc.text(
          `PAGE ${pageNum} OF ${totalPages} · ${unit.unitNumber || 'UNIT'} (PHOTOS PART ${continuationPageNum}/${totalContinuationPages})`,
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
        const photoStart = photos[0]?.overallIndex || 1;
        const photoEnd = photos[photos.length - 1]?.overallIndex || totalUnitPhotos;
        doc.text(
          `${unit.unitNumber || 'Unit'} — Complete Photo Proofs (Photos ${photoStart}–${photoEnd} of ${totalUnitPhotos})`,
          marginX,
          35
        );

        // Divider line
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.6);
        doc.line(marginX, 38, marginX + contentWidth, 38);

        // Render up to 2 large ungrouped photos
        const photoStartY = 42;
        const availH = pageHeight - photoStartY - 14; // ~223 mm

        if (photos.length === 1) {
          drawSingleUngroupedPhoto(
            doc,
            photos[0],
            preparedPhotos,
            marginX,
            photoStartY,
            contentWidth,
            Math.min(190, availH)
          );
        } else {
          const gap = 8;
          const slotH = (availH - gap) / 2; // ~107 mm per photo
          photos.forEach((item, idx) => {
            const slotY = photoStartY + idx * (slotH + gap);
            drawSingleUngroupedPhoto(
              doc,
              item,
              preparedPhotos,
              marginX,
              slotY,
              contentWidth,
              slotH
            );
          });
        }

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
 * Renders a single ungrouped photo card spanning full width.
 * Features a category banner on top, centered unstretched image, and caption overlay.
 * NEVER CLUSTERS OR GROUPS PHOTOS INTO CRAMPED 4-PACKS.
 */
function drawSingleUngroupedPhoto(
  doc: jsPDF,
  item: UngroupedPhoto,
  cachedPhotos: Map<string, ProcessedPhoto | null>,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const isBefore = item.category === 'before';
  const tagH = 6.5;

  // Individual Top Category Banner
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
    doc.setTextColor(190, 18, 60); // rose-700
    doc.text(
      `[BEFORE · DAMAGE]  Photo #${item.indexInCategory} of ${item.totalInCategory}  (Damage & Prep)`,
      x + 3.5,
      y + 4.7
    );
  } else {
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text(
      `[AFTER · PAINTED]  Photo #${item.indexInCategory} of ${item.totalInCategory}  (Painted & Floors Cleaned)`,
      x + 3.5,
      y + 4.7
    );
  }

  // Photo Frame Box directly underneath the banner
  const photoY = y + tagH + 1.5;
  const photoH = h - tagH - 1.5;

  // Outer dark matte backing
  doc.setFillColor(15, 23, 42); // slate-900 backing
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, photoY, w, photoH, 1.5, 1.5, 'FD');

  const cached = cachedPhotos.get(item.photo.id);

  if (cached && cached.dataUrl) {
    try {
      const imgW = cached.width || 800;
      const imgH = cached.height || 600;
      const imgRatio = imgW / imgH;
      const boxRatio = w / photoH;

      let drawW = w;
      let drawH = photoH;

      if (imgRatio > boxRatio) {
        // Photo is proportionally wider than box: constrain to width, scale height
        drawW = w;
        drawH = w / imgRatio;
      } else {
        // Photo is proportionally taller than box: constrain to height, scale width
        drawH = photoH;
        drawW = photoH * imgRatio;
      }

      // Center inside bounding box (PRESERVES EXACT NATURAL ASPECT RATIO)
      const drawX = x + (w - drawW) / 2;
      const drawY = photoY + (photoH - drawH) / 2;

      // Draw image without ANY stretching
      doc.addImage(cached.dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');

      // Outline border around slot
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, photoY, w, photoH, 1.5, 1.5, 'S');

      // Caption overlay if provided
      if (item.photo.caption && item.photo.caption.trim()) {
        const capH = Math.min(6.5, photoH * 0.16);
        doc.setFillColor(15, 23, 42);
        doc.rect(x, photoY + photoH - capH, w, capH, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(item.photo.caption, x + 2.5, photoY + photoH - 1.8);
      }
    } catch (err) {
      console.warn('Error adding image to PDF:', err);
      renderErrorBox(doc, x, photoY, w, photoH, 'Image could not be rendered');
    }
  } else {
    renderErrorBox(doc, x, photoY, w, photoH, 'Image loading failed');
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
