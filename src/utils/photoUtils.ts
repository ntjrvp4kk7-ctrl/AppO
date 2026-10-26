export async function compressImage(file: File, maxDimension = 1280, quality = 0.78): Promise<string> {
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

export function createModernSamplePhoto(type: 'before' | 'after', unitLabel: string, detail: string): string {
  const isBefore = type === 'before';
  const tagColor = isBefore ? '#ef4444' : '#10b981';
  const tagLabel = isBefore ? 'BEFORE · DAMAGE' : 'AFTER · PAINTED';

  const artSvg = isBefore
    ? `
      <rect x="60" y="50" width="480" height="230" rx="12" fill="#27272a" stroke="#3f3f46" stroke-width="2"/>
      <!-- Hole in wall -->
      <polygon points="260,110 320,125 350,170 310,210 240,220 210,175 225,130" fill="#09090b" stroke="#71717a" stroke-width="2"/>
      <!-- Cracks around hole -->
      <line x1="260" y1="110" x2="280" y2="85" stroke="#a1a1aa" stroke-width="2"/>
      <line x1="350" y1="170" x2="385" y2="185" stroke="#a1a1aa" stroke-width="2"/>
      <line x1="210" y1="175" x2="180" y2="200" stroke="#a1a1aa" stroke-width="2"/>
      <text x="248" y="168" fill="#f43f5e" font-family="monospace" font-size="12" font-weight="bold">HOLE</text>
    `
    : `
      <rect x="60" y="50" width="480" height="230" rx="12" fill="#27272a" stroke="#10b981" stroke-width="2.5"/>
      <!-- Fresh smooth paint surface -->
      <rect x="80" y="70" width="440" height="190" rx="8" fill="#3f3f46" opacity="0.6"/>
      <circle cx="300" cy="165" r="50" fill="#10b981" opacity="0.15"/>
      <path d="M 280 165 L 295 180 L 325 150" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="245" y="220" fill="#34d399" font-family="sans-serif" font-size="13" font-weight="bold">CLEAN & PAINTED</text>
    `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <rect width="600" height="380" fill="#09090b"/>
    ${artSvg}
    
    <!-- Top badge -->
    <rect x="76" y="66" width="135" height="26" rx="6" fill="${tagColor}"/>
    <text x="88" y="83" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold">${tagLabel}</text>

    <!-- Bottom label -->
    <rect x="0" y="300" width="600" height="80" fill="#18181b"/>
    <text x="24" y="332" fill="#f4f4f5" font-family="sans-serif" font-size="16" font-weight="bold">${unitLabel}</text>
    <text x="24" y="356" fill="#a1a1aa" font-family="sans-serif" font-size="12">${detail}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
