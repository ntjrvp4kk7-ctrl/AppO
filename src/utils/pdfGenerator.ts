import { jsPDF } from 'jspdf';
import { DailyWorkLog, UserAccount, UnitWork } from '../types/worklog';

/**
 * Safely converts any image source (relative URL, blob URL, webp, png)
 * into a reliable JPEG base64 string for jsPDF embedding.
 */
async function prepareImageForPdf(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/png')) {
    return url;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 640;
        canvas.height = img.naturalHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(url);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
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

/**
 * Generates the official multi-page PDF report:
 * - PAGE 1: The time breakdown (hours, in/out, lunch, regular/overtime, signatures)
 * - PAGE 2+: Pictures & units listed with clearly labeled [BEFORE · DAMAGE] and [AFTER · PAINTED]
 */
export async function generateWeeklyReportPdf(options: PdfExportOptions): Promise<jsPDF> {
  const { dates, logs, profile, supervisorSignature } = options;

  // Letter size: 215.9 x 279.4 mm
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
  const allUnitsWithDate: { date: string; unit: UnitWork }[] = [];

  dates.forEach((dateStr) => {
    const log = logs.find((l) => l.date === dateStr);
    if (log) {
      totalHours += log.time.totalHours;
      totalRegular += Math.min(8, log.time.totalHours);
      totalOvertime += log.time.overtimeHours;
      log.units.forEach((u) => {
        allUnitsWithDate.push({ date: dateStr, unit: u });
      });
    }
  });

  // Pre-load all photo images in parallel to avoid layout blocking
  const preparedPhotosMap = new Map<string, string | null>();
  const photoPromises: Promise<void>[] = [];

  for (const item of allUnitsWithDate) {
    for (const p of item.unit.photos) {
      if (!preparedPhotosMap.has(p.id)) {
        photoPromises.push(
          prepareImageForPdf(p.dataUrl).then((converted) => {
            preparedPhotosMap.set(p.id, converted);
          })
        );
      }
    }
  }
  await Promise.all(photoPromises);

  // =========================================================================
  // PAGE 1: THE TIME (HOURS & TIMESHEET + SIGNATURES)
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
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('PAGE 1 OF 2 · WEEKLY HOURS', marginX + 3, 22.2);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('WEEKLY WORK & UNIT REPORT', marginX, 31);

  // Subtitle / Scope
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Paint & Drywall Repairs • Daily Timesheet & Finished Units', marginX, 36);

  // Worker & Supervisor Block (Left)
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
  const rightBoxX = marginX + contentWidth - 62;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, 22, 62, 25, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('WORK WEEK PERIOD', rightBoxX + 6, 28);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${dates[0]} to ${dates[6]}`, rightBoxX + 6, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`Total Units Logged: ${allUnitsWithDate.length}`, rightBoxX + 6, 41);

  // Section 1 Header
  let currentY = 56;
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
  doc.text('Daily clock in/out, 30m lunch deductions & verified units', marginX + 80, currentY);

  // Timesheet Table
  currentY += 4;
  const colX = {
    date: marginX,
    dateW: 42,
    in: marginX + 42,
    inW: 27,
    out: marginX + 69,
    outW: 27,
    lunch: marginX + 96,
    lunchW: 25,
    units: marginX + 121,
    unitsW: 36,
    hours: marginX + 157,
    hoursW: contentWidth - 157,
  };

  // Table Header Row
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
    const log = logs.find((l) => l.date === dateStr);
    const day = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // Alternating row background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginX, currentY, contentWidth, 8, 'FD');

    if (!log) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(day, colX.date + 3, currentY + 5.2);
      doc.setFont('helvetica', 'italic');
      doc.text('Off Duty / No Shift', colX.in + 20, currentY + 5.2);
      doc.setFont('helvetica', 'normal');
      doc.text('0.0 hrs', marginX + contentWidth - 3, currentY + 5.2, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(day, colX.date + 3, currentY + 5.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(log.time.startTime || '--:--', colX.in + colX.inW / 2, currentY + 5.2, { align: 'center' });
      doc.text(log.time.endTime || '--:--', colX.out + colX.outW / 2, currentY + 5.2, { align: 'center' });
      doc.text(`${log.time.lunchDeductionMinutes}m`, colX.lunch + colX.lunchW / 2, currentY + 5.2, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const unitText = `${log.units.length} unit${log.units.length === 1 ? '' : 's'}`;
      doc.text(unitText, colX.units + colX.unitsW / 2, currentY + 5.2, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(5, 150, 105);
      doc.text(`${log.time.totalHours.toFixed(1)} hrs`, marginX + contentWidth - 3, currentY + 5.2, { align: 'right' });
    }

    currentY += 8;
  });

  // Table Footer Total Row
  doc.setFillColor(226, 232, 240); // slate-200
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, contentWidth, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('WEEKLY TOTAL HOURS', colX.date + 3, currentY + 6.5);

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`${allUnitsWithDate.length} Units Finished`, colX.units + colX.unitsW / 2, currentY + 6.5, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalHours.toFixed(1)} hrs`, marginX + contentWidth - 3, currentY + 6.8, { align: 'right' });

  currentY += 16;

  // 3 Mini Summary KPI Cards
  const cardW = (contentWidth - 8) / 3;

  // Regular Hours Card
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

  // Overtime Hours Card
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

  // Total Units Card
  const card3X = marginX + (cardW + 4) * 2;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(card33(card3X), currentY, cardW, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('UNITS PATCHED & PAINTED', card3X + cardW / 2, currentY + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(6, 95, 70);
  doc.text(`${allUnitsWithDate.length} Units`, card3X + cardW / 2, currentY + 13, { align: 'center' });

  function card33(x: number) {
    return x;
  }

  currentY += 28;

  // Signatures Section on Page 1
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
  doc.text('I certify that the above hours and units are accurate.', painterSigX + 6, currentY + 30);

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
  doc.text('FieldLog • Paint & Drywall Unit Tracker', marginX, pageHeight - 8);
  doc.text('Page 1 of 2', marginX + contentWidth, pageHeight - 8, { align: 'right' });

  // =========================================================================
  // PAGE 2 (AND ONWARDS): PICTURES & UNITS LISTED (BEFORE & AFTER LABELS)
  // =========================================================================
  doc.addPage();
  let pageNum = 2;

  const renderPage2Header = (currentPage: number) => {
    // Top Accent Bar
    doc.setFillColor(244, 63, 94); // rose-500
    doc.rect(marginX, 12, contentWidth, 3, 'F');

    // Header Page Tag
    doc.setFillColor(255, 241, 242); // rose-50
    doc.setDrawColor(254, 205, 211); // rose-200
    doc.roundedRect(marginX, 18, 68, 6, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`PAGE ${currentPage} · BEFORE & AFTER PHOTOS`, marginX + 3, 22.2);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('2. UNITS PATCHED, PAINTED & PHOTO EVIDENCE', marginX, 31);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Before & after photos of wall damages repaired, painted, and floors cleaned', marginX, 36);

    // Divider
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.6);
    doc.line(marginX, 40, marginX + contentWidth, 40);
  };

  renderPage2Header(pageNum);
  currentY = 46;

  if (allUnitsWithDate.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, 30, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No units were recorded for this week.', marginX + contentWidth / 2, currentY + 16, { align: 'center' });
  } else {
    for (let uIdx = 0; uIdx < allUnitsWithDate.length; uIdx++) {
      const { date, unit } = allUnitsWithDate[uIdx];
      const beforePhotos = unit.photos.filter((p) => p.type === 'before');
      const afterPhotos = unit.photos.filter((p) => p.type === 'after');

      // Calculate unit block height
      // Header: ~10mm, Notes: ~8mm (if present), Photos: ~50mm, Padding: ~8mm => ~76mm
      const hasNotes = !!unit.notes && unit.notes.trim().length > 0;
      const unitCardHeight = hasNotes ? 78 : 70;

      // Check if we need a new page
      if (currentY + unitCardHeight > pageHeight - 16) {
        // Footer on current page
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('FieldLog • Paint & Drywall Unit Tracker', marginX, pageHeight - 8);
        doc.text(`Page ${pageNum}`, marginX + contentWidth, pageHeight - 8, { align: 'right' });

        doc.addPage();
        pageNum++;
        renderPage2Header(pageNum);
        currentY = 46;
      }

      // Unit Card Outer Frame
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY, contentWidth, unitCardHeight, 2, 2, 'FD');

      // Unit Header Bar
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX, currentY, contentWidth, 9, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, currentY + 9, marginX + contentWidth, currentY + 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(unit.unitNumber || 'Unit', marginX + 4, currentY + 6.3);

      if (unit.paintColor) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`•  Paint: ${unit.paintColor}`, marginX + 38, currentY + 6.3);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      const statusLabel = unit.isCompleted ? '✓ Completed & Cleaned' : 'Work Logged';
      doc.text(`${statusLabel} (${date})`, marginX + contentWidth - 4, currentY + 6.3, { align: 'right' });

      let cardInnerY = currentY + 12;

      // Notes
      if (hasNotes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        const wrappedNotes = doc.splitTextToSize(unit.notes || '', contentWidth - 8);
        doc.text(wrappedNotes[0] || '', marginX + 4, cardInnerY);
        cardInnerY += 6;
      }

      // Photo Columns: Left = [BEFORE · DAMAGE], Right = [AFTER · PAINTED]
      const colWidth = (contentWidth - 10) / 2;
      const colHeight = 48;

      // ---------------- BEFORE COLUMN ----------------
      const beforeColX = marginX + 3;
      // Header tag for Before
      doc.setFillColor(254, 242, 242); // rose-50
      doc.setDrawColor(254, 205, 211); // rose-200
      doc.roundedRect(beforeColX, cardInnerY, colWidth, 6, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(190, 18, 60); // rose-700
      doc.text('[BEFORE · DAMAGE]', beforeColX + 3, cardInnerY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(159, 18, 57);
      doc.text(`${beforePhotos.length} photo${beforePhotos.length === 1 ? '' : 's'}`, beforeColX + colWidth - 3, cardInnerY + 4.2, { align: 'right' });

      // Before Image Frame
      const beforeImgY = cardInnerY + 7;
      const beforeImgH = colHeight - 8;

      if (beforePhotos.length > 0) {
        const firstPhoto = beforePhotos[0];
        const cachedImg = preparedPhotosMap.get(firstPhoto.id);

        if (cachedImg) {
          try {
            // Draw photo inside frame
            doc.addImage(cachedImg, 'JPEG', beforeColX, beforeImgY, colWidth, beforeImgH, undefined, 'FAST');
            doc.setDrawColor(226, 232, 240);
            doc.rect(beforeColX, beforeImgY, colWidth, beforeImgH, 'S');

            // If there are multiple before photos, indicate badge
            if (beforePhotos.length > 1) {
              doc.setFillColor(15, 23, 42);
              doc.rect(beforeColX + 2, beforeImgY + beforeImgH - 5.5, 22, 4.5, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6);
              doc.setTextColor(255, 255, 255);
              doc.text(`+${beforePhotos.length - 1} more pic`, beforeColX + 4, beforeImgY + beforeImgH - 2.2);
            }
          } catch {
            renderPlaceholderPhoto(doc, beforeColX, beforeImgY, colWidth, beforeImgH, 'Photo loading error');
          }
        } else {
          renderPlaceholderPhoto(doc, beforeColX, beforeImgY, colWidth, beforeImgH, 'No before photo recorded');
        }
      } else {
        renderPlaceholderPhoto(doc, beforeColX, beforeImgY, colWidth, beforeImgH, '[ No before photo recorded ]');
      }

      // ---------------- AFTER COLUMN ----------------
      const afterColX = marginX + 3 + colWidth + 4;
      // Header tag for After
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.roundedRect(afterColX, cardInnerY, colWidth, 6, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61); // emerald-700
      doc.text('[AFTER · PAINTED]', afterColX + 3, cardInnerY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(21, 128, 61);
      doc.text(`${afterPhotos.length} photo${afterPhotos.length === 1 ? '' : 's'}`, afterColX + colWidth - 3, cardInnerY + 4.2, { align: 'right' });

      // After Image Frame
      const afterImgY = cardInnerY + 7;
      const afterImgH = colHeight - 8;

      if (afterPhotos.length > 0) {
        const firstPhoto = afterPhotos[0];
        const cachedImg = preparedPhotosMap.get(firstPhoto.id);

        if (cachedImg) {
          try {
            doc.addImage(cachedImg, 'JPEG', afterColX, afterImgY, colWidth, afterImgH, undefined, 'FAST');
            doc.setDrawColor(226, 232, 240);
            doc.rect(afterColX, afterImgY, colWidth, afterImgH, 'S');

            if (afterPhotos.length > 1) {
              doc.setFillColor(15, 23, 42);
              doc.rect(afterColX + 2, afterImgY + afterImgH - 5.5, 22, 4.5, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6);
              doc.setTextColor(255, 255, 255);
              doc.text(`+${afterPhotos.length - 1} more pic`, afterColX + 4, afterImgY + afterImgH - 2.2);
            }
          } catch {
            renderPlaceholderPhoto(doc, afterColX, afterImgY, colWidth, afterImgH, 'Photo loading error');
          }
        } else {
          renderPlaceholderPhoto(doc, afterColX, afterImgY, colWidth, afterImgH, 'No after photo recorded');
        }
      } else {
        renderPlaceholderPhoto(doc, afterColX, afterImgY, colWidth, afterImgH, '[ No after photo recorded ]');
      }

      currentY += unitCardHeight + 5;
    }
  }

  // Footer on Last Page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('FieldLog • Paint & Drywall Unit Tracker', marginX, pageHeight - 8);
  doc.text(`Page ${pageNum}`, marginX + contentWidth, pageHeight - 8, { align: 'right' });

  return doc;
}

function renderPlaceholderPhoto(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string
) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(x, y, w, h, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(text, x + w / 2, y + h / 2 + 1, { align: 'center' });
}

/**
 * Downloads the PDF directly to device or triggers mobile share sheet if available.
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
        text: `Weekly Paint & Drywall log for ${options.dates[0]} to ${options.dates[6]}`,
      });
      return { success: true, shared: true, filename };
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // User cancelled share dialog, still fine
        return { success: true, shared: true, filename };
      }
      // If native share threw other error, fallback to direct download
    }
  }

  // Standard direct file download
  doc.save(filename);
  return { success: true, shared: false, filename };
}
