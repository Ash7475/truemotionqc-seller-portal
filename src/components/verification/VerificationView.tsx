import React, { useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  UploadCloud,
  X,
  Camera,
  Video,
  FileVideo,
  ShieldCheck,
  FileWarning,
  Truck,
  RotateCcw,
  MapPin,
  Building2,
  Landmark,
  UserCheck,
  CreditCard,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Product, VerificationStage } from '../../types';
import { ProductDetailModal } from '../products/ProductDetailModal';
import { AdminQcSandboxStrip } from './AdminQcSandboxStrip';
import { getCategoryQcAngles, getProductAngleImage } from '../../utils/qcAngles';
import { getProductImage, handleImageError } from '../../utils/productImages';
import { PopUpContainer, PopUpItem, luxuryEase } from '../common/MotionPrimitives';

const VERIFICATION_STAGES = [
  { step: 1, label: 'Submitted', key: 'submitted', shortDesc: 'Docket Transmitted' },
  { step: 2, label: 'AI Optical Check', key: 'ai_review', shortDesc: 'Macro Engraving ML' },
  { step: 3, label: 'Digital-QC & Direct Express', key: 'human_review', shortDesc: '6-Angle & Live Proof Verified' },
  { step: 4, label: 'Verified', key: 'approved', shortDesc: 'Escrow Active' }
];

