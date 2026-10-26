/**
 * Compress an uploaded or camera-snapped image to avoid bloated storage.
 * Mobile phone cameras often produce 5MB - 12MB photos; this scales down
 * cleanly to max 1280px maintaining high readability for serial plates and job details.
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
 * Creates clean placeholder illustration data URLs for initial demo work logs
 */
export function createSvgPhotoDataUrl(title: string, subtitle: string, accentColor = '#0284c7'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#1e293b"/>
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="600" height="400" fill="url(#grid)" opacity="0.6"/>
    
    <!-- Equipment / Work graphic representation -->
    <rect x="70" y="60" width="460" height="240" rx="16" fill="#0f172a" stroke="#475569" stroke-width="2"/>
    <rect x="95" y="85" width="200" height="190" rx="8" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
    <circle cx="195" cy="180" r="50" fill="none" stroke="${accentColor}" stroke-width="4" stroke-dasharray="8 6"/>
    <line x1="195" y1="130" x2="195" y2="230" stroke="${accentColor}" stroke-width="3"/>
    <line x1="145" y1="180" x2="245" y2="180" stroke="${accentColor}" stroke-width="3"/>
    
    <!-- Info plate block -->
    <rect x="320" y="85" width="180" height="35" rx="6" fill="#334155"/>
    <text x="330" y="108" fill="#e2e8f0" font-family="monospace" font-size="13" font-weight="bold">TAG #4992-B</text>
    <rect x="320" y="130" width="180" height="15" rx="4" fill="#334155" opacity="0.8"/>
    <rect x="320" y="155" width="150" height="15" rx="4" fill="#334155" opacity="0.8"/>
    <rect x="320" y="180" width="170" height="15" rx="4" fill="#334155" opacity="0.8"/>
    <rect x="320" y="210" width="120" height="25" rx="6" fill="${accentColor}" opacity="0.3"/>
    <text x="330" y="227" fill="${accentColor}" font-family="sans-serif" font-size="11" font-weight="bold">INSPECTED</text>

    <!-- Overlay Banner text -->
    <rect x="0" y="320" width="600" height="80" fill="rgba(15,23,42,0.95)"/>
    <text x="24" y="352" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="bold">${title}</text>
    <text x="24" y="378" fill="#94a3b8" font-family="sans-serif" font-size="13">${subtitle}</text>
    <circle cx="560" cy="360" r="14" fill="${accentColor}"/>
    <path d="M 555 360 L 558 363 L 566 355" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
