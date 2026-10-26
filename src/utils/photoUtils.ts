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

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 440;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Wall background
      ctx.fillStyle = isBefore ? '#27272a' : '#1e293b';
      ctx.fillRect(0, 0, 640, 440);

      // Inner wall surface
      ctx.fillStyle = isBefore ? '#3f3f46' : '#334155';
      ctx.fillRect(30, 30, 580, 290);

      if (isBefore) {
        // Draw drywall hole and fracture lines
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.ellipse(320, 175, 75, 52, 0.15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Cracks radiating from drywall damage
        ctx.strokeStyle = '#a1a1aa';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(250, 160); ctx.lineTo(170, 130);
        ctx.moveTo(380, 185); ctx.lineTo(470, 215);
        ctx.moveTo(330, 125); ctx.lineTo(345, 75);
        ctx.moveTo(300, 225); ctx.lineTo(270, 285);
        ctx.stroke();

        // Prominent Red [BEFORE · DAMAGE] Banner
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(40, 40, 220, 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('[BEFORE · DAMAGE]', 52, 63);
      } else {
        // Smooth painted surface
        ctx.fillStyle = '#475569';
        ctx.fillRect(45, 45, 550, 260);

        // Prominent Green [AFTER · PAINTED] Banner
        ctx.fillStyle = '#059669';
        ctx.fillRect(40, 40, 240, 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('[AFTER · PAINTED]', 52, 63);

        // Quality check circle and checkmark
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(320, 175, 44, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(302, 175); ctx.lineTo(316, 189); ctx.lineTo(342, 158);
        ctx.stroke();
      }

      // Bottom info card
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 340, 640, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(unitLabel, 28, 375);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(detail, 28, 405);

      return canvas.toDataURL('image/jpeg', 0.88);
    }
  }

  // Fallback minimal 1x1 JPEG
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
}
