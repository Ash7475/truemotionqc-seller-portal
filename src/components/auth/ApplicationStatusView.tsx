import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  ShieldCheck,
  Building2,
  Landmark,
  Fingerprint,
  LogOut,
  CheckCircle2,
  FileText,
  Lock,
  RefreshCw,
  Trash2,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  X,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TrueMotionQCLogo } from '../common/TrueMotionQCLogo';

export interface ApplicationStatusViewProps {
  onEditAndResubmit?: () => void;
}

const PRESET_REASONS = [
  'Blurry Aadhaar / ID document',
  'Bank account name mismatch with PAN',
  'Liveness selfie unclear'
];

export const ApplicationStatusView: React.FC<ApplicationStatusViewProps> = ({
  onEditAndResubmit
}) => {
  const { currentSeller, logout, adminApproveKyc, adminRejectKyc, checkSellerStatus, deleteSellerAccount } = useApp();
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Blurry Aadhaar / ID document');
  const [statusFeedback, setStatusFeedback] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const rawKyc = (currentSeller as any)?.kyc_status || currentSeller?.kycStatus || (currentSeller as any)?.verification_status || currentSeller?.verificationStatus;
  const normKyc = String(rawKyc || 'UNDER_REVIEW').trim().toUpperCase();
  const isRejected = normKyc === 'REJECTED';
  const displayedRejectionReason =
    currentSeller?.rejectionReason ||
    (currentSeller as any)?.rejection_reason ||
    'Document verification criteria not satisfied. Please review your details and re-upload required documents.';

  const handleCheckStatus = async () => {
    if (!currentSeller) return;
    setIsChecking(true);
    setStatusFeedback(null);
    try {
      const updated = await checkSellerStatus(currentSeller.id);
      const kyc = String(updated?.kycStatus || updated?.verificationStatus || '').trim().toUpperCase();
      if (kyc === 'VERIFIED' || kyc === 'APPROVED') {
        setStatusFeedback({
          type: 'success',
          message: 'Accreditation Approved! TrueMotion QC verification complete. Unlocking studio...'
        });
      } else if (kyc === 'REJECTED') {
        setStatusFeedback({
          type: 'warn',
          message: `Application Status: REJECTED. Reason: "${updated?.rejectionReason || displayedRejectionReason}". Please edit and resubmit.`
        });
      } else {
        setStatusFeedback({
          type: 'info',
          message: 'Status: UNDER_REVIEW. Your KYC dossier, facial liveness proof, and bank details are currently undergoing compliance review in Supabase.'
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'warn',
        message: err?.message || 'Could not verify status with backend. Please retry in a moment.'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSimulateApprove = async () => {
    if (!currentSeller) return;
    setIsApproving(true);
    setStatusFeedback(null);
    try {
      if (adminApproveKyc) {
        await adminApproveKyc(currentSeller.id);
      }
      setStatusFeedback({
        type: 'success',
        message: 'Admin approval simulated in Supabase. kyc_status set to VERIFIED. Redirecting to Dashboard...'
      });
    } catch (err: any) {
      console.error('Failed to simulate admin approval:', err);
      setStatusFeedback({
        type: 'warn',
        message: err?.message || 'Failed to simulate admin approval.'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleSimulateReject = async () => {
    if (!currentSeller) return;
    const finalReason = rejectReason.trim() || 'Document verification failed. Please review your details and re-upload required documents.';
    setIsRejecting(true);
    setStatusFeedback(null);
    try {
      if (adminRejectKyc) {
        await adminRejectKyc(currentSeller.id, finalReason);
      }
      setShowRejectModal(false);
      setStatusFeedback({
        type: 'warn',
        message: `Admin rejection simulated in Supabase. Reason: "${finalReason}". Status set to REJECTED.`
      });
    } catch (err: any) {
      console.error('Failed to simulate admin rejection:', err);
      setStatusFeedback({
        type: 'warn',
        message: err?.message || 'Failed to simulate admin rejection.'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  if (!currentSeller) return null;

  return (
    <div className="min-h-screen w-full bg-[#F5F8FE] bg-canvas-grid text-[#0F172A] flex flex-col justify-between overflow-x-hidden relative">
      {/* Top Header */}
      <header className="h-20 px-6 sm:px-10 bg-white border-b border-[#E6ECF5] flex items-center justify-between shrink-0 shadow-xs">
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
          <TrueMotionQCLogo variant="cobalt" showTagline={false} size="md" />
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-2xl w-full mx-auto my-auto p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-[#E6ECF5] rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(10,34,184,0.04)] space-y-6"
        >
          {/* Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {isRejected ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span>APPLICATION REJECTED · ACTION REQUIRED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EAF0FF] border border-[#BFDBFE] text-[#0A22B8] text-[11px] font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>UNDER REVIEW · COMPLIANCE VERIFICATION</span>
              </span>
            )}
            <span className="text-xs font-mono text-[#64748B]">
              Ref: {currentSeller.applicationRefNumber || `TMQC-KYC-${currentSeller.id}`}
            </span>
          </div>

          {/* Rejection Red Banner vs Under Review Notice */}
          {isRejected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-red-50/95 border-2 border-red-200 text-[#0F172A] space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 border border-red-200 text-red-800 text-[10px] font-mono uppercase tracking-wider font-semibold">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  <span>Compliance Action Required</span>
                </div>
                <span className="text-xs font-mono text-red-700 font-semibold">Status: REJECTED</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-normal text-red-950 mb-2">
                  Application Rejected
                </h1>
                <p className="text-xs sm:text-sm text-red-900 leading-relaxed">
                  Your merchant accreditation application was reviewed by the TrueMotion QC Compliance Desk and was not approved.
                </p>
              </div>

              {/* Exact Rejection Reason Callout */}
              <div className="p-4 rounded-xl bg-white border border-red-200 space-y-1.5 shadow-2xs">
                <div className="text-[11px] font-mono uppercase tracking-wider text-red-700 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Official Reason for Rejection</span>
                </div>
                <p className="text-sm font-semibold text-red-950 font-sans leading-relaxed">
                  &ldquo;{displayedRejectionReason}&rdquo;
                </p>
              </div>

              <p className="text-xs text-red-800/90 leading-relaxed">
                Please review your uploaded Aadhaar PDF, PAN identity details, live biometric facial proof, and settlement bank credentials, then resubmit your application.
              </p>

              {/* Edit & Resubmit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onEditAndResubmit}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-600/20"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                  <span>Edit &amp; Resubmit KYC Application</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF0FF] text-[#0A22B8] text-[10px] font-mono uppercase tracking-wider font-bold">
                <Lock className="w-3 h-3 text-[#0A22B8]" />
                <span>Dashboard Locked</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-normal text-[#0F172A] mb-2">
                Application Submitted — Under TrueMotion QC Compliance Review
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Your atelier KYC documentation, live biometric facial verification, Aadhaar scans, and settlement bank credentials have been transmitted to Supabase and are actively under review. All dashboard routes remain strictly locked until accredited. Access is granted immediately once an Admin approves your application.
              </p>
            </div>
          )}

          {/* Status Feedback Toast/Banner */}
          {statusFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusFeedback.type === 'warn'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : statusFeedback.type === 'warn' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="leading-snug">{statusFeedback.message}</span>
            </motion.div>
          )}

          {/* Submitted Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#64748B] font-mono uppercase text-[10px] font-bold">
                <Building2 className="w-3.5 h-3.5 text-[#0A22B8]" />
                <span>Atelier &amp; Tax</span>
              </div>
              <div className="font-bold text-[#0F172A] text-sm">{currentSeller.sellerName}</div>
              <div className="font-mono text-[#64748B]">
                PAN: {currentSeller.panNumber || currentSeller.taxId || 'Submitted'}
              </div>
              {currentSeller.gstin && (
                <div className="font-mono text-[#64748B]">GSTIN: {currentSeller.gstin}</div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5 text-[#64748B] font-mono uppercase text-[10px] font-bold">
                  <Fingerprint className="w-3.5 h-3.5 text-[#0A22B8]" />
                  <span>KYC Identity</span>
                </div>
                <div className="font-bold text-[#0F172A] text-sm truncate">
                  {currentSeller.fullName || currentSeller.sellerName}
                </div>
                <div className="font-mono text-[#64748B]">
                  Aadhaar: {currentSeller.aadhaarMasked || '•••• •••• Verified'}
                </div>
                <div className="text-[11px] text-[#0A22B8] font-semibold">
                  {currentSeller.selfieCaptured ? 'Live Selfie & Aadhaar Scans Attached' : 'KYC Documentation Attached'}
                </div>
              </div>
              {currentSeller.selfieDataUrl && (
                <img
                  src={currentSeller.selfieDataUrl}
                  alt="Verified liveness selfie"
                  className="w-14 h-14 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                />
              )}
            </div>

            <div className="sm:col-span-2 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#64748B] font-mono uppercase text-[10px] font-bold">
                  <Landmark className="w-3.5 h-3.5 text-[#0A22B8]" />
                  <span>Settlement Bank</span>
                </div>
                <div className="font-bold text-[#0F172A]">
                  {currentSeller.bankInstitution} · {currentSeller.bankAccountMasked}
                </div>
              </div>
              <div className="font-mono text-[#0F172A] bg-white px-3 py-1 rounded-lg border border-[#E2E8F0] self-start sm:self-center font-semibold">
                IFSC: {currentSeller.ifscCode || currentSeller.routingOrSortCode}
              </div>
            </div>
          </div>

          {/* Compliance Lock Controls: Check Approval Status, Dev Simulate Approve, Dev Simulate Reject & Delete */}
          <div className="pt-4 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <FileText className="w-4 h-4 text-[#0A22B8] shrink-0" />
              <span>Overview Dashboard unlocks automatically once compliance approves your dossier.</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
              <button
                type="button"
                disabled={isChecking || isApproving || isRejecting}
                onClick={handleCheckStatus}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#0A22B8] ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Checking Supabase...' : 'Check Approval Status'}</span>
              </button>

              <button
                type="button"
                disabled={isApproving || isChecking || isRejecting}
                onClick={handleSimulateApprove}
                className="px-5 py-2.5 rounded-xl bg-[#0A22B8] hover:bg-[#081B9A] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-60"
                title="Dev: Simulate Admin Approve (updates kyc_status = 'VERIFIED' in Supabase)"
              >
                {isApproving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                    <span>Approving in Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Simulate Admin Approval (Test)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isRejecting || isApproving || isChecking}
                onClick={() => setShowRejectModal(true)}
                className="px-5 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-60"
                title="Dev: Simulate Admin Rejection (opens modal to set rejection reason & kyc_status = 'REJECTED')"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Simulate Admin Rejection (Test)</span>
              </button>

              <button
                type="button"
                disabled={isDeleting || isApproving || isChecking || isRejecting}
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Simulate Admin Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl border border-[#E7DEC9] p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-amber-700">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="text-base font-semibold text-[#2B1218]">
                    Simulate Admin Rejection (Test)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="p-1 rounded-md text-[#7A6B66] hover:text-[#2B1218] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#5E4A4D] leading-relaxed">
                Select a quick preset reason or type a custom reason below. This sets <code className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E7DEC9] font-mono text-[11px] text-[#3A101C]">kyc_status = &apos;REJECTED&apos;</code> and persists the rejection reason to the Supabase sellers table.
              </p>

              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#4E383B]">
                  Quick Preset Reasons
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                        rejectReason === preset
                          ? 'bg-[#3A101C] text-white border-[#3A101C] shadow-2xs'
                          : 'bg-[#FAF7F2] text-[#4E383B] border-[#E5DACB] hover:border-[#C4A46B]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#4E383B]">
                  Specific Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Type a specific reason for rejection..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E5DACB] focus:border-[#C4A46B] focus:bg-white rounded-lg text-xs text-[#2B1218] placeholder-[#9B8F85] focus:outline-none focus:ring-2 focus:ring-[#C4A46B]/25 transition-all resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE7DB]">
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#F5EFE6] hover:bg-[#EDE5D9] text-[#2B1218] text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRejecting || !rejectReason.trim()}
                  onClick={handleSimulateReject}
                  className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isRejecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Rejecting in Supabase...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#E7DEC9] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-serif font-bold text-[#2B1218]">
                  Delete Account Permanently?
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#5E4A4D] leading-relaxed">
                Are you sure? This will permanently delete your account and all data from the backend.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE7DB]">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-[#F5EFE6] hover:bg-[#EDE5D9] text-[#2B1218] text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteSellerAccount(currentSeller.id);
                    } finally {
                      setIsDeleting(false);
                      setShowDeleteConfirm(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isDeleting ? 'Erasing Account...' : 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#E6ECF5] bg-white text-[11px] text-[#64748B]">
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold text-[#0F172A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A22B8]" />
            <span>TRUEMOTION QC COMPLIANCE DESK</span>
          </span>
          <span>Session Locked Until Admin Approval</span>
        </div>
      </footer>
    </div>
  );
};
