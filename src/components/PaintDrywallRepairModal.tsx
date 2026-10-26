import React, { useState } from 'react';
import { X, Check, Paintbrush, Home, Sparkles, Hash, Layers } from 'lucide-react';
import { UnitRepair, DamageType, RepairStage, TextureType } from '../types/worklog';

interface PaintDrywallRepairModalProps {
  repair: UnitRepair | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (repair: UnitRepair) => void;
}

const DAMAGE_TYPES: DamageType[] = [
  'Doorknob / Fist Hole',
  'Water Damage / Ceiling Leak',
  'Drywall Stress Crack',
  'Corner Bead Dent / Pop',
  'Nail Pops / Anchor Holes',
  'Peeling Paint / Scrape',
  'Large Sheetrock Replacement',
  'Other Wall/Ceiling Damage',
];

const REPAIR_STAGES: { value: RepairStage; label: string; color: string }[] = [
  { value: 'Painted & Completed', label: 'Painted & Completed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'Primed', label: 'Primed (Stain Block)', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { value: 'Texture Matched', label: 'Texture Matched', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { value: 'Mudded & Sanded', label: 'Mudded & Sanded', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'Patched & Taped', label: 'Patched & Taped', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { value: 'Damage Documented', label: 'Damage Documented', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
];

const TEXTURE_TYPES: TextureType[] = [
  'Orange Peel (Medium)',
  'Orange Peel (Light)',
  'Knockdown',
  'Smooth / Flat',
  'Popcorn Ceiling',
  'Custom / Skip Trowel',
];

const SHEEN_OPTIONS: UnitRepair['paintSheen'][] = [
  'Eggshell',
  'Flat / Matte',
  'Satin',
  'Semi-Gloss',
];

export const PaintDrywallRepairModal: React.FC<PaintDrywallRepairModalProps> = ({
  repair,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [unitNumber, setUnitNumber] = useState(repair?.unitNumber || '');
  const [roomArea, setRoomArea] = useState(repair?.roomArea || '');
  const [damageType, setDamageType] = useState<DamageType>(repair?.damageType || 'Doorknob / Fist Hole');
  const [damageSize, setDamageSize] = useState(repair?.damageSize || '');
  const [repairStage, setRepairStage] = useState<RepairStage>(repair?.repairStage || 'Painted & Completed');
  const [paintColor, setPaintColor] = useState(repair?.paintColor || 'SW 7029 Agreeable Gray');
  const [paintSheen, setPaintSheen] = useState<UnitRepair['paintSheen']>(repair?.paintSheen || 'Eggshell');
  const [primerUsed, setPrimerUsed] = useState(repair?.primerUsed || 'Kilz 2 Latex Primer');
  const [compoundUsed, setCompoundUsed] = useState(repair?.compoundUsed || 'Easy Sand 20 + Plus 3');
  const [textureType, setTextureType] = useState<TextureType>(repair?.textureType || 'Orange Peel (Medium)');
  const [workDescription, setWorkDescription] = useState(repair?.workDescription || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      alert('Please enter a Unit or Apartment # (e.g. Unit 304)');
      return;
    }

    const payload: UnitRepair = {
      id: repair?.id || `repair-${Date.now().toString(36)}`,
      unitNumber: unitNumber.trim(),
      roomArea: roomArea.trim() || 'Main Room',
      damageType,
      damageSize: damageSize.trim(),
      repairStage,
      paintColor: paintColor.trim() || 'Standard White',
      paintSheen,
      primerUsed: primerUsed.trim(),
      compoundUsed: compoundUsed.trim(),
      textureType,
      workDescription: workDescription.trim(),
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
              <Paintbrush className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {repair ? 'Edit Paint & Drywall Repair' : 'Add Unit Paint & Drywall Repair'}
              </h2>
              <p className="text-xs text-neutral-400">Record wall/ceiling damage, texture & paint details</p>
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
          {/* Unit # and Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Unit / Apt # <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Home className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 304, Apt 12B"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Room / Wall Location <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Living Room behind door, Master Bath Ceiling"
                value={roomArea}
                onChange={(e) => setRoomArea(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Damage Type & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Damage Type
              </label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value as DamageType)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
              >
                {DAMAGE_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Damage Size / Dimensions
              </label>
              <input
                type="text"
                placeholder="e.g. 6-inch hole, 2x3 ft ceiling cutout"
                value={damageSize}
                onChange={(e) => setDamageSize(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Current Repair Stage */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Repair Stage (Progress)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REPAIR_STAGES.map((st) => {
                const isSelected = repairStage === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setRepairStage(st.value)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? `${st.color} ring-1 ring-amber-500/50 font-semibold`
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                    }`}
                  >
                    <span className="truncate">{st.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Texture & Compound Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Texture Match Style
              </label>
              <select
                value={textureType}
                onChange={(e) => setTextureType(e.target.value as TextureType)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
              >
                {TEXTURE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Mud / Compound Used
              </label>
              <input
                type="text"
                placeholder="e.g. Easy Sand 20, Plus 3"
                value={compoundUsed}
                onChange={(e) => setCompoundUsed(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Paint Color, Sheen & Primer */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3.5 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Paint & Primer Specifications
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Paint Brand / Color Name & Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SW 7029 Agreeable Gray, Behr Swiss Coffee"
                  value={paintColor}
                  onChange={(e) => setPaintColor(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Paint Sheen
                </label>
                <select
                  value={paintSheen}
                  onChange={(e) => setPaintSheen(e.target.value as UnitRepair['paintSheen'])}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                >
                  {SHEEN_OPTIONS.map((sh) => (
                    <option key={sh} value={sh}>
                      {sh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Primer / Stain Blocker (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kilz 2 Latex, Zinsser 1-2-3, PVA Drywall Primer"
                value={primerUsed}
                onChange={(e) => setPrimerUsed(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Work description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Work Performed (for Boss)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Installed backing clip, fitted 1/2in sheetrock plug, mesh taped, 2 coats hot mud, orange peel texture matched, 2 coats SW Agreeable Gray."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
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
              {repair ? 'Update Repair' : 'Save Unit Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
