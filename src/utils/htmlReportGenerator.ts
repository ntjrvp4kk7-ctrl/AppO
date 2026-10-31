import { DailyWorkLog, UserAccount, UnitWork, UnitPhoto } from '../types/worklog';
import { formatTime12h } from './dateUtils';

interface HtmlReportData {
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

export function generateStandaloneHtmlReport({
  dates,
  logs,
  profile,
  supervisorSignature,
}: HtmlReportData): string {
  let totalHours = 0;
  let totalRegular = 0;
  let totalOvertime = 0;
  const unitList: UnitWithDate[] = [];

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

  const startDateFormatted = dates[0] || 'Start Date';
  const endDateFormatted = dates[6] || 'End Date';

  // Build daily rows HTML
  const dailyRowsHtml = dates
    .map((dateStr, idx) => {
      const log = logs.find((l) => l.date && l.date.slice(0, 10) === dateStr.slice(0, 10));
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayObj = new Date(y, m - 1, d);
      const dayName = dayObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      if (!log) {
        return `
        <tr class="${idx % 2 === 1 ? 'even-row' : ''} text-muted">
          <td><strong>${dayName}</strong></td>
          <td colspan="4" class="text-center italic">Off Duty / No Shift</td>
          <td class="text-right font-mono">0.0</td>
        </tr>`;
      }

      return `
      <tr class="${idx % 2 === 1 ? 'even-row' : ''}">
        <td><strong>${dayName}</strong></td>
        <td class="text-center font-mono">${formatTime12h(log.time?.startTime)}</td>
        <td class="text-center font-mono">${formatTime12h(log.time?.endTime)}</td>
        <td class="text-center">${log.time?.lunchDeductionMinutes || 30}m</td>
        <td class="text-center font-semibold">${log.units?.length || 0} unit${(log.units?.length || 0) === 1 ? '' : 's'}</td>
        <td class="text-right font-mono font-bold text-success">${(log.time?.totalHours || 0).toFixed(1)} hrs</td>
      </tr>`;
    })
    .join('');

  // Build units HTML with EVERY SINGLE PHOTO unstretched & clearly labeled
  const unitsHtml = unitList
    .map((item, idx) => {
      const { date, dayName, unit } = item;
      const beforePhotos = (unit.photos || []).filter((p) => p.type === 'before');
      const afterPhotos = (unit.photos || []).filter((p) => p.type === 'after');

      const beforePhotosHtml =
        beforePhotos.length > 0
          ? `<div class="photo-grid">
              ${beforePhotos
                .map(
                  (photo, pIdx) => `
                <div class="photo-card before-card">
                  <div class="photo-img-wrap">
                    <img src="${photo.dataUrl}" alt="Before Damage Photo ${pIdx + 1}" loading="lazy" />
                  </div>
                  <div class="photo-badge badge-rose">Before #${pIdx + 1}</div>
                  ${photo.caption ? `<div class="photo-caption">${escapeHtml(photo.caption)}</div>` : ''}
                </div>`
                )
                .join('')}
            </div>`
          : `<div class="empty-photo-box">[ No before damage photos uploaded ]</div>`;

      const afterPhotosHtml =
        afterPhotos.length > 0
          ? `<div class="photo-grid">
              ${afterPhotos
                .map(
                  (photo, pIdx) => `
                <div class="photo-card after-card">
                  <div class="photo-img-wrap">
                    <img src="${photo.dataUrl}" alt="After Painted Photo ${pIdx + 1}" loading="lazy" />
                  </div>
                  <div class="photo-badge badge-emerald">After #${pIdx + 1}</div>
                  ${photo.caption ? `<div class="photo-caption">${escapeHtml(photo.caption)}</div>` : ''}
                </div>`
                )
                .join('')}
            </div>`
          : `<div class="empty-photo-box">[ No after painted photos uploaded ]</div>`;

      return `
      <section class="unit-section page-break">
        <div class="unit-header">
          <div>
            <div class="unit-tag">UNIT ${idx + 1} OF ${unitList.length} · PROOF OF WORK</div>
            <h2 class="unit-title">${escapeHtml(unit.unitNumber || `Unit #${idx + 1}`)}</h2>
            <div class="unit-badges">
              ${unit.paintColor ? `<span class="badge badge-gray">Paint: ${escapeHtml(unit.paintColor)}</span>` : ''}
              <span class="badge badge-green">✓ Finished, Painted & Cleaned</span>
            </div>
          </div>
          <div class="unit-date-box">
            <div class="unit-date-day">${dayName}</div>
            <div class="unit-date-iso">${date}</div>
          </div>
        </div>

        <div class="scope-box">
          <div class="scope-label">REPAIRS & WORK COMPLETED:</div>
          <div class="scope-text">
            ${
              unit.notes && unit.notes.trim().length > 0
                ? escapeHtml(unit.notes)
                : 'Found small drywall damage and nail holes, patched with mud, sanded smooth flush, rolled matching paint, wiped down baseboards and cleaned floor.'
            }
          </div>
        </div>

        <div class="photos-wrapper">
          <!-- BEFORE PHOTOS SECTION -->
          <div class="photo-category before-section">
            <div class="category-header text-rose">
              <span>[BEFORE · DAMAGE & PREP PHOTOS]</span>
              <span class="badge-count">${beforePhotos.length} photo${beforePhotos.length === 1 ? '' : 's'}</span>
            </div>
            ${beforePhotosHtml}
          </div>

          <!-- AFTER PHOTOS SECTION -->
          <div class="photo-category after-section">
            <div class="category-header text-emerald">
              <span>[AFTER · PAINTED & CLEANED PHOTOS]</span>
              <span class="badge-count">${afterPhotos.length} photo${afterPhotos.length === 1 ? '' : 's'}</span>
            </div>
            ${afterPhotosHtml}
          </div>
        </div>

        <div class="unit-footer-bar">
          <span>Technician: <strong>${escapeHtml(profile.workerName || 'Coleby Braddy')}</strong></span>
          <span class="text-emerald">✓ Walls Patched • Paint Blended • Floors Cleaned</span>
          <span>Date: ${date}</span>
        </div>
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>Weekly Work & Units Report - ${escapeHtml(profile.workerName)} (${startDateFormatted} to ${endDateFormatted})</title>
  <style>
    /* Reset & Base Styles */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }

    /* Fixed Action Header for Android / Mobile */
    .top-action-bar {
      position: sticky;
      top: 0;
      z-index: 999;
      background-color: #0f172a;
      color: #ffffff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .top-action-bar .brand-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .top-action-bar .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
    }
    .action-btn-group {
      display: flex;
      gap: 8px;
    }
    .action-btn {
      appearance: none;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .action-btn-primary {
      background-color: #0a84ff;
      color: #ffffff;
    }
    .action-btn-primary:hover {
      background-color: #0070e0;
    }
    .action-btn-secondary {
      background-color: #334155;
      color: #f8fafc;
    }
    .action-btn-secondary:hover {
      background-color: #475569;
    }

    /* Main Container */
    .report-container {
      max-width: 900px;
      margin: 20px auto;
      padding: 0 16px 40px;
    }

    /* Report Sheet Cards */
    .report-card {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
      border: 1px solid #e2e8f0;
      padding: 24px;
      margin-bottom: 24px;
    }

    /* Document Header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: #0f172a;
    }
    .doc-meta {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
    }
    .doc-meta strong {
      color: #0f172a;
    }
    .week-period-box {
      text-align: right;
      background-color: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .week-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
    }
    .week-dates {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .week-count {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      margin-top: 4px;
    }

    /* Section Headings */
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f172a;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Timesheet Table */
    .timesheet-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 14px;
      border: 1px solid #cbd5e1;
    }
    .timesheet-table th, .timesheet-table td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
    }
    .timesheet-table th {
      background-color: #f1f5f9;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.03em;
    }
    .timesheet-table tbody tr:hover {
      background-color: #f8fafc;
    }
    .timesheet-table .even-row {
      background-color: #fafafa;
    }
    .timesheet-table tfoot tr {
      background-color: #e2e8f0;
      font-weight: 800;
      border-top: 2px solid #0f172a;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-muted { color: #94a3b8; }
    .text-success { color: #059669; }
    .text-rose { color: #e11d48; }
    .text-emerald { color: #059669; }

    /* KPI Summary Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-top: 14px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    .kpi-title { color: #64748b; font-weight: 600; }
    .kpi-val { font-weight: 800; color: #0f172a; font-size: 13px; }

    /* Signatures Section */
    .signatures-section {
      border-top: 2px solid #0f172a;
      padding-top: 18px;
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 600px) {
      .signatures-section { grid-template-columns: 1fr; }
      .doc-header { flex-direction: column; align-items: stretch; }
      .week-period-box { text-align: left; }
    }
    .sig-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      padding-bottom: 8px;
      margin-bottom: 8px;
      min-height: 28px;
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 16px;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sig-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Unit Section */
    .unit-section {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
      border: 1px solid #e2e8f0;
      padding: 24px;
      margin-bottom: 24px;
      position: relative;
    }
    .unit-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .unit-tag {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #e11d48;
      background-color: #ffe4e6;
      border: 1px solid #fecdd3;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 6px;
    }
    .unit-title {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .unit-badges {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      flex-wrap: wrap;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid transparent;
    }
    .badge-gray {
      background-color: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }
    .badge-green {
      background-color: #ecfdf5;
      color: #059669;
      border-color: #a7f3d0;
    }
    .unit-date-box {
      text-align: right;
    }
    .unit-date-day {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .unit-date-iso {
      font-size: 11px;
      color: #64748b;
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
    }

    /* Scope & Repairs */
    .scope-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .scope-label {
      font-weight: 800;
      font-size: 10px;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .scope-text {
      color: #1e293b;
      line-height: 1.4;
    }

    /* Photo Categories */
    .photos-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .photo-category {
      border-radius: 10px;
      padding: 14px;
    }
    .before-section {
      background-color: #fff1f2;
      border: 1px solid #fecdd3;
    }
    .after-section {
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .badge-count {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: #ffffff;
      border: 1px solid rgba(0,0,0,0.1);
    }

    /* UNGROUPED, UNSTRETCHED PHOTO GRID */
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    }
    @media (max-width: 520px) {
      .photo-grid {
        grid-template-columns: 1fr;
      }
    }
    .photo-card {
      background-color: #0f172a;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.15);
      position: relative;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .photo-img-wrap {
      width: 100%;
      height: 240px;
      background-color: #020617;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .photo-img-wrap img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    }
    .photo-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      font-size: 9px;
      font-weight: 800;
      padding: 3px 6px;
      border-radius: 4px;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
    .badge-rose { background-color: #be123c; border: 1px solid #fda4af; }
    .badge-emerald { background-color: #047857; border: 1px solid #6ee7b7; }
    .photo-caption {
      background-color: rgba(15, 23, 42, 0.95);
      color: #f8fafc;
      font-size: 11px;
      padding: 6px 10px;
      border-top: 1px solid #334155;
    }
    .empty-photo-box {
      text-align: center;
      color: #94a3b8;
      font-style: italic;
      font-size: 12px;
      padding: 24px;
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
    }

    /* Unit Footer */
    .unit-footer-bar {
      margin-top: 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      flex-wrap: wrap;
      gap: 6px;
    }

    /* Multi-Page Print Rules for Android Chrome / iOS / Desktop */
    @media print {
      body {
        background-color: #ffffff !important;
        font-size: 11px !important;
      }
      .top-action-bar, .no-print {
        display: none !important;
      }
      .report-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .report-card, .unit-section {
        box-shadow: none !important;
        border: 1px solid #cbd5e1 !important;
        margin-bottom: 0 !important;
        padding: 16px !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
      .photo-img-wrap {
        height: 190px !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Sticky Action Bar (Top for Mobile & Desktop) -->
  <div class="top-action-bar no-print">
    <div>
      <div class="brand-title">FieldLog • Weekly Work Report</div>
      <div class="brand-subtitle">${escapeHtml(profile.workerName)} • ${dates[0]} to ${dates[6]}</div>
    </div>
    <div class="action-btn-group">
      <button class="action-btn action-btn-primary" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <a class="action-btn action-btn-secondary" href="mailto:${encodeURIComponent(
        profile.bossEmail || ''
      )}?subject=${encodeURIComponent(
    `Weekly Work Report: ${profile.workerName} (${dates[0]} to ${dates[6]})`
  )}&body=${encodeURIComponent(
    `Hi ${profile.bossName},\n\nPlease find my work report and all before/after photos for the week attached.\n\nTotal Hours: ${totalHours.toFixed(
      1
    )} hrs\nUnits Serviced: ${unitList.length} units\n\nThanks,\n${profile.workerName}`
  )}">
        ✉️ Email Boss
      </a>
    </div>
  </div>

  <div class="report-container">
    <!-- ================================================================= -->
    <!-- PAGE 1: DEDICATED TIMESHEET HOURS BREAKDOWN & SIGNATURES          -->
    <!-- ================================================================= -->
    <div class="report-card">
      <div class="doc-header">
        <div>
          <h1 class="doc-title">Weekly Work & Unit Report</h1>
          <div class="doc-meta">
            Technician: <strong>${escapeHtml(profile.workerName || 'Coleby Braddy')}</strong>
            ${profile.email ? `(${escapeHtml(profile.email)})` : ''}
          </div>
          <div class="doc-meta">
            Supervisor: <strong>${escapeHtml(profile.bossName || 'Jermaine')}</strong>
            ${profile.bossEmail ? `(${escapeHtml(profile.bossEmail)})` : ''}
          </div>
        </div>

        <div class="week-period-box">
          <div class="week-label">Work Week Period</div>
          <div class="week-dates">${startDateFormatted} to ${endDateFormatted}</div>
          <div class="week-count">✓ ${unitList.length} Units Finished & Inspected</div>
        </div>
      </div>

      <!-- Section 1: Timesheet Table -->
      <div class="section-title">
        <span>1. Weekly Hours Breakdown</span>
        <span style="font-size: 11px; color: #64748b; font-weight: normal;">Standard 30m lunch deductions applied</span>
      </div>

      <table class="timesheet-table">
        <thead>
          <tr>
            <th style="text-align: left;">Date / Day</th>
            <th class="text-center">Clock In</th>
            <th class="text-center">Clock Out</th>
            <th class="text-center">Lunch</th>
            <th class="text-center">Units Done</th>
            <th class="text-right">Total Net Hours</th>
          </tr>
        </thead>
        <tbody>
          ${dailyRowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-transform: uppercase;">Weekly Total Hours</td>
            <td class="text-center font-bold">${unitList.length} Units</td>
            <td class="text-right font-mono font-bold" style="font-size: 14px;">${totalHours.toFixed(1)} hrs</td>
          </tr>
        </tfoot>
      </table>

      <div class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-title">Regular Hours</span>
          <span class="kpi-val">${totalRegular.toFixed(1)} hrs</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Overtime Hours</span>
          <span class="kpi-val ${totalOvertime > 0 ? 'text-rose' : ''}">${totalOvertime.toFixed(1)} hrs</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Units Serviced</span>
          <span class="kpi-val">${unitList.length} units</span>
        </div>
      </div>

      <!-- Signatures & Sign-off on Page 1 -->
      <div class="signatures-section">
        <div class="sig-box">
          <div class="sig-line">
            <span>${escapeHtml(profile.workerName || 'Coleby Braddy')}</span>
          </div>
          <div class="sig-label">Painter / Technician Signature</div>
          <div class="sig-sub">I certify that the daily hours logged and units serviced above are accurate.</div>
        </div>

        <div class="sig-box">
          <div class="sig-line">
            <span>${escapeHtml(supervisorSignature?.signedBy || profile.bossName || 'Jermaine')}</span>
            ${
              supervisorSignature
                ? `<span style="font-size: 10px; font-weight: 700; color: #059669; font-family: sans-serif;">✓ SIGNED & APPROVED</span>`
                : ''
            }
          </div>
          <div class="sig-label">Supervisor Approval</div>
          <div class="sig-sub">
            ${
              supervisorSignature
                ? `Signed on ${new Date(supervisorSignature.signedAt).toLocaleDateString()}`
                : 'Pending supervisor review and sign-off.'
            }
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- PAGES 2+: ALL UNITS WITH COMPLETE UNGROUPED BEFORE/AFTER PHOTOS    -->
    <!-- ================================================================= -->
    ${
      unitList.length === 0
        ? `
      <div class="report-card page-break text-center" style="padding: 40px;">
        <h3 style="font-size: 16px; color: #64748b; font-weight: 600;">No units or photos recorded for this week.</h3>
      </div>`
        : unitsHtml
    }
  </div>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Downloads the complete standalone HTML report file.
 * Perfect for sending directly to an Android supervisor who can tap it to open in Chrome!
 */
export function downloadStandaloneHtmlReport(data: HtmlReportData): void {
  const htmlContent = generateStandaloneHtmlReport(data);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const filename = `FieldLog_Report_${data.dates[0]}_to_${data.dates[6]}_${(data.profile.workerName || 'tech').replace(
    /\s+/g,
    '_'
  )}.html`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens the standalone HTML report in a new tab where Android Chrome or any browser
 * can view every single photo and tap native "Print / Save as PDF".
 */
export function openStandaloneHtmlReport(data: HtmlReportData): void {
  const htmlContent = generateStandaloneHtmlReport(data);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
