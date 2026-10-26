import React from 'react';
import { X, Trash2, Download } from 'lucide-react';
import { UnitPhoto } from '../types/worklog';

interface PhotoViewerModalProps {
  photo: UnitPhoto | null;
  unitLabel?: string;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photo,
  unitLabel,
  onClose,
  onDelete,
}) => {
  if (!photo) return null;

  const isBefore = photo.type === 'before';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `Photo_${photo.type}_${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isBefore
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {isBefore ? 'BEFORE · DAMAGE' : 'AFTER · PAINTED'}
            </span>
            {unitLabel && (
              <span className="text-xs font-semibold text-zinc-300">{unitLabel}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              title="Download photo"
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this photo?')) {
                    onDelete(photo.id);
                    onClose();
                  }
                }}
                title="Delete photo"
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo view */}
        <div className="flex-1 bg-black/80 flex items-center justify-center overflow-auto p-2 min-h-[260px] max-h-[60vh]">
          <img
            src={photo.dataUrl}
            alt={photo.caption || 'Work photo'}
            className="max-h-[56vh] max-w-full object-contain rounded-md select-none"
          />
        </div>

        {/* Caption */}
        <div className="p-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>{photo.caption || (isBefore ? 'Damage before patch' : 'Finished painted wall')}</span>
          <span className="font-mono-numbers">
            {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
