import React, { useState } from 'react';
import {
  X,
  Clock,
  Paintbrush,
  Camera,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Smartphone,
  Download,
  Mail,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerName?: string;
  bossName?: string;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  workerName = 'Technician',
  bossName = 'Jermaine',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      stepNumber: 1,
      badge: 'Step 1 of 4 · Shift Times',
      badgeColor: 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/30',
      title: 'Clock In & Daily Hours',
      icon: Clock,
      iconColor: 'bg-[#0A84FF] text-white',
      headline: 'Simple 12-Hour Time & Lunch Break Tracking',
      description:
        'Track your daily work hours with automatic lunch deductions. All timesheets and reports export in clean 12-hour regular time (e.g. 9:00 AM – 5:00 PM).',
      highlights: [
        { label: 'Clock In / Out', desc: 'Tap the times to adjust shift start and end times' },
        { label: 'Auto Lunch Deduction', desc: 'Choose 30m, 60m, or no lunch with 1 tap' },
        { label: 'Automatic Overtime', desc: 'Calculates regular vs OT hours automatically' },
      ],
    },
    {
      stepNumber: 2,
      badge: 'Step 2 of 4 · Units Serviced',
      badgeColor: 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/30',
      title: 'Log Units & Turnover Notes',
      icon: Paintbrush,
      iconColor: 'bg-[#FF9F0A] text-black',
      headline: 'Record Every Apartment & Job Details',
      description:
        'Add units for each property serviced during your shift. Track paint colors, drywall repairs, and scope notes so your supervisor knows exactly what was completed.',
      highlights: [
        { label: 'Unit Identifier', desc: 'Enter unit number (e.g. 1324 2BR / Olympus)' },
        { label: 'Paint & Color Codes', desc: 'Record wall/trim colors (e.g. Agreeable Gray)' },
        { label: 'Copy Prior Day', desc: 'Tap "Copy From Yesterday" to clone repeat units instantly' },
      ],
    },
    {
      stepNumber: 3,
      badge: 'Step 3 of 4 · Photo Proofs',
      badgeColor: 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/30',
      title: 'Photo Proofs & Counts',
      icon: Camera,
      iconColor: 'bg-[#30D158] text-black',
      headline: 'Before & After Photo Proof for Inspections',
      description:
        'Snap damage photos before patching and painted photos after finishing. Photos are compressed for crisp inspections while keeping counts clear.',
      highlights: [
        { label: 'Photo Counts', desc: 'Live counters show Before vs After photo counts per unit' },
        { label: 'Camera or Files', desc: 'Snap live with camera or pick multiple from Camera Roll' },
        { label: 'Photo Deletion', desc: 'Tap the red trash icon on any thumbnail to delete anytime' },
      ],
    },
    {
      stepNumber: 4,
      badge: 'Step 4 of 4 · Boss Export',
      badgeColor: 'bg-[#BF5AF2]/20 text-[#BF5AF2] border-[#BF5AF2]/30',
      title: `Send to Boss (${bossName})`,
      icon: Download,
      iconColor: 'bg-[#BF5AF2] text-white',
      headline: 'Never Blocked by Email · 100% Android Friendly',
      description:
        'Generate an official PDF with Page 1 timesheet + uncropped photo proof pages, or send the complete 12-hour schedule directly in an email body.',
      highlights: [
        { label: 'Official PDF Report', desc: 'Page 1 timesheet table + dedicated unit photo pages' },
        { label: '1-Tap Email to Boss', desc: 'Timesheet and totals written directly into email body' },
        { label: 'Share Sheet', desc: 'Send straight to Messages, WhatsApp, Gmail, or Drive' },
      ],
    },
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('has_seen_fieldlog_tutorial', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#1C1C1E] border-t sm:border border-[#2C2C2E] rounded-t-[28px] sm:rounded-[24px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-250">
        {/* iOS Grab Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[#38383A]" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C2E] bg-[#1C1C1E]">
          <span className="text-[17px] font-bold text-white tracking-tight">
            How to Use Field Log
          </span>
          <button
            type="button"
            onClick={handleComplete}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-5 pt-4 pb-1">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            {steps.map((s, idx) => (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'bg-[#0A84FF]'
                    : idx < currentStep
                    ? 'bg-[#30D158]'
                    : 'bg-[#2C2C2E]'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <span
            className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${step.badgeColor} uppercase tracking-wider`}
          >
            {step.badge}
          </span>
        </div>

        {/* Step Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-md ${step.iconColor}`}
            >
              <StepIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-[20px] font-black text-white leading-tight">
                {step.title}
              </h2>
              <p className="text-[13px] text-[#8E8E93] mt-0.5 leading-snug">
                {step.headline}
              </p>
            </div>
          </div>

          <p className="text-[14px] text-slate-200 leading-relaxed bg-[#2C2C2E]/40 p-3 rounded-[12px] border border-[#3A3A3C]/50">
            {step.description}
          </p>

          {/* Feature Highlights Group */}
          <div className="bg-[#2C2C2E]/60 rounded-[14px] border border-[#3A3A3C] divide-y divide-[#3A3A3C]/60 overflow-hidden">
            {step.highlights.map((h, i) => (
              <div key={i} className="p-3 flex items-start gap-2.5 text-xs">
                <Check className="w-4 h-4 text-[#30D158] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold block text-[13px]">{h.label}</strong>
                  <span className="text-[#8E8E93] text-[12px] leading-tight block mt-0.5">{h.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-[#2C2C2E] bg-[#1C1C1E] flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-[12px] bg-[#2C2C2E] text-white hover:bg-[#38383A] text-[14px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="px-3 py-2 text-[#8E8E93] hover:text-white text-[13px] font-medium transition-colors"
            >
              Skip
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2.5 bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white text-[15px] font-bold rounded-[12px] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>{currentStep === steps.length - 1 ? 'Got It! Start Working' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
