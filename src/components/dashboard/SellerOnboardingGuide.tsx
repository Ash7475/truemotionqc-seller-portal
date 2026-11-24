import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ShieldCheck, 
  PackageCheck, 
  Plus, 
  ArrowRight, 
  X, 
  Boxes
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SellerOnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const luxuryEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const SellerOnboardingGuide: React.FC<SellerOnboardingGuideProps> = ({
  isOpen,
  onClose,
}) => {
  const { setActiveSection, setOpenAddProductWizard } = useApp();

  const steps = [
    {
      step: 'STEP 01',
      title: 'Consign & Document',
      description: 'Register individual craft pieces or collections. Upload 6-angle category photos and specify provenance details.',
      icon: FileText,
      badge: 'Listing Intake',
    },
    {
      step: 'STEP 02',
      title: 'Digital QC Clearance',
      description: 'Every seller listing undergoes AI-assisted 6-angle macro verification. Quality checks happen 100% digitally before publication with zero hub delay.',
      icon: ShieldCheck,
      badge: 'Zero-Hub QC',
    },
    {
      step: 'STEP 03',
      title: 'Live Proof & Direct Express',
      description: 'Buyer funds are held in secure escrow. Sellers record uncut live in-app packing video and ship parcels directly from Seller to Buyer in 2–4 days under full Escrow protection.',
      icon: PackageCheck,
      badge: 'Direct Express (2–4 Days)',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 no-print">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: luxuryEase }}
            className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#E6ECF5] shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center justify-between shrink-0 bg-white">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#0A22B8] font-bold">
                  TrueMotion QC Seller Guide
                </span>
                <h2 className="text-xl font-bold text-[#0F172A] mt-0.5">
                  How Verified Selling Works
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
                aria-label="Close guide modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-[#64748B] leading-relaxed">
                Welcome to TrueMotion QC. Our zero-hub direct shipping architecture eliminates middleman warehouses, verifying high-value artisan luxury directly in-app.
              </p>

              <div className="space-y-3">
                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-[#E6ECF5] bg-[#F8FAFC] hover:border-[#0A22B8]/40 transition-all flex gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EAF0FF] text-[#0A22B8] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-mono text-[#0A22B8] font-bold">
                            {st.step}
                          </span>
                          <span className="text-[10px] font-semibold text-[#475569] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full">
                            {st.badge}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#0F172A]">
                          {st.title}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          {st.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveSection('products');
                }}
                className="text-xs font-semibold text-[#0A22B8] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Boxes className="w-4 h-4" />
                <span>Go to Active Listings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setOpenAddProductWizard(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#0A22B8] hover:bg-[#081B9A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Listing</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
