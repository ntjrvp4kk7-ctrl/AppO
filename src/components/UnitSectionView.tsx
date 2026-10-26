import React from 'react';
import { Wrench, Plus, Edit2, Trash2, MapPin, Hash, PackageCheck, Image as ImageIcon } from 'lucide-react';
import { UnitDetail, WorkPhoto, UnitStatus } from '../types/worklog';

interface UnitSectionViewProps {
  units: UnitDetail[];
  photos: WorkPhoto[];
  onAddUnitClick: () => void;
  onEditUnitClick: (unit: UnitDetail) => void;
  onDeleteUnit: (unitId: string) => void;
}

const getStatusBadge = (status: UnitStatus) => {
  switch (status) {
    case 'Completed':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'Tested & Passed':
      return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    case 'In Progress':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'Parts Needed':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'Diagnosed':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    default:
      return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  }
};

export const UnitSectionView: React.FC<UnitSectionViewProps> = ({
  units,
  photos,
  onAddUnitClick,
  onEditUnitClick,
  onDeleteUnit,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800/90 rounded-2xl p-4 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-100">Unit Details & Equipment</h3>
            <span className="text-xs text-neutral-400 font-mono-numbers">
              {units.length} unit{units.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-neutral-400">Log equipment units, diagnostics, parts & status</p>
        </div>

        <button
          type="button"
          onClick={onAddUnitClick}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs active:scale-95 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Unit</span>
        </button>
      </div>

      {/* Units List */}
      {units.length > 0 ? (
        <div className="space-y-3">
          {units.map((unit) => {
            const unitPhotos = photos.filter((p) => p.unitId === unit.id);
            const totalParts = unit.partsUsed.reduce((sum, p) => sum + p.quantity, 0);

            return (
              <div
                key={unit.id}
                className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-neutral-700/80 transition-colors"
              >
                {/* Title & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{unit.unitNumber}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getStatusBadge(
                          unit.status
                        )}`}
                      >
                        {unit.status}
                      </span>
                    </div>
                    {unit.equipmentType && (
                      <p className="text-xs text-neutral-400 mt-0.5">{unit.equipmentType}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditUnitClick(unit)}
                      title="Edit unit"
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove ${unit.unitNumber} from today's log?`)) {
                          onDeleteUnit(unit.id);
                        }
                      }}
                      title="Delete unit"
                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Location and Work Order */}
                {(unit.location || unit.workOrderNumber) && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                    {unit.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{unit.location}</span>
                      </span>
                    )}
                    {unit.workOrderNumber && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-300">
                        <Hash className="w-3 h-3 text-neutral-500 shrink-0" />
                        {unit.workOrderNumber}
                      </span>
                    )}
                  </div>
                )}

                {/* Work Performed snippet */}
                {unit.workPerformed ? (
                  <p className="text-xs text-neutral-300 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/60 leading-relaxed">
                    {unit.workPerformed}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 italic">No labor notes recorded yet.</p>
                )}

                {/* Footer metadata: parts & photos count */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-xs">
                  <div className="flex items-center gap-3 text-neutral-400">
                    {unit.partsUsed.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>{totalParts} part{totalParts === 1 ? '' : 's'} used</span>
                      </span>
                    )}
                    {unitPhotos.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-sky-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{unitPhotos.length} photo{unitPhotos.length === 1 ? '' : 's'}</span>
                      </span>
                    )}
                  </div>

                  {unit.technicianNotes && (
                    <span className="text-[11px] text-amber-400/80 truncate max-w-[160px] italic">
                      Note: {unit.technicianNotes}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 px-4 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/40 space-y-1.5">
          <Wrench className="w-6 h-6 mx-auto text-neutral-600" />
          <p className="text-xs text-neutral-400 font-medium">No units added to this shift yet</p>
          <p className="text-[11px] text-neutral-500">
            Track equipment numbers, work orders, tasks performed, and parts installed
          </p>
          <button
            type="button"
            onClick={onAddUnitClick}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Unit
          </button>
        </div>
      )}
    </div>
  );
};
