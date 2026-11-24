import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Archive, 
  RefreshCw, 
  Camera,
  Video,
  FileVideo
} from 'lucide-react';
import { Product, VerificationStage } from '../../types';
import { useApp } from '../../context/AppContext';
import { AdminQcSandboxStrip } from '../verification/AdminQcSandboxStrip';
import {
  getCategoryQcAngles,
  getAngleDescription,
  getProductAngleImage,
  getCategoryFallbackImage
} from '../../utils/qcAngles';
import { getProductImage, handleImageError } from '../../utils/productImages';
import { normalizeProduct } from '../../utils/supabaseNormalizer';
import { modalDialogVariants } from '../common/MotionPrimitives';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onQcStageAdvanced?: (stage: VerificationStage) => void;
  onQcApproved?: () => void;
  onQcFailed?: (reason: string) => void;
}

const MODAL_QC_STAGES = [
  { step: 1, label: 'Submitted', shortDesc: 'Docket Transmitted' },
  { step: 2, label: 'AI Optical Check', shortDesc: 'Macro Engraving ML' },
  { step: 3, label: 'Admin Specialist Review', shortDesc: 'TMQC Inspector Review' },
  { step: 4, label: 'Verified', shortDesc: 'Escrow Active' },
];

const getModalStageProgress = (status: VerificationStage) => {
  switch (status) {
    case 'approved':
      return 4;
    case 'human_review':
    case 'additional_evidence':
    case 'rejected':
      return 3;
    case 'ai_review':
      return 2;
    case 'submitted':
    default:
      return 1;
  }
};

const luxuryEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product: initialProduct,
  onClose,
  onQcStageAdvanced,
  onQcApproved,
  onQcFailed,
}) => {
  const { products, setActiveSection, archiveProduct, restoreProduct } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const [activeAngleIndex, setActiveAngleIndex] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setActiveAngleIndex(0);
  }, [initialProduct?.id]);

  if (!initialProduct) return null;

  // Always read live product from AppContext so sandbox stage changes update immediately in-place
  const rawProduct = products.find((p) => p.id === initialProduct.id) || initialProduct;
  const product = normalizeProduct(rawProduct);

  const categoryAngles = getCategoryQcAngles(product.category);
  const angleOptions = categoryAngles.map((slot, idx) => ({
    id: slot.id,
    label: `0${idx + 1} · ${slot.label}`,
    image: getProductAngleImage(product, slot.id, idx),
    angleTag: `0${idx + 1} · ${slot.label.toUpperCase()}`,
    desc: getAngleDescription(product.category, slot.id)
  }));

  const currentDisplayImage =
    angleOptions[activeAngleIndex]?.image ||
    getProductImage(product);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const netSettlement = product.price * 0.95;

  const getVerificationStatusPill = (status: VerificationStage) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>QC Verified</span>
          </span>
        );
      case 'rejected':
      case 'additional_evidence':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span>{status === 'rejected' ? 'QC FAILED' : 'EVIDENCE REQUIRED'}</span>
          </span>
        );
      case 'ai_review':
      case 'human_review':
      case 'submitted':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#162E25]/10 text-[#162E25] border border-[#162E25]/25">
            <Clock className="w-3.5 h-3.5 text-[#162E25]" />
            <span>PHYSICAL AUDIT QUEUE</span>
          </span>
        );
    }
  };

  const handleInspectInQueue = () => {
    onClose();
    setActiveSection('verification');
  };

  const handleToggleArchive = () => {
    if (product.status === 'active') {
      archiveProduct(product.id);
    } else {
      restoreProduct(product.id);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: luxuryEase }}
          onClick={onClose}
          className="fixed inset-0 bg-[#352013]/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          variants={modalDialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-3xl max-h-[92vh] bg-[#F3ECE0] border border-[#D3C8B7] rounded-[1.75rem] shadow-2xl overflow-hidden flex flex-col z-10 my-auto text-[#352013]"
        >
          {/* 1. Top Header Bar */}
          <div className="bg-[#FBF9F5] border-b border-[#D3C8B7] px-5 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-xs font-bold text-[#B5613D] tracking-wider truncate">
                LOT {product.sku}
              </span>
              <span className="text-[#D3C8B7]">&bull;</span>
              <span className="bg-[#EFE5D3] text-[#352013] border border-[#D3C8B7] text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {product.category}
              </span>
              {product.status === 'archived' && (
                <span className="bg-[#EFE5D3] text-[#B5613D] border border-[#D3C8B7] text-[10px] font-mono px-2.5 py-0.5 rounded-full">
                  Archived
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#6B5344] hover:text-[#352013] hover:bg-[#EFE5D3] transition-colors cursor-pointer"
              title="Close Lot Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            
            {/* 2. Multi-Angle Visual Proof Gallery */}
            <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B5344] font-semibold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#B5613D]" />
                  <span>AUTHENTICATION PROOF GALLERY</span>
                </span>
                <span className="text-[10px] font-mono text-[#7A6252]">
                  {angleOptions[activeAngleIndex]?.angleTag}
                </span>
              </div>

              {/* Primary 16:9 Stage */}
              <div className="aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#EFE5D3] border border-[#D3C8B7] relative group">
                <img
                  src={currentDisplayImage}
                  alt={product.name}
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#352013]/45 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  {product.verificationStatus === 'approved' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>QC Verified</span>
                    </span>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-[#352013]/85 backdrop-blur-xs border border-[#6B5344] flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[#F3ECE0]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#A9B89C]" />
                      <span>TMQC DIGITAL LOT PASSPORT</span>
                    </div>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FBF9F5]/95 backdrop-blur-xs text-[#352013] border border-[#D3C8B7] shadow-2xs">
                    ANGLE 0{activeAngleIndex + 1} / 06
                  </span>
                </div>
              </div>

              {/* Active Angle Description */}
              <div className="px-1 text-[11px] text-[#6B5344] flex items-center justify-between">
                <span>{angleOptions[activeAngleIndex]?.desc}</span>
                <span className="text-[10px] font-mono text-[#384D35] font-semibold uppercase tracking-wider">
                  Macro Verified
                </span>
              </div>

              {/* 6 Interactive Category-Specific Angle Switcher Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {angleOptions.map((opt, idx) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveAngleIndex(idx)}
                    title={opt.label}
                    className={`px-3 py-2 rounded-xl text-xs font-mono text-left transition-all cursor-pointer border ${
                      activeAngleIndex === idx
                        ? 'bg-[#384D35] text-[#FFFBF2] border-[#384D35] shadow-xs font-semibold'
                        : 'bg-[#F3ECE0]/60 hover:bg-[#EFE5D3] text-[#4A2E1B] border-[#D3C8B7]'
                    }`}
                  >
                    <span className="truncate block">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Title, Editorial Description & TMQC Status */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B5613D] font-bold">
                    CURATED CATALOG PIECE
                  </span>
                  <h2 className="text-[1.75rem] leading-[1.2] font-display font-medium text-[#352013] tracking-tight leading-snug">
                    {product.name}
                  </h2>
                </div>
                <div className="shrink-0 pt-1">
                  {getVerificationStatusPill(product.verificationStatus)}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#4A2E1B] leading-relaxed bg-[#FBF9F5] border border-[#D3C8B7] p-4 rounded-2xl shadow-2xs">
                {product.description || 'Fine horology and artisanal luxury piece submitted for verified provenance escrow.'}
              </p>

              {/* 4-Stage Admin Verification Pipeline + Interactive ADMIN QC SANDBOX inside Modal */}
              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#6B5344]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#162E25]" />
                    <span>ADMIN VERIFICATION PIPELINE</span>
                  </span>
                  <span
                    className={`font-bold ${
                      product.verificationStatus === 'rejected' ? 'text-[#B5613D]' : 'text-[#162E25]'
                    }`}
                  >
                    {product.verificationStatus === 'rejected'
                      ? 'Halted at Stage 03 · Return Active'
                      : `Stage 0${getModalStageProgress(product.verificationStatus)} / 04`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODAL_QC_STAGES.map((stg) => {
                    const currentProgress = getModalStageProgress(product.verificationStatus);
                    const isRejected = product.verificationStatus === 'rejected';
                    const isComplete =
                      stg.step < currentProgress ||
                      (stg.step === 4 && product.verificationStatus === 'approved');
                    const isCurrent =
                      stg.step === currentProgress &&
                      product.verificationStatus !== 'approved' &&
                      !isRejected;
                    const isStageRejected =
                      stg.step === 3 &&
                      (product.verificationStatus === 'rejected' ||
                        product.verificationStatus === 'additional_evidence');

                    return (
                      <div
                        key={stg.step}
                        className={`p-2.5 rounded-xl border text-xs transition-colors ${
                          isStageRejected
                            ? 'bg-[#B5613D]/10 border-[#B5613D] text-[#352013]'
                            : isComplete
                            ? 'bg-emerald-50/75 border-emerald-300/80 text-[#162E25]'
                            : isCurrent
                            ? 'bg-[#F3ECE0] border-[#162E25] text-[#162E25]'
                            : 'bg-[#F3ECE0]/45 border-[#D3C8B7] text-[#8C7362]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono text-[10px] font-bold">0{stg.step}</span>
                          {isComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          ) : isStageRejected ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#B5613D]" />
                          ) : isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-[#162E25] animate-pulse" />
                          ) : null}
                        </div>
                        <div className="font-semibold text-[11px] truncate">{stg.label}</div>
                        <div className="text-[9px] text-[#6B5344] truncate mt-0.5">
                          {isStageRejected ? 'QC Failed · Flagged' : stg.shortDesc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ADMIN QC SANDBOX Controls inside Modal */}
                <AdminQcSandboxStrip
                  product={product}
                  onStageAdvanced={onQcStageAdvanced}
                  onApproved={onQcApproved}
                  onFailed={onQcFailed}
                />
              </div>

              {/* QC Specialist Notes if required */}
              {product.reviewerNotes && (
                <div className="p-3.5 rounded-2xl bg-[#EFE5D3] border border-[#D3C8B7] text-xs text-[#352013] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-[#B5613D]">
                    <AlertTriangle className="w-4 h-4 text-[#B5613D] shrink-0" />
                    <span>Appraisal Specialist Observations:</span>
                  </div>
                  <p className="text-[#4A2E1B] leading-relaxed pl-5">
                    {product.reviewerNotes}
                  </p>
                </div>
              )}

              {/* Authenticated Specifications Grid */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 space-y-2.5 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B5344] font-semibold block">
                    AUTHENTICATED ATTRIBUTES &amp; PROVENANCE
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {Object.entries(product.specs).map(([key, val]) => val && (
                      <div key={key} className="space-y-0.5 bg-[#F3ECE0]/60 p-2.5 rounded-xl border border-[#E3D8C4]">
                        <span className="text-[10px] font-mono uppercase text-[#7A6252] block capitalize truncate">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="font-medium text-[#352013] truncate block">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3B. Tamper-Seal & Packing Archive Video Section */}
            <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3D8C4] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#A9B89C]/35 border border-[#96A685] flex items-center justify-center text-[#384D35]">
                    <FileVideo className="w-4 h-4 text-[#384D35]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B5344] font-semibold block">
                      TAMPER-SEAL &amp; PACKING ARCHIVE
                    </span>
                    <h3 className="text-xs font-semibold text-[#352013]">
                      Pre-Dispatch Video Audit Evidence
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {product.packingVideo ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#A9B89C]/35 text-[#384D35] border border-[#96A685]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#384D35]" />
                      <span>Transmitted to Admin TMQC • Awaiting Verification</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#EFE5D3] text-[#B5613D] border border-[#D3C8B7]">
                      <Clock className="w-3.5 h-3.5 text-[#B5613D]" />
                      <span>Packing Video Pending Capture</span>
                    </span>
                  )}
                </div>
              </div>

              {product.packingVideo ? (
                <div className="space-y-2.5">
                  <div className="relative rounded-xl overflow-hidden bg-[#352013] max-h-56">
                    <video
                      controls
                      src={product.packingVideo.videoUrl}
                      className="w-full h-48 object-contain bg-[#352013]"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#6B5344] pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#352013]">{product.packingVideo.fileName}</span>
                      <span>&bull;</span>
                      <span>Recorded {new Date(product.packingVideo.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[#384D35] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Immutable QC Video Evidence
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#F3ECE0]/60 border border-[#E3D8C4] text-xs text-[#6B5344] flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-[#B5613D] shrink-0" />
                  <span>No tamper-seal video recording on record for this historical SKU. Future dispatches require an unedited packaging recording.</span>
                </div>
              )}
            </div>

            {/* 4. Commercial & Inventory Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Card 1: Listing Price */}
              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 space-y-1 shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-[#6B5344] font-semibold block">
                  Listing Price
                </span>
                <div className="font-serif text-2xl font-bold text-[#352013] tabular-nums">
                  ₹{product.price.toLocaleString()}
                </div>
                <span className="text-[11px] text-[#384D35] font-mono flex items-center gap-1 pt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Escrow Protected</span>
                </span>
              </div>

              {/* Card 2: Available Stock */}
              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 space-y-1 shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-[#6B5344] font-semibold block">
                  Available Stock
                </span>
                <div className="font-mono text-2xl font-bold text-[#352013] tabular-nums">
                  {product.stock} <span className="text-xs font-normal text-[#6B5344]">units</span>
                </div>
                <div className="pt-0.5">
                  {isOutOfStock ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#EFE5D3] text-[#B5613D] border border-[#D3C8B7]">
                      Low Stock Warning (&le; {product.lowStockThreshold})
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#A9B89C]/35 text-[#384D35] border border-[#96A685]">
                      Normal Reserve
                    </span>
                  )}
                </div>
              </div>

              {/* Card 3: Net Settlement */}
              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-4 space-y-1 shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-[#6B5344] font-semibold block">
                  Net Settlement (95%)
                </span>
                <div className="font-mono text-2xl font-bold text-[#384D35] tabular-nums">
                  ₹{Math.round(netSettlement).toLocaleString()}
                </div>
                <span className="text-[10px] font-mono text-[#7A6252] block pt-0.5">
                  After 5.0% Atelier Escrow Fee
                </span>
              </div>
            </div>

          </div>

          {/* 5. Interactive Quick Actions Footer */}
          <div className="bg-[#FBF9F5] border-t border-[#D3C8B7] px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              onClick={handleInspectInQueue}
              className="text-xs font-semibold text-[#B5613D] hover:text-[#9E5231] hover:underline cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Inspect in QC Queue</span>
              <span>↗</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleToggleArchive}
                className="px-4 py-2 border border-[#D3C8B7] hover:bg-[#EFE5D3] text-[#352013] rounded-full text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {product.status === 'active' ? (
                  <>
                    <Archive className="w-3.5 h-3.5 text-[#6B5344]" />
                    <span>Archive Lot</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-[#384D35]" />
                    <span>Restore Lot</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2] rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
