import React, { useRef, useState } from 'react';
import { Camera, Trash2, Check, Paintbrush, FileText, Images, Loader2, FolderOpen, Upload } from 'lucide-react';
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
  const beforeGalleryRef = useRef<HTMLInputElement>(null);
  const afterCameraRef = useRef<HTMLInputElement>(null);
  const afterGalleryRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState<'before' | 'after' | null>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(type);
    try {
      const newPhotos: UnitPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedDataUrl = await compressImage(file, 1024, 0.68);
        newPhotos.push({
          id: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${i}`,
          dataUrl: compressedDataUrl,
          type,
          timestamp: new Date().toISOString(),
          caption: type === 'before' ? 'Damage / Area before patch' : 'Painted & finished work',
        });
      }

      onUpdateUnit({
        ...unit,
        photos: [...newPhotos, ...unit.photos],
      });
    } catch (err) {
      console.error('Error attaching photo:', err);
    } finally {
      setIsProcessing(null);
      e.target.value = '';
    }
  };

  const beforePhotos = unit.photos.filter((p) => p.type === 'before');
  const afterPhotos = unit.photos.filter((p) => p.type === 'after');

  const handleDeletePhoto = (photoId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const updated = unit.photos.filter((p) => p.id !== photoId);
    onUpdateUnit({
      ...unit,
      photos: updated,
    });
  };

  return (
    <div className="bg-[#1c1c1e] rounded-[18px] border border-[#2c2c2e]/70 p-4 shadow-sm space-y-3.5 transition-all">
      {/* Hidden file inputs: Snap with Camera */}
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

      {/* Hidden file inputs: Upload from Camera Roll / Files / Photo Library */}
      <input
        type="file"
        ref={beforeGalleryRef}
        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp"
        multiple
        onChange={(e) => handleCapture(e, 'before')}
        className="hidden"
      />
      <input
        type="file"
        ref={afterGalleryRef}
        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp"
        multiple
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

          {/* Prominent Unit Photo Count Badge */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#2c2c2e] border border-[#3a3a3c] text-white shadow-sm">
              <Camera className="w-3.5 h-3.5 text-[#0a84ff]" />
              <span>{unit.photos.length} Total {unit.photos.length === 1 ? 'Photo' : 'Photos'}</span>
              <span className="text-[#8e8e93]">·</span>
              <span className="text-[#ff453a]">{beforePhotos.length} Before</span>
              <span className="text-[#8e8e93]">/</span>
              <span className="text-[#30d158]">{afterPhotos.length} After</span>
            </span>
          </div>
        </div>

        {/* Delete Unit Action */}
        <button
          type="button"
          onClick={() => onDeleteUnit(unit.id)}
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30 font-mono-numbers">
                {beforePhotos.length} {beforePhotos.length === 1 ? 'Pic' : 'Pics'}
              </span>
            </div>

            {beforePhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {beforePhotos.map((photo, pIdx) => (
                  <div
                    key={photo.id}
                    onClick={() => onOpenPhotoViewer(photo, unit.unitNumber)}
                    className="aspect-square bg-black rounded-[10px] overflow-hidden border border-[#38383a] cursor-pointer relative group active:scale-95 transition-transform"
                  >
                    <img src={photo.dataUrl} alt="Before" className="w-full h-full object-cover" />
                    
                    {/* Photo index count */}
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm rounded text-[9px] font-bold text-white font-mono">
                      #{pIdx + 1}
                    </span>

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePhoto(photo.id, e)}
                      title="Delete photo"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 hover:bg-[#ff453a] text-white flex items-center justify-center transition-colors shadow-md border border-white/20 active:scale-90"
                    >
                      <Trash2 className="w-3 h-3 text-[#ff453a] hover:text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => beforeGalleryRef.current?.click()}
                className="border border-dashed border-[#ff453a]/30 hover:border-[#ff453a]/60 rounded-[10px] p-2.5 text-center my-1 bg-[#ff453a]/5 cursor-pointer active:scale-95 transition-all"
                title="Select from Camera Roll or Files"
              >
                <FolderOpen className="w-4 h-4 mx-auto text-[#ff453a] mb-1" />
                <span className="text-[10px] font-semibold text-white block">No Damage Pics</span>
                <span className="text-[9px] text-[#8e8e93] block">Snap or pick from files</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-auto pt-2">
            <button
              type="button"
              disabled={isProcessing === 'before'}
              onClick={() => beforeCameraRef.current?.click()}
              className="h-9 bg-[#2c2c2e] hover:bg-[#38383a] active:scale-[0.97] border border-[#ff453a]/30 rounded-[10px] text-[#ff453a] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Snap live damage photo with camera"
            >
              {isProcessing === 'before' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
              )}
              <span>Camera</span>
            </button>
            <button
              type="button"
              disabled={isProcessing === 'before'}
              onClick={() => beforeGalleryRef.current?.click()}
              className="h-9 bg-[#2c2c2e] hover:bg-[#38383a] active:scale-[0.97] border border-[#ff453a]/30 rounded-[10px] text-[#ff453a] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Upload from Camera Roll or Files"
            >
              <FolderOpen className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Files / Roll</span>
            </button>
          </div>
        </div>

        {/* AFTER COLUMN */}
        <div className="bg-[#2c2c2e]/60 border border-[#3a3a3c]/60 rounded-[14px] p-2.5 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#30d158]">
                [After Painted]
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 font-mono-numbers">
                {afterPhotos.length} {afterPhotos.length === 1 ? 'Pic' : 'Pics'}
              </span>
            </div>

            {afterPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {afterPhotos.map((photo, pIdx) => (
                  <div
                    key={photo.id}
                    onClick={() => onOpenPhotoViewer(photo, unit.unitNumber)}
                    className="aspect-square bg-black rounded-[10px] overflow-hidden border border-[#38383a] cursor-pointer relative group active:scale-95 transition-transform"
                  >
                    <img src={photo.dataUrl} alt="After" className="w-full h-full object-cover" />
                    
                    {/* Photo index count */}
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm rounded text-[9px] font-bold text-white font-mono">
                      #{pIdx + 1}
                    </span>

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePhoto(photo.id, e)}
                      title="Delete photo"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 hover:bg-[#ff453a] text-white flex items-center justify-center transition-colors shadow-md border border-white/20 active:scale-90"
                    >
                      <Trash2 className="w-3 h-3 text-[#ff453a] hover:text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => afterGalleryRef.current?.click()}
                className="border border-dashed border-[#30d158]/30 hover:border-[#30d158]/60 rounded-[10px] p-2.5 text-center my-1 bg-[#30d158]/5 cursor-pointer active:scale-95 transition-all"
                title="Select from Camera Roll or Files"
              >
                <FolderOpen className="w-4 h-4 mx-auto text-[#30d158] mb-1" />
                <span className="text-[10px] font-semibold text-white block">No Painted Pics</span>
                <span className="text-[9px] text-[#8e8e93] block">Snap or pick from files</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-auto pt-2">
            <button
              type="button"
              disabled={isProcessing === 'after'}
              onClick={() => afterCameraRef.current?.click()}
              className="h-9 bg-[#2c2c2e] hover:bg-[#38383a] active:scale-[0.97] border border-[#30d158]/30 rounded-[10px] text-[#30d158] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Snap live painted photo with camera"
            >
              {isProcessing === 'after' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
              )}
              <span>Camera</span>
            </button>
            <button
              type="button"
              disabled={isProcessing === 'after'}
              onClick={() => afterGalleryRef.current?.click()}
              className="h-9 bg-[#2c2c2e] hover:bg-[#38383a] active:scale-[0.97] border border-[#30d158]/30 rounded-[10px] text-[#30d158] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Upload from Camera Roll or Files"
            >
              <FolderOpen className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Files / Roll</span>
            </button>
          </div>
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