const getStageProgress = (status: VerificationStage) => {
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

export const VerificationView: React.FC = () => {
  const { products, currentSeller, resubmitProductEvidence, activeSubTab } = useApp();

  const [selectedTab, setSelectedTab] = useState<'pending' | 'verified' | 'rejected'>(
    activeSubTab === 'rejected' ? 'rejected' : activeSubTab === 'verified' ? 'verified' : 'pending'
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalProduct, setDetailModalProduct] = useState<Product | null>(null);
  const [qcReportProduct, setQcReportProduct] = useState<Product | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sandboxToast, setSandboxToast] = useState<string | null>(null);

  React.useEffect(() => {
    if (!sandboxToast) return;
    const t = setTimeout(() => setSandboxToast(null), 4000);
    return () => clearTimeout(t);
  }, [sandboxToast]);

  React.useEffect(() => {
    if (activeSubTab === 'rejected') setSelectedTab('rejected');
    else if (activeSubTab === 'verified') setSelectedTab('verified');
    else if (activeSubTab === 'pending') setSelectedTab('pending');
  }, [activeSubTab]);

  const pendingItems = products.filter(
    (p) => p.verificationStatus !== 'approved' && p.verificationStatus !== 'rejected'
  );
  const verifiedItems = products.filter((p) => p.verificationStatus === 'approved');
  const rejectedItems = products.filter((p) => p.verificationStatus === 'rejected');
  const qcFailedItems = rejectedItems;

  const currentList =
    selectedTab === 'pending'
      ? pendingItems
      : selectedTab === 'verified'
      ? verifiedItems
      : rejectedItems;

  const handleOpenEvidence = (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
    setEvidenceNote('');
  };

  const handleEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    resubmitProductEvidence(
      selectedProduct.id,
      evidenceNote || 'Supplemental laser engraving macro photos provided.'
    );
    setShowModal(false);
    setSelectedTab('pending');
    setSandboxToast(`Lot ${selectedProduct.sku} re-queued for Digital-QC inspection.`);
  };

  const getFallbackFailureReasons = (product: Product): string[] => {
    if (product.qcRejectionReasons && product.qcRejectionReasons.length > 0) {
      return product.qcRejectionReasons;
    }
    return [
      '06 Macro Serial engraving mismatch against brand registry.',
      'Tamper-seal video clip obscured during intake seal inspection.'
    ];
  };

  const getFailedAngleInfo = (product: Product) => {
    const angles = getCategoryQcAngles(product.category);
    const idx = typeof product.failedAngleIndex === 'number' ? product.failedAngleIndex : 5;
    const clampedIdx = Math.max(0, Math.min(angles.length - 1, idx));
    const slot = angles[clampedIdx];
    const label =
      product.failedAngleLabel || `0${clampedIdx + 1} · ${slot?.label || 'Macro Serial'}`;
    return { index: clampedIdx, label };
  };

  const getFallbackReturnSteps = (product: Product) => {
    const sellerAddress = currentSeller?.businessAddress || 'Registered Seller Atelier Address';
    const sellerAtelier = currentSeller?.sellerName || 'Seller Atelier';

    if (product.returnTracking?.steps && product.returnTracking.steps.length === 3) {
      return product.returnTracking.steps;
    }
    return [
      {
        label: 'QC Flagged & Tamper-Sealed',
        timestamp: new Date(product.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }),
        detail: 'Digital QC audit flagged discrepancy; lot withheld from live marketplace without physical hub transit.',
        status: 'completed' as const
      },
      {
        label: 'Insured Return Transit to Atelier',
        timestamp: 'Active Courier Leg',
        detail: `Armored courier routing parcel back to ${sellerAtelier} (${sellerAddress}).`,
        status: 'active' as const
      },
      {
        label: 'Delivered to Seller Atelier',
        timestamp: `Est. ${product.returnTracking?.estimatedDelivery || '4 Business Days'}`,
        detail: `Signature confirmation required at ${sellerAddress}.`,
        status: 'pending' as const
      }
    ];
  };

  const panNumber = currentSeller?.panNumber || currentSeller?.pan || currentSeller?.taxId || 'Verified';
  const gstin = currentSeller?.gstin || 'Verified';
  const bankName = currentSeller?.bankInstitution || currentSeller?.bank_name || currentSeller?.bankName || 'Verified Partner Bank';
  const accountMasked = currentSeller?.bankAccountMasked || (currentSeller?.accountNumber ? `••••${currentSeller.accountNumber.slice(-4)}` : '••••4819');
  const ifsc = currentSeller?.ifscCode || currentSeller?.ifsc_code || 'Verified';
  const storeName = currentSeller?.store_name || currentSeller?.storeName || currentSeller?.sellerName || 'Seller Atelier';
  const legalName = currentSeller?.fullName || currentSeller?.full_name || storeName;

  return (
    <PopUpContainer className="space-y-6 relative pb-6">
      {/* Sandbox Action Confirmation Toast */}
      <AnimatePresence>
        {sandboxToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0A22B8] text-white shadow-xl text-xs font-medium max-w-md border border-white/20"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{sandboxToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#0A22B8] font-bold block mb-1">
            COMPLIANCE, KYC &amp; QC AUDIT
          </span>
          <h1 className="text-[1.875rem] sm:text-[2.5rem] leading-[1.15] font-display font-semibold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-[#0A22B8]" />
            <span>KYC &amp; Verification</span>
          </h1>
          <p className="text-[0.9375rem] text-[#64748B] mt-0.5 leading-relaxed">
            Live compliance credentials, verified tax registration, settlement banking, and physical product authenticity dockets.
          </p>
        </div>

        {/* Global Live KYC Status Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EAF0FF] border border-[#BFDBFE] text-[#0A22B8] font-semibold text-xs shrink-0 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>Status: VERIFIED &amp; COMPLIANT</span>
        </div>
      </PopUpItem>

      {/* 1. SELLER COMPLIANCE & KYC DOSSIER (Step 1-3 Live Verification Summary) */}
      <PopUpItem className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* Card 1: Tax & Business Registration (Step 1) */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6ECF5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
              <Building2 className="w-4 h-4 text-[#0A22B8]" />
              <span>Tax &amp; Business</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Verified
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">Legal Name</span>
              <span className="font-semibold text-[#0F172A] truncate block">{legalName}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">PAN Number</span>
              <span className="font-mono font-bold text-[#0A22B8]">{panNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">GSTIN Number</span>
              <span className="font-mono font-bold text-[#0F172A]">{gstin}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Identity & Biometrics (Step 2) */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6ECF5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
              <UserCheck className="w-4 h-4 text-[#0A22B8]" />
              <span>Identity &amp; Biometrics</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Approved
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">ID Document</span>
              <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aadhaar / Passport Card</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">Facial Liveness</span>
              <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Biometric Selfie Matched</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">Application Ref</span>
              <span className="font-mono text-[#64748B]">
                {currentSeller?.applicationRefNumber || 'TMQC-2026-VERIFIED'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Settlement Bank Destination (Step 3) */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6ECF5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
              <Landmark className="w-4 h-4 text-[#0A22B8]" />
              <span>Settlement Bank</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Linked
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">Institution</span>
              <span className="font-semibold text-[#0F172A] truncate block">{bankName}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">Account Number</span>
              <span className="font-mono font-bold text-[#0F172A]">{accountMasked}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block">IFSC Code</span>
              <span className="font-mono font-bold text-[#0A22B8]">{ifsc}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Governance & Trust Metric */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0D2CD4] to-[#071991] text-white shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <BadgeCheck className="w-4 h-4 text-white" />
              <span>Governance Level</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold border border-white/30">
              Tier 1
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-white/80 block">Approval Date</span>
              <span className="font-semibold text-white">
                {currentSeller?.approvedAt ? new Date(currentSeller.approvedAt).toLocaleDateString() : 'Active Since 2026'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-white/80 block">Authentic Pass Rate</span>
              <span className="font-mono font-bold text-white">100.0% Pass</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-white/80 block">Escrow Fee Rate</span>
              <span className="font-mono font-bold text-white">5.0% Standard</span>
            </div>
          </div>
        </div>
      </PopUpItem>

      {/* Prominent Global QC Failed Warning Banner (when any item failed QC) */}
      {qcFailedItems.length > 0 && (
        <PopUpItem className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  QC Flagged
                </span>
                <span className="text-sm font-bold text-[#0F172A]">
                  {qcFailedItems.length} {qcFailedItems.length === 1 ? 'Lot Failed' : 'Lots Failed'} TrueMotion QC Authentication
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                <strong>{qcFailedItems[0].name}</strong> ({qcFailedItems[0].sku}) was flagged during vault audit:{' '}
                {getFallbackFailureReasons(qcFailedItems[0])[0]} Insured return shipment to your atelier is active.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedTab('rejected');
                setQcReportProduct(qcFailedItems[0]);
              }}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
            >
              <FileWarning className="w-3.5 h-3.5" />
              <span>View QC Report</span>
            </button>
          </div>
        </PopUpItem>
      )}

      {/* Verification Subtab Pills */}
      <PopUpItem className="flex flex-wrap items-center gap-2 p-1.5 bg-white border border-[#E6ECF5] rounded-xl w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setSelectedTab('pending')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            selectedTab === 'pending'
              ? 'bg-[#0A22B8] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Inspection ({pendingItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('verified')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            selectedTab === 'verified'
              ? 'bg-[#0A22B8] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified &amp; Approved ({verifiedItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('rejected')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            selectedTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>QC Flagged / Returns ({rejectedItems.length})</span>
        </button>
      </PopUpItem>

      {/* List Container */}
      <PopUpItem>
      {currentList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-[#E6ECF5] text-center space-y-3 shadow-xs">
          <BadgeCheck className="w-10 h-10 text-[#0A22B8]/40 mx-auto" />
          <h3 className="text-lg font-bold text-[#0F172A]">No products in this queue</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {selectedTab === 'pending' && 'All current catalog items have completed physical and optical review.'}
            {selectedTab === 'verified' && 'No verified listings yet. Submit new items to enter verification.'}
            {selectedTab === 'rejected' && 'Outstanding authentication failures are zero. All pieces conform to standard.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((product, idx) => {
            const isQcFailed = product.verificationStatus === 'rejected';
            const isPendingLot =
              product.verificationStatus !== 'approved' && product.verificationStatus !== 'rejected';
            const failedAngle = getFailedAngleInfo(product);
            const returnSteps = isQcFailed ? getFallbackReturnSteps(product) : [];

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05, ease: luxuryEase }}
                onClick={() => setDetailModalProduct(product)}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E6ECF5] hover:border-[#0A22B8]/40 transition-colors space-y-4 cursor-pointer group shadow-xs"
              >
                {/* 1. Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#0A22B8] tracking-wider">
                      LOT {product.sku}
                    </span>
                    <span className="text-[#CBD5E1]">&bull;</span>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#EAF0FF] text-[#0A22B8] font-bold">
                      {product.category}
                    </span>
                    {product.status === 'draft' && (
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        Draft / Halted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {product.verificationStatus === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>QC Verified</span>
                      </span>
                    ) : isQcFailed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold text-rose-700 bg-rose-50 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        QC FAILED
                      </span>
                    ) : product.verificationStatus === 'additional_evidence' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        EVIDENCE REQUIRED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#0A22B8] bg-[#EAF0FF]">
                        <Clock className="w-3.5 h-3.5 text-[#0A22B8]" />
                        PHYSICAL AUDIT QUEUE
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Card QC Failed Diagnostics Warning Banner */}
                {isQcFailed && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-xl bg-rose-50/80 border border-rose-200 overflow-hidden"
                  >
                    <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-rose-200">
                      <div className="flex items-start gap-2.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-rose-700 uppercase font-mono text-[11px] tracking-wider">
                              Inspector Rejection Diagnostic
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-semibold">
                              <Camera className="w-3 h-3" />
                              <span>Failed Angle: {failedAngle.label}</span>
                            </span>
                          </div>
                          <p className="text-[#0F172A] font-medium leading-relaxed">
                            {getFallbackFailureReasons(product)[0]}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQcReportProduct(product);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-xs"
                      >
                        <FileWarning className="w-3.5 h-3.5" />
                        <span>View QC Report</span>
                      </button>
                    </div>

                    {/* 3-Step Insured Return Tracking Timeline */}
                    <div className="p-4 bg-white/70 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                          <Truck className="w-3.5 h-3.5 text-[#0A22B8]" />
                          <span>Insured Return Tracking</span>
                          <span className="text-rose-600 font-bold">
                            {product.returnTracking?.trackingNumber || 'TM-RET-2026-4089'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#64748B]">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="truncate max-w-xs sm:max-w-md">
                            Destination: <strong className="text-[#0F172A]">{currentSeller?.businessAddress || 'Registered Atelier Address'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {returnSteps.slice(0, 3).map((step, sIdx) => (
                          <div
                            key={`${product.id}-ret-${sIdx}`}
                            className={`p-3 rounded-xl border text-xs space-y-1 ${
                              step.status === 'completed'
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : step.status === 'active'
                                ? 'bg-white border-rose-400 text-[#0F172A]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase">
                                {step.status === 'completed' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                ) : step.status === 'active' ? (
                                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                                ) : (
                                  <Clock className="w-3 h-3 text-[#94A3B8]" />
                                )}
                                <span>Step 0{sIdx + 1}</span>
                              </span>
                              <span className="text-[10px] font-mono text-[#64748B]">
                                {step.timestamp}
                              </span>
                            </div>
                            <div className="font-semibold text-[11px] text-[#0F172A] leading-snug">
                              {step.label}
                            </div>
                            <p className="text-[10px] text-[#64748B] leading-relaxed">
                              {step.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Middle Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      onError={handleImageError}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-[#E6ECF5] shrink-0 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#0A22B8] transition-colors truncate max-w-lg">
                        {product.name}
                      </h3>
                      <div className="text-xs text-[#64748B] flex items-center gap-3 tabular-nums">
                        <span>
                          Price: <strong className="text-[#0F172A] font-mono">₹{product.price.toLocaleString('en-IN')}</strong>
                        </span>
                        <span>
                          Stock: <strong className="text-[#0F172A] font-mono">{product.stock} units</strong>
                        </span>
                      </div>
                      {product.reviewerNotes && (
                        <p className="text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9] max-w-xl">
                          <strong className="text-[#0A22B8]">Inspector Audit Log:</strong> {product.reviewerNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Packing Video Indicator */}
                  <div className="shrink-0">
                    {isQcFailed ? (
                      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                        <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <div className="font-mono font-semibold text-[#0F172A] text-[11px]">
                            {product.returnTracking?.trackingNumber || 'TM-RET-2026-4089'}
                          </div>
                          <span className="text-[10px] font-mono text-rose-600 block font-semibold">
                            Returning to Atelier
                          </span>
                        </div>
                      </div>
                    ) : product.packingVideo ? (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EAF0FF] border border-[#BFDBFE] text-xs">
                        <FileVideo className="w-4 h-4 text-[#0A22B8] shrink-0" />
                        <div>
                          <div className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[200px]">
                            {product.packingVideo.fileName}
                          </div>
                          <span className="text-[10px] font-mono text-[#0A22B8] block font-semibold">
                            Tamper-Seal Clip Transmitted
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B]">
                        <Video className="w-3.5 h-3.5 text-[#0A22B8]" />
                        <span>Packing Video: Pending Dispatch</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. 4-Stage Verification Pipeline Progress */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E6ECF5] space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0A22B8]" />
                      <span>ADMIN VERIFICATION PIPELINE</span>
                    </span>
                    <span className={`font-bold ${isQcFailed ? 'text-rose-600' : 'text-[#0A22B8]'}`}>
                      {isQcFailed
                        ? 'Halted at Stage 03 · Return Active'
                        : `Stage 0${getStageProgress(product.verificationStatus)} / 04`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {VERIFICATION_STAGES.map((stg) => {
                      const currentProgress = getStageProgress(product.verificationStatus);
                      const isComplete =
                        stg.step < currentProgress ||
                        (stg.step === 4 && product.verificationStatus === 'approved');
                      const isCurrent =
                        stg.step === currentProgress &&
                        product.verificationStatus !== 'approved' &&
                        !isQcFailed;
                      const isStageRejected =
                        stg.step === 3 &&
                        (product.verificationStatus === 'rejected' ||
                          product.verificationStatus === 'additional_evidence');

                      return (
                        <div
                          key={stg.step}
                          className={`p-2.5 rounded-xl border text-xs transition-colors ${
                            isStageRejected
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : isComplete
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : isCurrent
                              ? 'bg-[#EAF0FF] border-[#0A22B8] text-[#0A22B8]'
                              : 'bg-white border-[#E2E8F0] text-[#94A3B8]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold">0{stg.step}</span>
                            {isComplete ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            ) : isStageRejected ? (
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            ) : isCurrent ? (
                              <span className="w-2 h-2 rounded-full bg-[#0A22B8] animate-pulse" />
                            ) : null}
                          </div>
                          <div className="font-semibold text-[11px] truncate leading-tight">{stg.label}</div>
                          <div className="text-[9px] truncate text-[#64748B] mt-0.5">
                            {isStageRejected ? 'QC Failed · Flagged' : stg.shortDesc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3B. Admin QC Sandbox Interactive Demo Controls */}
                {isPendingLot && (
                  <AdminQcSandboxStrip
                    product={product}
                    onStageAdvanced={(nextStage) => {
                      const stageNames: Record<string, string> = {
                        ai_review: 'Stage 02 / 04 (AI Optical Check)',
                        human_review: 'Stage 03 / 04 (Digital-QC & Direct Express)',
                        approved: 'Stage 04 / 04 (TMQC Verified)'
                      };
                      setSandboxToast(
                        `Lot ${product.sku} advanced to ${stageNames[nextStage] || nextStage}.`
                      );
                    }}
                    onApproved={() => {
                      setSandboxToast(
                        `Lot ${product.sku} passed Stage 04 / 04 — moved to Verified & Approved.`
                      );
                      setSelectedTab('verified');
                    }}
                    onFailed={(reason) => {
                      setSandboxToast(
                        `Lot ${product.sku} failed QC (${reason}) — insured return triggered.`
                      );
                      setSelectedTab('rejected');
                    }}
                  />
                )}

                {/* 4. 6-Angle Photography Strip Preview */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                    <span className="uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <Camera className="w-3.5 h-3.5 text-[#0A22B8]" />
                      <span>6-Angle Authentication Captures ({product.category})</span>
                    </span>
                    <span className="text-[#0A22B8] font-semibold">Click lot to expand inspection viewer</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {getCategoryQcAngles(product.category).map((slot, angleIdx) => {
                      const photoUrl = getProductAngleImage(product, slot.id, angleIdx);
                      const isAngleFailed = isQcFailed && angleIdx === failedAngle.index;

                      return (
                        <div key={slot.id} className="space-y-1">
                          <div
                            className={`aspect-square rounded-xl overflow-hidden bg-[#F8FAFC] relative transition-colors ${
                              isAngleFailed
                                ? 'border-2 border-rose-500 ring-2 ring-rose-500/20'
                                : 'border border-[#E2E8F0] group-hover:border-[#0A22B8]/40'
                            }`}
                          >
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={slot.label}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC] text-[#94A3B8]">
                                <Camera className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute top-1 left-1 px-1.5 rounded-full bg-[#0F172A]/80 backdrop-blur-xs text-[8px] font-mono text-white">
                              0{angleIdx + 1}
                            </div>
                            {isAngleFailed && (
                              <div className="absolute bottom-1 inset-x-1 py-0.5 rounded-md bg-rose-600 text-white text-[8px] font-mono font-bold uppercase text-center tracking-wider">
                                FAILED
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-mono block truncate text-center font-medium ${
                              isAngleFailed ? 'text-rose-600 font-bold' : 'text-[#64748B]'
                            }`}
                            title={slot.label}
                          >
                            {slot.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Footer Quick Links & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9] text-xs">
                  <span className="text-[#0A22B8] group-hover:underline inline-flex items-center gap-1 text-[11px] font-semibold">
                    <span>Inspect Lot Dossier &amp; Video Audit</span>
                    <span>&rarr;</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {isQcFailed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQcReportProduct(product);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <FileWarning className="w-3.5 h-3.5" />
                        <span>View QC Report</span>
                      </button>
                    )}

                    {(product.verificationStatus === 'rejected' ||
                      product.verificationStatus === 'additional_evidence') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEvidence(product);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-[#0A22B8] hover:bg-[#081B9A] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        Upload Supplemental Proof
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* QC Rejection Report & Return Tracking Modal */}
      <AnimatePresence>
        {qcReportProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setQcReportProduct(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: luxuryEase }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white border border-[#E6ECF5] rounded-2xl p-6 sm:p-7 space-y-5 relative text-[#0F172A] my-auto max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <button
                type="button"
                onClick={() => setQcReportProduct(null)}
                aria-label="Close QC report modal"
                className="absolute top-5 right-5 p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-4 pr-8">
                <img
                  src={getProductImage(qcReportProduct)}
                  alt={qcReportProduct.name}
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover border border-[#E6ECF5] shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                      QC Flagged
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#64748B]">
                      LOT {qcReportProduct.sku}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    {qcReportProduct.name}
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Inspection Refusal Report &amp; Insured Return Logistics to Seller Atelier
                  </p>
                </div>
              </div>

              {/* Exact Failure Reasons Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-700">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Exact Authentication Failure Findings</span>
                </div>

                <ul className="space-y-2 text-xs text-[#0F172A]">
                  {getFallbackFailureReasons(qcReportProduct).map((reason, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-rose-200"
                    >
                      <span className="font-mono text-[10px] font-bold text-rose-600 mt-0.5">
                        0{idx + 1}
                      </span>
                      <span className="leading-relaxed">{reason}</span>
                    </li>
                  ))}
                </ul>

                {qcReportProduct.reviewerNotes && (
                  <div className="pt-2 border-t border-rose-200 text-xs text-[#64748B]">
                    <strong className="text-[#0F172A]">Inspector Summary:</strong> {qcReportProduct.reviewerNotes}
                  </div>
                )}
              </div>

              {/* Return Tracking Timeline */}
              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E6ECF5] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E6ECF5]">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#0A22B8]" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                      Return Tracking to Seller Atelier
                    </span>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <span className="font-bold text-[#0A22B8]">
                      {qcReportProduct.returnTracking?.trackingNumber || 'TM-RET-2026-4089'}
                    </span>
                    <span className="text-[#64748B] block">
                      {qcReportProduct.returnTracking?.carrier || 'TrueMotion QC Armored Return Courier'}
                    </span>
                  </div>
                </div>

                <div className="text-xs flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-[#E6ECF5]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#64748B] block">
                      Return Destination (Seller Atelier)
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {currentSeller?.sellerName || 'Registered Seller Atelier'}
                    </span>
                    <span className="text-[11px] text-[#64748B] block">
                      {currentSeller?.businessAddress || 'Registered Atelier Address'}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#EAF0FF] text-[#0A22B8] font-mono text-[10px] font-bold">
                    Est. {qcReportProduct.returnTracking?.estimatedDelivery || '4 Business Days'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => {
                    const target = qcReportProduct;
                    setQcReportProduct(null);
                    handleOpenEvidence(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Submit Supplemental Evidence
                </button>
                <button
                  type="button"
                  onClick={() => setQcReportProduct(null)}
                  className="px-5 py-2 rounded-xl bg-[#0A22B8] hover:bg-[#081B9A] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supplemental Proof Modal */}
      <AnimatePresence>
        {showModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: luxuryEase }}
              className="w-full max-w-lg bg-white border border-[#E6ECF5] rounded-2xl p-6 space-y-4 relative text-xs text-[#0F172A] shadow-xl"
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-bold text-[#0F172A]">
                Supplemental Evidence Docket · {selectedProduct.sku}
              </h3>
              <p className="text-xs text-[#64748B]">
                Submit certificate of authentic origin or macro photos to satisfy the TrueMotion QC audit requirement.
              </p>

              <form onSubmit={handleEvidenceSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Atelier Specialist Explanation
                  </label>
                  <textarea
                    rows={3}
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    placeholder="Detail serial numbers, manufacturer papers, or calibration sheets..."
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0A22B8]"
                    required
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#EAF0FF]/50 border border-dashed border-[#BFDBFE] text-center text-xs text-[#64748B] flex flex-col items-center gap-1">
                  <UploadCloud className="w-6 h-6 text-[#0A22B8]" />
                  <span className="font-semibold text-[#0F172A]">TrueMotion_QC_Inspection_Package.zip</span>
                  <span className="text-[10px] text-[#64748B]">Ready for cryptographic hash signing</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0A22B8] hover:bg-[#081B9A] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                  >
                    Submit Evidence for Review
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailModalProduct}
        onClose={() => setDetailModalProduct(null)}
        onQcStageAdvanced={(nextStage) => {
          const stageNames: Record<string, string> = {
            ai_review: 'Stage 02 / 04 (AI Optical Check)',
            human_review: 'Stage 03 / 04 (Digital-QC & Direct Express)',
            approved: 'Stage 04 / 04 (TMQC Verified)'
          };
          setSandboxToast(
            `Lot ${detailModalProduct?.sku || ''} advanced to ${stageNames[nextStage] || nextStage}.`
          );
        }}
        onQcApproved={() => {
          setSandboxToast(
            `Lot ${detailModalProduct?.sku || ''} passed Stage 04 / 04 — moved to Verified & Approved.`
          );
          setSelectedTab('verified');
        }}
        onQcFailed={(reason) => {
          setSandboxToast(
            `Lot ${detailModalProduct?.sku || ''} failed QC (${reason}) — insured return triggered.`
          );
          setSelectedTab('rejected');
        }}
      />
      </PopUpItem>
    </PopUpContainer>
  );
};