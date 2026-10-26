import React, { useRef } from 'react';
import { Camera, Trash2, CheckCircle2, Circle, Image as ImageIcon } from 'lucide-react';
import { UnitWork, UnitPhoto } from '../types/worklog';
import { compressImage } from '../utils/photoUtils';

interface UnitWorkCardProps {
  unit: UnitWork;
  onUpdateUnit: (updated: UnitWork) => void;
  onDeleteUnit: (unitId: string) => void;
  onOpenPhotoViewer: (photo: UnitPhoto, unitLabel: string) => void;
}

export const UnitWorkCard: React.FC<UnitWorkCardProps> = ({
  unit,
  onUpdateUnit,
  onDeleteUnit,
  onOpenPhotoViewer,
}) => {
  const beforeCameraRef = useRef<HTMLInputElement>(null);
  const afterCameraRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImage(file, 1280, 0.78);
      const newPhoto: UnitPhoto = {
        id: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        dataUrl: compressedDataUrl,
        type,
        timestamp: new Date().toISOString(),
        caption: type === 'before' ? 'Damage / Area before patch' : 'Painted & finished work',
      };

      onUpdateUnit({
        ...unit,
        photos: [newPhoto, ...unit.photos],
      });
    } catch (err) {
      console.error('Error saving photo', err);
      alert('Could not attach photo. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  const beforePhotos = unit.photos.filter((p) => p.type === 'before');
  const afterPhotos = unit.photos.filter((p) => p.type === 'after');

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3.5 hover:border-zinc-700/80 transition-colors">
      {/* Hidden file inputs for instant mobile camera snap */}
      <input
        type="file"
        ref={beforeCameraRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleCapture(e, 'before')}
        className="hidden"
      />
      <input
        type="file"
        ref={afterCameraRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleCapture(e, 'after')}
        className="hidden"
      />

      {/* Unit Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Unit / Apt #
            </label>
            <input
              type="text"
              placeholder="e.g. Unit 304, Apt 12B"
              value={unit.unitNumber}
              onChange={(e) => onUpdateUnit({ ...unit, unitNumber: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Paint Color
            </label>
            <input
              type="text"
              placeholder="e.g. Agreeable Gray, Swiss Coffee"
              value={unit.paintColor || ''}
              onChange={(e) => onUpdateUnit({ ...unit, paintColor: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete ${unit.unitNumber || 'this unit'}?`)) {
              onDeleteUnit(unit.id);
            }
          }}
          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors mt-5"
          title="Delete unit"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick notes */}
      <div>
        <input
          type="text"
          placeholder="Notes: e.g. Patched 2 door holes, rolled wall, floors cleaned"
          value={unit.notes || ''}
          onChange={(e) => onUpdateUnit({ ...unit, notes: e.target.value })}
          className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Before & After Photo Proof Columns */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* BEFORE COLUMN */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">
                Before / Damage
              </span>
              <span className="text-[10px] text-zinc-500 font-mono-numbers">
                {beforePhotos.length} pic{beforePhotos.length === 1 ? '' : 's'}
              </span>
            </div>

            {beforePhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {beforePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => onOpenPhotoViewer(photo, unit.unitNumber)}
                    className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 cursor-pointer relative group"
                  >
                    <img src={photo.dataUrl} alt="Before" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => beforeCameraRef.current?.click()}
            className="w-full py-2 px-2 bg-zinc-900 hover:bg-zinc-850 active:scale-[0.98] border border-dashed border-rose-500/30 hover:border-rose-500/60 rounded-lg text-rose-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap Damage</span>
          </button>
        </div>

        {/* AFTER COLUMN */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                After / Painted
              </span>
              <span className="text-[10px] text-zinc-500 font-mono-numbers">
                {afterPhotos.length} pic{afterPhotos.length === 1 ? '' : 's'}
              </span>
            </div>

            {afterPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {afterPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => onOpenPhotoViewer(photo, unit.unitNumber)}
                    className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 cursor-pointer relative group"
                  >
                    <img src={photo.dataUrl} alt="After" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => afterCameraRef.current?.click()}
            className="w-full py-2 px-2 bg-zinc-900 hover:bg-zinc-850 active:scale-[0.98] border border-dashed border-emerald-500/30 hover:border-emerald-500/60 rounded-lg text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap Painted</span>
          </button>
        </div>
      </div>

      {/* Done & Cleaned Floor Toggle */}
      <div
        onClick={() => onUpdateUnit({ ...unit, isCompleted: !unit.isCompleted })}
        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
          unit.isCompleted
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
        }`}
      >
        <span className="text-xs font-semibold">
          {unit.isCompleted ? 'Finished, Painted & Floors Cleaned' : 'Mark Unit Done & Cleaned'}
        </span>
        {unit.isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Circle className="w-4 h-4 text-zinc-600" />
        )}
      </div>
    </div>
  );
};
