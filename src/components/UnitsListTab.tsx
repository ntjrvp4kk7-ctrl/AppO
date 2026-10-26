import React, { useState } from 'react';
import { Search, Home, Paintbrush, Calendar, Image as ImageIcon } from 'lucide-react';
import { DailyWorkLog, UnitRepair, RepairStage, WorkPhoto } from '../types/worklog';

interface UnitsListTabProps {
  logs: DailyWorkLog[];
  onSelectDate: (dateStr: string) => void;
  onOpenPhotoViewer: (photo: WorkPhoto) => void;
}

export const UnitsListTab: React.FC<UnitsListTabProps> = ({
  logs,
  onSelectDate,
  onOpenPhotoViewer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');

  // Collect all unit repairs across logs
  const allEntries: { repair: UnitRepair; date: string; logPhotos: WorkPhoto[] }[] = [];
  logs.forEach((log) => {
    log.repairs.forEach((r) => {
      const relatedPhotos = log.photos.filter((p) => p.repairId === r.id);
      allEntries.push({
        repair: r,
        date: log.date,
        logPhotos: relatedPhotos,
      });
    });
  });

  const filteredEntries = allEntries.filter((item) => {
    const matchesSearch =
      item.repair.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.repair.roomArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.repair.damageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.repair.paintColor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.repair.textureType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.repair.workDescription.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === 'All' || item.repair.repairStage === stageFilter;

    return matchesSearch && matchesStage;
  });

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

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by unit #, room, damage type, paint color (e.g. SW Agreeable Gray)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-neutral-400 mr-1 shrink-0">Stage:</span>
          {['All', 'Painted & Completed', 'Primed', 'Texture Matched', 'Mudded & Sanded', 'Patched & Taped'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStageFilter(st)}
              className={`px-2.5 py-1 rounded-lg border shrink-0 text-xs font-medium transition-all ${
                stageFilter === st
                  ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500 shadow-sm'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Repairs List */}
      <div className="space-y-3">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, idx) => (
            <div
              key={`${entry.repair.id}-${idx}`}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-amber-400" />
                      {entry.repair.unitNumber}
                    </h3>
                    <span className="text-xs text-neutral-400 font-medium">
                      • {entry.repair.roomArea}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStageBadge(entry.repair.repairStage)}`}>
                      {entry.repair.repairStage}
                    </span>
                  </div>

                  <div className="text-xs text-amber-400/90 font-medium mt-1">
                    {entry.repair.damageType} {entry.repair.damageSize ? `(${entry.repair.damageSize})` : ''}
                  </div>
                </div>

                <button
                  onClick={() => onSelectDate(entry.date)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg text-xs font-medium border border-neutral-700/80 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{entry.date}</span>
                </button>
              </div>

              {/* Paint & Texture details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-neutral-950 p-2.5 rounded-xl border border-neutral-850">
                <div>
                  <span className="text-neutral-500 block">Paint Color:</span>
                  <span className="font-semibold text-neutral-200">{entry.repair.paintColor}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Sheen & Texture:</span>
                  <span className="text-neutral-300">{entry.repair.paintSheen} • {entry.repair.textureType}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-neutral-500 block">Mud / Primer:</span>
                  <span className="text-neutral-300 truncate block">
                    {entry.repair.compoundUsed || 'Joint compound'}
                  </span>
                </div>
              </div>

              {/* Work description */}
              {entry.repair.workDescription && (
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {entry.repair.workDescription}
                </p>
              )}

              {/* Photos Gallery */}
              {entry.logPhotos.length > 0 && (
                <div className="pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs font-semibold text-neutral-300">
                      Before & After Proof ({entry.logPhotos.length})
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {entry.logPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => onOpenPhotoViewer(photo)}
                        className="w-24 h-20 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-black cursor-pointer hover:border-amber-500 transition-colors relative"
                      >
                        <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                        <span
                          className={`absolute bottom-0 inset-x-0 text-[8px] text-center font-bold truncate px-1 py-0.5 text-white ${
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
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-400 space-y-2">
            <Paintbrush className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm font-semibold text-neutral-300">No matching repairs found</p>
            <p className="text-xs text-neutral-500">Try adjusting your search query or stage filter</p>
          </div>
        )}
      </div>
    </div>
  );
};
