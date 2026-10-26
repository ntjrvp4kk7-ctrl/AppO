import React from 'react';
import { Plus, Edit2, Trash2, Camera, Paintbrush, Home, CheckCircle2 } from 'lucide-react';
import { UnitRepair, WorkPhoto, RepairStage } from '../types/worklog';

interface PaintDrywallSectionViewProps {
  repairs: UnitRepair[];
  photos: WorkPhoto[];
  onAddRepairClick: () => void;
  onEditRepairClick: (repair: UnitRepair) => void;
  onDeleteRepair: (repairId: string) => void;
  onQuickSnapForRepair: (repairId: string) => void;
  onOpenPhotoViewer: (photo: WorkPhoto) => void;
}

const getStageBadge = (stage: RepairStage) => {
  switch (stage) {
    case 'Painted & Completed':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'Primed':
      return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    case 'Texture Matched':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    case 'Mudded & Sanded':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'Patched & Taped':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    default:
      return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  }
};

export const PaintDrywallSectionView: React.FC<PaintDrywallSectionViewProps> = ({
  repairs,
  photos,
  onAddRepairClick,
  onEditRepairClick,
  onDeleteRepair,
  onQuickSnapForRepair,
  onOpenPhotoViewer,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800/90 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-100">Paint & Drywall Units</h3>
            <span className="text-xs text-neutral-400 font-mono-numbers">
              {repairs.length} repair{repairs.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-neutral-400">Damages repaired, mud coats, texture & paint</p>
        </div>

        <button
          type="button"
          onClick={onAddRepairClick}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs active:scale-95 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Unit Repair</span>
        </button>
      </div>

      {/* Repairs List */}
      {repairs.length > 0 ? (
        <div className="space-y-4">
          {repairs.map((repair) => {
            const repairPhotos = photos.filter((p) => p.repairId === repair.id);
            const beforePhoto = repairPhotos.find(
              (p) => p.category === 'Damage / Hole' || p.category === 'Before Repair'
            );
            const afterPhoto = repairPhotos.find((p) => p.category === 'After / Finished');

            return (
              <div
                key={repair.id}
                className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-3 hover:border-neutral-700/80 transition-colors"
              >
                {/* Title and actions */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-amber-400" />
                        {repair.unitNumber}
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">
                        • {repair.roomArea}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getStageBadge(
                          repair.repairStage
                        )}`}
                      >
                        {repair.repairStage}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-amber-400/90 font-medium">
                      <span>{repair.damageType}</span>
                      {repair.damageSize && (
                        <span className="text-neutral-400">({repair.damageSize})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onQuickSnapForRepair(repair.id)}
                      title="Snap photo for this unit"
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditRepairClick(repair)}
                      title="Edit repair"
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete ${repair.unitNumber} (${repair.damageType})?`)) {
                          onDeleteRepair(repair.id);
                        }
                      }}
                      title="Delete repair"
                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Paint & Texture Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/60">
                  <div>
                    <span className="text-neutral-500 block">Paint Color & Sheen:</span>
                    <span className="font-semibold text-neutral-200">
                      {repair.paintColor} ({repair.paintSheen})
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Texture Match:</span>
                    <span className="font-medium text-neutral-300">{repair.textureType}</span>
                  </div>
                  {repair.primerUsed && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-neutral-500 block">Primer / Mud:</span>
                      <span className="font-medium text-neutral-300 truncate block">
                        {repair.primerUsed}
                      </span>
                    </div>
                  )}
                </div>

                {/* Work Performed notes */}
                {repair.workDescription && (
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {repair.workDescription}
                  </p>
                )}

                {/* Boss Before & After Photo Comparison Row */}
                <div className="pt-2 border-t border-neutral-900 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-neutral-400">
                      Unit Evidence Photos ({repairPhotos.length})
                    </span>
                    {beforePhoto && afterPhoto && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Before & After Paired
                      </span>
                    )}
                  </div>

                  {repairPhotos.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {repairPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => onOpenPhotoViewer(photo)}
                          className="w-24 sm:w-28 h-20 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-black cursor-pointer hover:border-amber-500 transition-colors relative group"
                        >
                          <img
                            src={photo.dataUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                          />
                          <span
                            className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.5 truncate px-1 text-white ${
                              photo.category === 'After / Finished'
                                ? 'bg-emerald-600/90'
                                : photo.category === 'Damage / Hole' || photo.category === 'Before Repair'
                                ? 'bg-rose-600/90'
                                : 'bg-neutral-900/90'
                            }`}
                          >
                            {photo.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => onQuickSnapForRepair(repair.id)}
                      className="border border-dashed border-neutral-800 hover:border-amber-500/50 rounded-lg p-2.5 text-center cursor-pointer transition-colors"
                    >
                      <Camera className="w-4 h-4 mx-auto text-neutral-500 mb-1" />
                      <span className="text-xs text-neutral-400">
                        Tap to snap Damage / Before or After photo for {repair.unitNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 px-4 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/40 space-y-1.5">
          <Paintbrush className="w-7 h-7 mx-auto text-neutral-600" />
          <p className="text-xs text-neutral-300 font-medium">No units or repairs logged today yet</p>
          <p className="text-[11px] text-neutral-500">
            Log apartment unit #, wall/ceiling damage, texture style & paint color
          </p>
          <button
            type="button"
            onClick={onAddRepairClick}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Repair
          </button>
        </div>
      )}
    </div>
  );
};
