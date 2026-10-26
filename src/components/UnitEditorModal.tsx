import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Wrench, MapPin, Hash, AlertCircle } from 'lucide-react';
import { UnitDetail, UnitStatus, PartItem } from '../types/worklog';

interface UnitEditorModalProps {
  unit: UnitDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: UnitDetail) => void;
}

const STATUS_OPTIONS: { value: UnitStatus; label: string; color: string }[] = [
  { value: 'Completed', label: 'Completed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'Tested & Passed', label: 'Tested & Passed', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { value: 'In Progress', label: 'In Progress', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'Parts Needed', label: 'Parts Needed', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { value: 'Diagnosed', label: 'Diagnosed', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { value: 'Requires Follow-up', label: 'Requires Follow-up', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
];

export const UnitEditorModal: React.FC<UnitEditorModalProps> = ({
  unit,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [unitNumber, setUnitNumber] = useState(unit?.unitNumber || '');
  const [equipmentType, setEquipmentType] = useState(unit?.equipmentType || '');
  const [location, setLocation] = useState(unit?.location || '');
  const [workOrderNumber, setWorkOrderNumber] = useState(unit?.workOrderNumber || '');
  const [status, setStatus] = useState<UnitStatus>(unit?.status || 'Completed');
  const [workPerformed, setWorkPerformed] = useState(unit?.workPerformed || '');
  const [technicianNotes, setTechnicianNotes] = useState(unit?.technicianNotes || '');
  const [partsUsed, setPartsUsed] = useState<PartItem[]>(unit?.partsUsed || []);

  // Quick part input fields
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newPartDesc, setNewPartDesc] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [showPartForm, setShowPartForm] = useState(false);

  const handleAddPart = () => {
    if (!newPartDesc.trim()) return;
    const newPart: PartItem = {
      id: `p-${Date.now().toString(36)}`,
      partNumber: newPartNumber.trim() || 'N/A',
      description: newPartDesc.trim(),
      quantity: Math.max(1, newPartQty),
    };
    setPartsUsed([...partsUsed, newPart]);
    setNewPartNumber('');
    setNewPartDesc('');
    setNewPartQty(1);
    setShowPartForm(false);
  };

  const handleRemovePart = (id: string) => {
    setPartsUsed(partsUsed.filter((p) => p.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      alert('Please enter a Unit Number or Identifier');
      return;
    }

    const payload: UnitDetail = {
      id: unit?.id || `unit-${Date.now().toString(36)}`,
      unitNumber: unitNumber.trim(),
      equipmentType: equipmentType.trim(),
      location: location.trim(),
      workOrderNumber: workOrderNumber.trim(),
      status,
      workPerformed: workPerformed.trim(),
      partsUsed,
      technicianNotes: technicianNotes.trim(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {unit ? 'Edit Unit Details' : 'Add Unit to Log'}
              </h2>
              <p className="text-xs text-neutral-400">Equipment, service record & parts used</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Unit # and Work Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Unit # / Tag / Room <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 402, RTU-3, Chiller A"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Work Order / Ticket #
              </label>
              <input
                type="text"
                placeholder="e.g. WO-99120"
                value={workOrderNumber}
                onChange={(e) => setWorkOrderNumber(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Equipment Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Equipment / Unit Type
              </label>
              <input
                type="text"
                placeholder="e.g. 5-Ton Heat Pump, Subpanel"
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Location / Address / Site
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="e.g. Roof Deck, Apt 4B, Bldg 2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Service Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? `${opt.color} ring-1 ring-amber-500/50 font-semibold`
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Work Performed */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Work Performed & Diagnostics
            </label>
            <textarea
              rows={3}
              placeholder="Describe repairs, adjustments, tests conducted, or maintenance performed..."
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          {/* Parts & Materials Used */}
          <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-200">Parts & Materials Used</span>
                <span className="text-[11px] text-neutral-500 ml-2">({partsUsed.length} item{partsUsed.length === 1 ? '' : 's'})</span>
              </div>
              {!showPartForm && (
                <button
                  type="button"
                  onClick={() => setShowPartForm(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 py-1 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Part
                </button>
              )}
            </div>

            {/* List of parts */}
            {partsUsed.length > 0 ? (
              <div className="space-y-1.5">
                {partsUsed.map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-semibold text-amber-400 font-mono-numbers px-1.5 py-0.5 bg-neutral-800 rounded">
                        x{part.quantity}
                      </span>
                      <span className="text-neutral-200 truncate">{part.description}</span>
                      {part.partNumber && part.partNumber !== 'N/A' && (
                        <span className="text-[10px] text-neutral-400 font-mono">[{part.partNumber}]</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(part.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              !showPartForm && (
                <p className="text-xs text-neutral-500 italic">No replacement parts logged for this unit.</p>
              )
            )}

            {/* Inline add part form */}
            {showPartForm && (
              <div className="p-3 bg-neutral-900 border border-neutral-700/80 rounded-xl space-y-2.5 mt-2 animate-in fade-in duration-100">
                <div className="text-xs font-medium text-neutral-300">Add Material / Part</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Part description (e.g. 45/5 Run Capacitor)"
                      value={newPartDesc}
                      onChange={(e) => setNewPartDesc(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Part # / SKU"
                      value={newPartNumber}
                      onChange={(e) => setNewPartNumber(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>Qty:</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={newPartQty}
                      onChange={(e) => setNewPartQty(parseInt(e.target.value) || 1)}
                      className="w-16 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-100 text-center focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPartForm(false)}
                      className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPart}
                      disabled={!newPartDesc.trim()}
                      className="px-3 py-1 bg-amber-500 text-neutral-950 font-semibold rounded-lg text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      Save Part
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Technician Internal / Follow-up Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Follow-up / Recommendation Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Needs replacement coil next quarter, tenant notified"
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              {unit ? 'Update Unit' : 'Add Unit to Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
