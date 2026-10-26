import React, { useState } from 'react';
import { Search, Filter, Wrench, MapPin, Hash, Calendar, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react';
import { DailyWorkLog, UnitDetail, UnitStatus, WorkPhoto } from '../types/worklog';

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
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Collect all unit instances across logs
  const allUnitEntries: { unit: UnitDetail; date: string; logPhotos: WorkPhoto[] }[] = [];
  logs.forEach((log) => {
    log.units.forEach((u) => {
      const relatedPhotos = log.photos.filter((p) => p.unitId === u.id);
      allUnitEntries.push({
        unit: u,
        date: log.date,
        logPhotos: relatedPhotos,
      });
    });
  });

  const filteredEntries = allUnitEntries.filter((item) => {
    const matchesSearch =
      item.unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.equipmentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.workPerformed.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.unit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            placeholder="Search units by number, equipment, WO #, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-neutral-400 mr-1 shrink-0">Filter:</span>
          {['All', 'Completed', 'Tested & Passed', 'In Progress', 'Parts Needed', 'Diagnosed'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-lg border shrink-0 text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500 shadow-sm'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-3">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, idx) => (
            <div
              key={`${entry.unit.id}-${idx}`}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{entry.unit.unitNumber}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(entry.unit.status)}`}>
                      {entry.unit.status}
                    </span>
                  </div>
                  {entry.unit.equipmentType && (
                    <p className="text-xs text-neutral-400 mt-0.5">{entry.unit.equipmentType}</p>
                  )}
                </div>

                <button
                  onClick={() => onSelectDate(entry.date)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg text-xs font-medium border border-neutral-700/80 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{entry.date}</span>
                </button>
              </div>

              {/* Location & Ticket */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                {entry.unit.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{entry.unit.location}</span>
                  </span>
                )}
                {entry.unit.workOrderNumber && (
                  <span className="flex items-center gap-1 font-mono text-neutral-300">
                    <Hash className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{entry.unit.workOrderNumber}</span>
                  </span>
                )}
              </div>

              {/* Work Description */}
              {entry.unit.workPerformed && (
                <p className="text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 leading-relaxed">
                  {entry.unit.workPerformed}
                </p>
              )}

              {/* Parts Used */}
              {entry.unit.partsUsed.length > 0 && (
                <div className="text-xs text-neutral-400">
                  <span className="font-semibold text-neutral-300">Parts Used: </span>
                  {entry.unit.partsUsed.map((p) => `${p.quantity}x ${p.description}`).join(', ')}
                </div>
              )}

              {/* Associated Photos Preview */}
              {entry.logPhotos.length > 0 && (
                <div className="pt-1 border-t border-neutral-800/80">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs font-semibold text-neutral-300">
                      Unit Photos ({entry.logPhotos.length})
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {entry.logPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => onOpenPhotoViewer(photo)}
                        className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-black cursor-pointer hover:border-amber-500 transition-colors relative"
                      >
                        <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-neutral-300 font-bold truncate px-0.5">
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
            <Wrench className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm font-semibold text-neutral-300">No matching units found</p>
            <p className="text-xs text-neutral-500">Try adjusting your search query or status filter</p>
          </div>
        )}
      </div>
    </div>
  );
};
