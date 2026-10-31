import React, { useState } from 'react';
import { X, Trash2, Download, Share2, AlertTriangle } from 'lucide-react';
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
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-w-xl sm:rounded-[24px] bg-black border sm:border-[#2C2C2E] overflow-hidden flex flex-col justify-between">
        {/* iOS Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C2E] bg-black/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isBefore
                  ? 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30'
                  : 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30'
              }`}
            >
              {isBefore ? 'BEFORE · DAMAGE' : 'AFTER · PAINTED'}
            </span>
            {unitLabel && (
              <span className="text-[14px] font-semibold text-white">{unitLabel}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              title="Save Photo"
              className="p-2 text-[#0A84FF] hover:bg-[#1C1C1E] active:scale-90 rounded-full transition-all"
            >
              <Download className="w-5 h-5" />
            </button>
            {onDelete && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                title="Delete Photo"
                className="p-2 text-[#FF453A] hover:bg-[#FF453A]/10 active:scale-90 rounded-full transition-all cursor-pointer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#8E8E93] hover:text-white hover:bg-[#1C1C1E] active:scale-90 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Modal Delete Confirmation Banner */}
        {showConfirmDelete && (
          <div className="bg-[#FF453A]/15 border-b border-[#FF453A]/30 px-4 py-2.5 flex items-center justify-between text-xs text-white animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
              <span className="font-medium">Permanently delete this photo?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-2.5 py-1 bg-[#2C2C2E] hover:bg-[#38383A] text-white rounded-[7px] text-[11px] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDelete) {
                    onDelete(photo.id);
                  }
                  onClose();
                }}
                className="px-2.5 py-1 bg-[#FF453A] hover:bg-[#E0382E] text-white rounded-[7px] text-[11px] font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Photo View Container */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden select-none">
          <img
            src={photo.dataUrl}
            alt={photo.caption || 'Work documentation photo'}
            className="max-h-[70vh] max-w-full object-contain rounded-[14px] shadow-2xl"
          />
        </div>

        {/* iOS Bottom Info Sheet */}
        <div className="px-5 py-4 border-t border-[#2C2C2E] bg-[#1C1C1E]/80 backdrop-blur-md flex items-center justify-between text-[13px] text-[#8E8E93]">
          <div>
            <p className="text-white font-medium">
              {photo.caption || (isBefore ? 'Wall damage documented before patching' : 'Patched, painted & floor cleaned')}
            </p>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">
              High resolution proof for supervisor timesheet
            </p>
          </div>
          <span className="font-mono text-[13px] text-[#8E8E93] bg-[#2C2C2E] px-2.5 py-1 rounded-[8px]">
            {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
