/**
 * Compress an uploaded or camera-snapped photo so that weekly logs
 * with dozens of before/after photos remain fast and sync effortlessly.
 */
export async function compressImage(file: File, maxDimension = 1280, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Creates realistic drywall/paint photo illustrations for demo entries
 */
export function createPaintDrywallSvg(type: 'damage' | 'patch' | 'after' | 'paintcan', title: string, subtitle: string): string {
  let visualSvg = '';

  if (type === 'damage') {
    // Wall with jagged hole / damage
    visualSvg = `
      <rect x="80" y="50" width="440" height="240" rx="8" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
      <!-- Drywall hole jagged shape -->
      <polygon points="260,120 320,135 340,170 310,210 250,225 210,180 220,140" fill="#334155" stroke="#1e293b" stroke-width="3"/>
      <!-- Broken gypsum crumb lines -->
      <line x1="260" y1="120" x2="280" y2="100" stroke="#94a3b8" stroke-width="2"/>
      <line x1="340" y1="170" x2="370" y2="180" stroke="#94a3b8" stroke-width="2"/>
      <line x1="210" y1="180" x2="185" y2="200" stroke="#94a3b8" stroke-width="2"/>
      <text x="235" y="175" fill="#f8fafc" font-family="monospace" font-size="13" font-weight="bold">HOLE</text>
      <!-- Red tag -->
      <rect x="95" y="65" width="120" height="26" rx="4" fill="#ef4444"/>
      <text x="105" y="82" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold">DAMAGE / BEFORE</text>
    `;
  } else if (type === 'patch') {
    // Drywall patch with tape & joint compound
    visualSvg = `
      <rect x="80" y="50" width="440" height="240" rx="8" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
      <!-- Joint compound spread oval -->
      <ellipse cx="280" cy="170" rx="95" ry="65" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
      <!-- Mesh tape lines -->
      <line x1="230" y1="140" x2="330" y2="140" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="230" y1="170" x2="330" y2="170" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="230" y1="200" x2="330" y2="200" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="250" y1="120" x2="250" y2="220" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="280" y1="120" x2="280" y2="220" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="310" y1="120" x2="310" y2="220" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <!-- Trowel stroke text -->
      <text x="240" y="174" fill="#64748b" font-family="sans-serif" font-size="11" font-weight="bold">MUD & TAPE</text>
      <!-- Amber tag -->
      <rect x="95" y="65" width="130" height="26" rx="4" fill="#f59e0b"/>
      <text x="105" y="82" fill="#0f172a" font-family="sans-serif" font-size="11" font-weight="bold">PATCH IN PROGRESS</text>
    `;
  } else if (type === 'after') {
    // Finished, seamless painted wall
    visualSvg = `
      <rect x="80" y="50" width="440" height="240" rx="8" fill="#e2e8f0" stroke="#10b981" stroke-width="3"/>
      <!-- Seamless subtle texture dots -->
      <circle cx="240" cy="150" r="1.5" fill="#cbd5e1"/>
      <circle cx="280" cy="160" r="1.5" fill="#cbd5e1"/>
      <circle cx="260" cy="190" r="1.5" fill="#cbd5e1"/>
      <circle cx="310" cy="175" r="1.5" fill="#cbd5e1"/>
      <!-- Clean roller pattern -->
      <rect x="220" y="110" width="120" height="120" rx="6" fill="#f8fafc" stroke="#10b981" stroke-dasharray="4 4"/>
      <text x="245" y="175" fill="#10b981" font-family="sans-serif" font-size="13" font-weight="bold">PAINTED 100%</text>
      <!-- Green tag -->
      <rect x="95" y="65" width="120" height="26" rx="4" fill="#10b981"/>
      <text x="105" y="82" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold">AFTER / FINISHED</text>
    `;
  } else {
    // Paint can & color tag
    visualSvg = `
      <rect x="80" y="50" width="440" height="240" rx="8" fill="#1e293b"/>
      <!-- Paint Can cylinder -->
      <rect x="230" y="110" width="140" height="150" rx="10" fill="#94a3b8" stroke="#f8fafc" stroke-width="2"/>
      <ellipse cx="300" cy="110" rx="70" ry="20" fill="#cbd5e1" stroke="#f8fafc" stroke-width="2"/>
      <!-- Paint label -->
      <rect x="240" y="145" width="120" height="85" rx="4" fill="#f8fafc"/>
      <text x="250" y="170" fill="#0f172a" font-family="sans-serif" font-size="11" font-weight="bold">SW 7029</text>
      <text x="250" y="190" fill="#64748b" font-family="sans-serif" font-size="9">AGREEABLE GRAY</text>
      <text x="250" y="210" fill="#0284c7" font-family="sans-serif" font-size="9" font-weight="bold">EGGSHELL</text>
      <!-- Blue tag -->
      <rect x="95" y="65" width="130" height="26" rx="4" fill="#0284c7"/>
      <text x="105" y="82" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold">PAINT CAN / CODE</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <rect width="600" height="380" fill="#0f172a"/>
    ${visualSvg}
    <rect x="0" y="310" width="600" height="70" fill="#020617"/>
    <text x="24" y="338" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="bold">${title}</text>
    <text x="24" y="362" fill="#94a3b8" font-family="sans-serif" font-size="12">${subtitle}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
