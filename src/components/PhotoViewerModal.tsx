import React from 'react';
import { X, Calendar, Tag, Trash2, Download, Home, Paintbrush } from 'lucide-react';
import { WorkPhoto, UnitRepair } from '../types/worklog';

interface PhotoViewerModalProps {
  photo: WorkPhoto | null;
  repairs?: UnitRepair[];
  onClose: () => void;
  onDelete?: (photoId: string) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photo,
  repairs = [],
  onClose,
  onDelete,
}) => {
  if (!photo) return null;

  const linkedRepair = repairs.find((r) => r.id === photo.repairId);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `PaintDrywall_${photo.category.replace(/[^a-zA-Z0-9]/g, '_')}_${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Damage / Hole':
      case 'Before Repair':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      case 'After / Finished':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Mud / Patch Progress':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'Texture Match':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'Paint Code / Can':
        return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      default:
        return 'text-neutral-300 border-neutral-700 bg-neutral-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getCategoryBadgeClass(
                photo.category
              )}`}
            >
              {photo.category}
            </span>
            {linkedRepair && (
              <span className="text-xs text-neutral-300 truncate max-w-[200px] flex items-center gap-1 font-medium">
                <Home className="w-3.5 h-3.5 text-amber-400" />
                {linkedRepair.unitNumber} ({linkedRepair.roomArea})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              title="Download image"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this photo from the work log?')) {
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
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo Display */}
        <div className="flex-1 bg-black/60 flex items-center justify-center overflow-auto p-2 min-h-[260px] max-h-[58vh]">
          <img
            src={photo.dataUrl}
            alt={photo.caption || 'Paint drywall repair photo'}
            className="max-h-[54vh] max-w-full object-contain rounded-md shadow-md select-none"
          />
        </div>

        {/* Footer Details */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 space-y-2">
          {photo.caption ? (
            <p className="text-sm font-medium text-neutral-200">{photo.caption}</p>
          ) : (
            <p className="text-xs italic text-neutral-500">No caption provided for this photo.</p>
          )}

          <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-800/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>{new Date(photo.timestamp).toLocaleString()}</span>
            </div>
            {linkedRepair && (
              <div className="flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-neutral-300 font-medium">
                  {linkedRepair.damageType} • Color: {linkedRepair.paintColor}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
