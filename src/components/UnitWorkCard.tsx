import React, { useRef } from 'react';
import { Camera, Trash2, Check, Paintbrush, FileText } from 'lucide-react';
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
    <div className="bg-[#1c1c1e] rounded-[18px] border border-[#2c2c2e]/70 p-4 shadow-sm space-y-3.5 transition-all">
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

      {/* iOS Card Header: Unit Number & Paint Color with Delete Action */}
      <div className="flex items-start justify-between gap-3 pb-1 border-b border-[#38383a]/40">
        <div className="flex-1 space-y-2">
          {/* Unit Name Input (Styled like iOS Large Cell Title) */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#0a84ff]">
              Unit
            </span>
            <input
              type="text"
              placeholder="e.g. 1324, Apt 4B"
              value={unit.unitNumber}
              onChange={(e) => onUpdateUnit({ ...unit, unitNumber: e.target.value })}
              className="w-full bg-transparent text-[18px] font-bold text-white placeholder-[#636366] focus:outline-none"
            />
          </div>

          {/* Paint Color Input */}
          <div className="flex items-center gap-2 bg-[#2c2c2e] px-3 py-1.5 rounded-[10px] border border-[#3a3a3c]/60">
            <Paintbrush className="w-3.5 h-3.5 text-[#8e8e93] shrink-0" />
            <input
              type="text"
              placeholder="Paint color: e.g. Agreeable Gray, Semi-Gloss"
              value={unit.paintColor || ''}
              onChange={(e) => onUpdateUnit({ ...unit, paintColor: e.target.value })}
              className="w-full bg-transparent text-[13px] text-white placeholder-[#8e8e93] focus:outline-none"
            />
          </div>
        </div>

        {/* Delete Unit Action (iOS Red Circle Icon) */}
        <button
          type="button"
          onClick={() => {
            if (confirm(`Remove ${unit.unitNumber || 'this unit'}?`)) {
              onDeleteUnit(unit.id);
            }
          }}
          className="w-8 h-8 rounded-full bg-[#2c2c2e] text-[#ff453a] hover:bg-[#3a3a3c] active:opacity-60 transition-all flex items-center justify-center shrink-0 mt-0.5 cursor-pointer"
          title="Delete unit"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Scope / Damage Notes Field */}
      <div className="flex items-center gap-2 bg-[#2c2c2e] px-3 py-2 rounded-[10px] border border-[#3a3a3c]/60">
        <FileText className="w-3.5 h-3.5 text-[#8e8e93] shrink-0" />
        <input
          type="text"
          placeholder="Repairs: e.g. Patched door holes, rolled wall, cleaned floor"
          value={unit.notes || ''}
          onChange={(e) => onUpdateUnit({ ...unit, notes: e.target.value })}
          className="w-full bg-transparent text-[13px] text-white placeholder-[#8e8e93] focus:outline-none"
        />
      </div>

      {/* Before & After Photo Sections (Apple Photos Style) */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        {/* BEFORE COLUMN */}
        <div className="bg-[#2c2c2e]/60 border border-[#3a3a3c]/60 rounded-[14px] p-2.5 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff453a]">
                [Before Damage]
              </span>
              <span className="text-[10px] font-semibold text-[#8e8e93] font-mono-numbers">
                {beforePhotos.length}
              </span>
            </div>

            {beforePhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {beforePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => onOpenPhotoViewer(photo, unit.unitNumber)}
                    className="aspect-square bg-black rounded-[8px] overflow-hidden border border-[#38383a] cursor-pointer relative active:scale-95 transition-transform"
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
            className="w-full h-10 bg-[#2c2c2e] hover:bg-[#38383a] active:scale-[0.98] border border-[#ff453a]/30 rounded-[10px] text-[#ff453a] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Snap Damage</span>
          </button>
        </div>

        {/* AFTER COLUMN */}
        <div className="bg-[#2c2c2e]/60 border border-[#3a3a3c]/60 rounded-[14px] p-2.5 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#30d158]">
                [After Painted]
              </span>
              <span className="text-[10px] font-semibold text-[#8e8e93] font-mono-numbers">
                {afterPhotos.length}
              </span>
            </div>

            {afterPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {afterPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => onOpenPhotoViewer(photo, unit.unitNumber)}
                    className="aspect-square bg-black rounded-[8px] overflow-hidden border border-[#38383a] cursor-pointer relative active:scale-95 transition-transform"
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
            className="w-full h-10 bg-[#2c2c2e] hover:bg-[#38383a] active:scale-[0.98] border border-[#30d158]/30 rounded-[10px] text-[#30d158] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Snap Painted</span>
          </button>
        </div>
      </div>

      {/* iOS Native Switch Toggle: Finished & Floors Cleaned */}
      <div
        onClick={() => onUpdateUnit({ ...unit, isCompleted: !unit.isCompleted })}
        className="flex items-center justify-between px-3 py-2.5 bg-[#252528] rounded-[12px] border border-[#38383a]/60 cursor-pointer select-none active:bg-[#2c2c2e] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              unit.isCompleted ? 'bg-[#30d158] text-black' : 'bg-[#3a3a3c] text-transparent'
            }`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-[13px] font-medium text-white">
            {unit.isCompleted ? 'Finished, Painted & Cleaned' : 'Mark Done & Floors Cleaned'}
          </span>
        </div>

        {/* Native iOS Switch Anatomy */}
        <div
          className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors relative ${
            unit.isCompleted ? 'bg-[#30d158]' : 'bg-[#39393d]'
          }`}
        >
          <div
            className={`w-[27px] h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.25)] transition-transform duration-200 ${
              unit.isCompleted ? 'translate-x-[20px]' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
