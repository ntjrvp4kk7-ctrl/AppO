import React, { useRef, useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Trash2, Maximize2, Check, Sparkles } from 'lucide-react';
import { WorkPhoto, PhotoCategory, UnitRepair } from '../types/worklog';
import { compressImage } from '../utils/photoUtils';

interface PhotoSnapSectionProps {
  photos: WorkPhoto[];
  repairs: UnitRepair[];
  preselectedRepairId?: string | null;
  onAddPhoto: (photo: WorkPhoto) => void;
  onDeletePhoto: (photoId: string) => void;
  onOpenViewer: (photo: WorkPhoto) => void;
}

const CATEGORIES: PhotoCategory[] = [
  'Damage / Hole',
  'Before Repair',
  'Mud / Patch Progress',
  'Texture Match',
  'After / Finished',
  'Paint Code / Can',
];

const PRESETS: string[] = [
  'Pre-existing hole before patch',
  'Water damaged ceiling cutout',
  'Drywall backing & mesh tape',
  'Easy Sand hot mud feathered',
  'Texture matched to wall',
  'Primed stain blocker',
  'Painted 2 coats & blended',
  'Paint can formula tag',
];

export const PhotoSnapSection: React.FC<PhotoSnapSectionProps> = ({
  photos,
  repairs,
  preselectedRepairId,
  onAddPhoto,
  onDeletePhoto,
  onOpenViewer,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('Damage / Hole');
  const [selectedRepairId, setSelectedRepairId] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (preselectedRepairId) {
      setSelectedRepairId(preselectedRepairId);
    } else if (repairs.length === 1 && !selectedRepairId) {
      setSelectedRepairId(repairs[0].id);
    }
  }, [preselectedRepairId, repairs]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressedDataUrl = await compressImage(file, 1280, 0.78);
      setPendingDataUrl(compressedDataUrl);

      if (repairs.length > 0 && !selectedRepairId) {
        setSelectedRepairId(repairs[0].id);
      }
    } catch (err) {
      console.error('Error handling photo capture', err);
      alert('Unable to process photo. Please try again.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleSavePendingPhoto = () => {
    if (!pendingDataUrl) return;

    const newPhoto: WorkPhoto = {
      id: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      dataUrl: pendingDataUrl,
      category: selectedCategory,
      caption: caption.trim(),
      repairId: selectedRepairId || undefined,
      timestamp: new Date().toISOString(),
    };

    onAddPhoto(newPhoto);
    setPendingDataUrl(null);
    setCaption('');
  };

  const handleCancelPending = () => {
    setPendingDataUrl(null);
    setCaption('');
  };

  const getBadgeStyle = (cat: PhotoCategory) => {
    switch (cat) {
      case 'Damage / Hole':
      case 'Before Repair':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'After / Finished':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Mud / Patch Progress':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Texture Match':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Paint Code / Can':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800/90 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-100">Before & After Photo Proof</h3>
            <span className="text-xs text-neutral-400 font-mono-numbers">
              {photos.length} photo{photos.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-neutral-400">Snap wall holes, mud coats, texture & painted finish for your boss</p>
        </div>
      </div>

      {/* Camera and Gallery Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2.5 py-3 px-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Camera className="w-5 h-5 shrink-0" />
          <span>Snap Photo</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 py-3 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 font-medium rounded-xl text-xs sm:text-sm active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4 text-neutral-400 shrink-0" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Pending Photo Editor */}
      {pendingDataUrl && (
        <div className="p-3.5 bg-neutral-950 border border-amber-500/40 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              Tag Photo Proof
            </span>
            <span className="text-[11px] text-neutral-400">Required for boss report</span>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-black shrink-0 border border-neutral-800">
              <img src={pendingDataUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              {/* Category selector */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Photo Type
                </label>
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link to Unit Repair */}
              {repairs.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Link to Unit / Room
                  </label>
                  <select
                    value={selectedRepairId}
                    onChange={(e) => setSelectedRepairId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- General Shift Photo --</option>
                    {repairs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.unitNumber} ({r.roomArea} - {r.damageType})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
              Note for Boss
            </label>
            <input
              type="text"
              placeholder="e.g. 6-inch hole before repair, texture matched..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCaption(preset)}
                className="text-[10px] text-neutral-400 hover:text-amber-300 bg-neutral-900 hover:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-800"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={handleCancelPending}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSavePendingPhoto}
              className="px-4 py-1.5 bg-amber-500 text-neutral-950 font-bold text-xs rounded-lg hover:bg-amber-400 shadow transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Attach Photo Proof
            </button>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {photos.map((photo) => {
            const linkedRepair = repairs.find((r) => r.id === photo.repairId);
            return (
              <div
                key={photo.id}
                className="group relative bg-neutral-950 border border-neutral-800/80 rounded-xl overflow-hidden hover:border-neutral-700 transition-all flex flex-col"
              >
                <div
                  className="aspect-4/3 w-full bg-neutral-900 relative cursor-pointer overflow-hidden"
                  onClick={() => onOpenViewer(photo)}
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.caption || 'Paint drywall photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="p-1.5 rounded-full bg-neutral-900/80 text-white backdrop-blur-xs">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <span
                    className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded border backdrop-blur-xs ${getBadgeStyle(
                      photo.category
                    )}`}
                  >
                    {photo.category}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this photo?')) {
                        onDeletePhoto(photo.id);
                      }
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-2 space-y-0.5 flex-1 flex flex-col justify-between">
                  <p className="text-[11px] text-neutral-200 font-medium line-clamp-1">
                    {photo.caption || 'Photo proof'}
                  </p>
                  {linkedRepair && (
                    <p className="text-[10px] text-amber-400/90 truncate">
                      {linkedRepair.unitNumber} ({linkedRepair.damageType})
                    </p>
                  )}
                  <p className="text-[9px] text-neutral-500 font-mono-numbers">
                    {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !pendingDataUrl && (
          <div className="text-center py-6 px-4 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/40 space-y-1.5">
            <Camera className="w-6 h-6 mx-auto text-neutral-600" />
            <p className="text-xs text-neutral-400 font-medium">No photo proof attached today</p>
            <p className="text-[11px] text-neutral-500">
              Snap the hole before fixing, mud coats, texture, and after painting
            </p>
          </div>
        )
      )}
    </div>
  );
};
