import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { Product, VerificationStage } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCategoryQcAngles } from '../../utils/qcAngles';

interface AdminQcSandboxStripProps {
  product: Product;
  onStageAdvanced?: (nextStage: VerificationStage) => void;
  onApproved?: () => void;
  onFailed?: (reason: string) => void;
}

const PRESET_DEFECTS = [
  {
    id: 'serial_mismatch',
    angleIndex: 5,
    label: '06 Macro Serial engraving mismatch against brand registry',
  },
  {
    id: 'tamper_video',
    angleIndex: 4,
    label: 'Tamper-seal video clip obscured during intake inspection',
  },
  {
    id: 'dial_variance',
    angleIndex: 0,
    label: '01 Primary surface & index alignment variance detected by optical ML',
  },
  {
    id: 'caseback_discrepancy',
    angleIndex: 3,
    label: '04 Caseback hallmark & provenance engraving discrepancy',
  },
];

export const AdminQcSandboxStrip: React.FC<AdminQcSandboxStripProps> = ({
  product,
  onStageAdvanced,
  onApproved,
  onFailed,
}) => {
  const { advanceProductQcStage, approveProductQc, failProductQc } = useApp();

  const [showFailPicker, setShowFailPicker] = useState(false);
  const [selectedDefectIdx, setSelectedDefectIdx] = useState(0);
  const [customReason, setCustomReason] = useState('');

  const categoryAngles = getCategoryQcAngles(product.category);
  const activePreset = PRESET_DEFECTS[selectedDefectIdx] || PRESET_DEFECTS[0];
  const [selectedAngleIdx, setSelectedAngleIdx] = useState<number>(activePreset.angleIndex);

  const isPending =
    product.verificationStatus !== 'approved' && product.verificationStatus !== 'rejected';

  if (!isPending) return null;

  const handleAdvance = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = advanceProductQcStage(product.id);
    if (next) {
      onStageAdvanced?.(next);
      if (next === 'approved') {
        onApproved?.();
      }
    }
  };

  const handlePassApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    approveProductQc(product.id);
    setShowFailPicker(false);
    onApproved?.();
  };

  const handleConfirmFail = (e: React.MouseEvent) => {
    e.stopPropagation();
    const reasonText = customReason.trim() || activePreset.label;
    const angleSlot = categoryAngles[selectedAngleIdx] || categoryAngles[5] || categoryAngles[0];
    const angleTag = `0${selectedAngleIdx + 1} · ${angleSlot?.label || 'Macro Serial'}`;
    failProductQc(product.id, reasonText, selectedAngleIdx, angleTag);
    setShowFailPicker(false);
    setCustomReason('');
    onFailed?.(reasonText);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-2xl bg-[#F3ECE0]/90 border border-[#D3C8B7] p-3 sm:p-3.5 space-y-3"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Sandbox Label Pill */}
        <div className="inline-flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#162E25] text-[#FFFBF2] text-[10px] font-mono font-bold uppercase tracking-[0.14em]">
            <SlidersHorizontal className="w-3 h-3 text-emerald-300" />
            <span>ADMIN QC SANDBOX</span>
          </span>
          <span className="text-[11px] text-[#6B5344] hidden sm:inline">
            Simulate live TMQC pipeline transitions
          </span>
        </div>

        {/* 3 Interactive Pill Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAdvance}
            className="px-3.5 py-1.5 rounded-full bg-[#162E25] hover:bg-[#1E3F33] text-[#FFFBF2] text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <span>Advance Pipeline Stage</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handlePassApprove}
            className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Demo Pass &amp; Approve QC</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFailPicker((prev) => !prev);
            }}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
              showFailPicker
                ? 'bg-[#B5613D] text-[#FFFBF2] border-[#B5613D]'
                : 'bg-[#FBF9F5] hover:bg-[#B5613D]/10 text-[#B5613D] border-[#B5613D]/55'
            }`}
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Demo Fail QC (Trigger Return)</span>
          </button>
        </div>
      </div>

      {/* Expandable Defect Reason Picker when "Demo Fail QC" is clicked */}
      <AnimatePresence>
        {showFailPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-[#D3C8B7] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#B5613D] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Select Defect Finding &amp; Failed Authentication Angle</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFailPicker(false);
                  }}
                  className="text-[11px] text-[#6B5344] hover:text-[#352013] cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Preset Defect Reason Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_DEFECTS.map((preset, idx) => {
                  const isSelected = selectedDefectIdx === idx && !customReason.trim();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDefectIdx(idx);
                        setSelectedAngleIdx(preset.angleIndex);
                        setCustomReason('');
                      }}
                      className={`text-left px-3 py-2 rounded-xl border text-[11px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#B5613D]/12 border-[#B5613D] text-[#352013] font-semibold'
                          : 'bg-[#FBF9F5] border-[#D3C8B7] text-[#4A2E1B] hover:border-[#B5613D]/60'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Angle Picker + Custom Defect Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4">
                  <select
                    value={selectedAngleIdx}
                    onChange={(e) => setSelectedAngleIdx(Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Failed Authentication Angle"
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] border border-[#D3C8B7] text-[11px] font-mono text-[#352013] focus:outline-none focus:border-[#162E25]"
                  >
                    {categoryAngles.map((slot, idx) => (
                      <option key={slot.id} value={idx}>
                        Angle 0{idx + 1}: {slot.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Or type a custom inspector defect note..."
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] border border-[#D3C8B7] text-[11px] text-[#352013] placeholder-[#8C7362] focus:outline-none focus:border-[#B5613D]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleConfirmFail}
                    className="w-full px-3.5 py-2 rounded-full bg-[#B5613D] hover:bg-[#9E5231] text-[#FFFBF2] text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confirm Fail</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

