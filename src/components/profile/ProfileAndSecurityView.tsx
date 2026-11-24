import React, { useState } from 'react';
import { 
  History, 
  Save, 
  CheckCircle2, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Building2, 
  Landmark, 
  BadgeCheck, 
  Edit3,
  Copy,
  Check,
  RefreshCw,
  Key,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PopUpContainer, PopUpItem, modalDialogVariants, luxuryEase } from '../common/MotionPrimitives';

export const ProfileAndSecurityView: React.FC = () => {
  const { currentSeller, updateSellerProfile, activityLogs, activeSection, deleteSellerAccount } = useApp();

  const [activeTab, setActiveTab] = useState<'credentials' | 'edit' | 'security' | 'activity'>(
    activeSection === 'security' ? 'security' : activeSection === 'activity' ? 'activity' : 'credentials'
  );
  const [showBanking, setShowBanking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (activeSection === 'security') setActiveTab('security');
    else if (activeSection === 'activity') setActiveTab('activity');
    else if (activeSection === 'profile') {
      setActiveTab('credentials');
    }
  }, [activeSection]);

  const [sellerName, setSellerName] = useState(currentSeller?.sellerName || '');
  const [fullName, setFullName] = useState(currentSeller?.fullName || '');
  const [email, setEmail] = useState(currentSeller?.email || '');
  const [phone, setPhone] = useState(currentSeller?.phone || '');
  const [businessAddress, setBusinessAddress] = useState(currentSeller?.businessAddress || '');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentSeller?.twoFactorEnabled || false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [apiKey, setApiKey] = useState<string>(() => {
    const saved = localStorage.getItem('truemotion_qc_api_key');
    return saved || `live_pk_atelier_${currentSeller?.id ? currentSeller.id.replace(/-/g, '_') : '482'}_99201948201`;
  });
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyRegenerated, setKeyRegenerated] = useState(false);

  const handleCopyApiKey = () => {
    navigator.clipboard?.writeText(apiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2200);
  };

  const handleRegenerateApiKey = () => {
    const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = `live_pk_atelier_${currentSeller?.id ? currentSeller.id.replace(/-/g, '_') : '482'}_${randomHex}`;
    setApiKey(newKey);
    localStorage.setItem('truemotion_qc_api_key', newKey);
    setKeyRegenerated(true);
    setTimeout(() => setKeyRegenerated(false), 3000);
  };

  React.useEffect(() => {
    if (currentSeller) {
      setSellerName(currentSeller.sellerName);
      setFullName(currentSeller.fullName);
      setEmail(currentSeller.email);
      setPhone(currentSeller.phone);
      setBusinessAddress(currentSeller.businessAddress);
      setTwoFactorEnabled(currentSeller.twoFactorEnabled);
    }
  }, [currentSeller]);

  if (!currentSeller) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSellerProfile({
      sellerName,
      fullName,
      email,
      phone,
      businessAddress,
      twoFactorEnabled
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const firstLetter = currentSeller.sellerName ? currentSeller.sellerName.charAt(0).toUpperCase() : 'M';

  const getFullAccountNumber = () => {
    return '004910294819';
  };

  const getFullRoutingCode = () => {
    return currentSeller.routingOrSortCode || 'HDFC0000240 / CHASUS33';
  };

  const getMaskedRoutingCode = () => {
    const raw = currentSeller.routingOrSortCode || 'HDFC0000240';
    const lastThree = raw.slice(-3);
    return `••••••••${lastThree}`;
  };

  return (
    <PopUpContainer className="space-y-6 pb-6">
      {/* Header & Subtab Navigation */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#0A22B8] font-bold block mb-1">
            ATELIER CREDENTIALS &amp; GOVERNANCE
          </span>
          <h1 className="text-[1.875rem] sm:text-[2.5rem] leading-[1.15] font-display font-semibold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#0A22B8]" />
            <span>Store Profile &amp; Security</span>
          </h1>
          <p className="text-[0.9375rem] text-[#64748B] mt-0.5 leading-relaxed">
            TrueMotion QC verified merchant credentials, trust metrics, settlement banking, and security settings.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white border border-[#E6ECF5] rounded-xl w-fit shadow-xs self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'credentials'
                ? 'bg-[#0A22B8] text-white shadow-xs font-semibold'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Credentials &amp; Banking</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'edit'
                ? 'bg-[#0A22B8] text-white shadow-xs font-semibold'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-[#0A22B8] text-white shadow-xs font-semibold'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security &amp; 2FA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-[#0A22B8] text-white shadow-xs font-semibold'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </PopUpItem>

      <PopUpItem>

      <AnimatePresence>
        {savedSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-2xl bg-[#A9B89C]/35 border border-[#96A685] flex items-center gap-3 text-xs text-[#384D35] shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 text-[#384D35] shrink-0" />
            <span>Merchant credentials updated and synchronized across all TrueMotion QC clearance nodes.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRIMARY TAB: CREDENTIALS & BANKING */}
      {activeTab === 'credentials' && (
        <motion.div
          key="credentials"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: luxuryEase }}
          className="space-y-7"
        >
          {/* A. Merchant Identity Header Banner */}
          <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#B5613D] border border-[#9E5231] text-[#FFFBF2] font-serif text-xl font-bold flex items-center justify-center shrink-0 shadow-xs">
                {firstLetter}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-serif text-xl sm:text-2xl text-[#352013] font-bold tracking-tight">
                    {currentSeller.sellerName}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    QC Verified
                  </span>
                </div>
                <p className="text-xs text-[#6B5344]">
                  Authorized Horological &amp; Artisanal Atelier • Primary Contact: <strong className="text-[#352013] font-semibold">{currentSeller.fullName}</strong>
                </p>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E3D8C4] shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A6252] block">
                SELLER ID
              </span>
              <span className="font-mono text-sm font-bold text-[#B5613D]">
                {currentSeller.id}
              </span>
            </div>
          </div>

          {/* B. Section 1: VERIFIED SELLER CREDENTIALS */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#B5613D] font-bold mb-3">
              VERIFIED SELLER CREDENTIALS &amp; BUSINESS INFORMATION
            </h3>

            {/* Row 1: 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                    SELLER NAME
                  </span>
                  <div className="text-sm font-semibold text-[#352013] mt-1">
                    {currentSeller.sellerName}
                  </div>
                </div>
                <span className="text-xs text-[#6B5344] font-medium pt-1 border-t border-[#E3D8C4]">
                  Authorized Signatory
                </span>
              </div>

              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                    EMAIL
                  </span>
                  <div className="font-mono text-xs sm:text-sm font-medium text-[#352013] truncate mt-1">
                    {currentSeller.email}
                  </div>
                </div>
                <div className="text-xs font-semibold text-[#384D35] flex items-center gap-1 pt-1 border-t border-[#E3D8C4]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#384D35] shrink-0" />
                  <span>Verified Domain</span>
                </div>
              </div>

              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                    PHONE
                  </span>
                  <div className="font-mono text-xs sm:text-sm font-medium text-[#352013] mt-1">
                    {currentSeller.phone}
                  </div>
                </div>
                <div className="text-xs font-semibold text-[#384D35] flex items-center gap-1 pt-1 border-t border-[#E3D8C4]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#384D35] shrink-0" />
                  <span>2FA Secured</span>
                </div>
              </div>
            </div>

            {/* Row 2: Asymmetric 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                  BUSINESS INFORMATION &amp; ADDRESS
                </span>
                <div className="text-sm font-semibold text-[#352013]">
                  {currentSeller.sellerName}
                </div>
                <p className="text-xs text-[#6B5344] leading-relaxed pt-0.5">
                  {currentSeller.businessAddress}
                </p>
              </div>

              <div className="lg:col-span-1 bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                    GST / VAT NUMBER
                  </span>
                  <div className="font-mono text-sm font-bold text-[#352013] mt-1">
                    {currentSeller.taxId}
                  </div>
                </div>
                <div className="text-xs font-semibold text-[#384D35] flex items-center gap-1 pt-1 border-t border-[#E3D8C4]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#384D35] shrink-0" />
                  <span>Tax Validated</span>
                </div>
              </div>
            </div>

            {/* Row 3: 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                    VERIFICATION STATUS
                  </span>
                  <div className="text-sm font-semibold text-[#384D35] mt-1">
                    {currentSeller.verificationLevel || 'Level 3 Enterprise Verified'}
                  </div>
                </div>
                <span className="text-xs text-[#6B5344] pt-1 border-t border-[#E3D8C4]">
                  {currentSeller.verificationScope || 'Optical AI & Physical Dispute Authorized'}
                </span>
              </div>

              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                    TRUST RATING
                  </span>
                  <div className="font-mono text-base font-bold text-[#B5613D] mt-1 tabular-nums">
                    {currentSeller.trustScore ? currentSeller.trustScore.toFixed(2) : '4.95'} / 5.0
                  </div>
                </div>
                <span className="text-xs text-[#6B5344] pt-1 border-t border-[#E3D8C4]">
                  {currentSeller.authenticPassRate || '100% Authentic Pass Rate'}
                </span>
              </div>

              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                    LIFETIME DISBURSED PAYOUTS
                  </span>
                  <div className="font-mono text-base font-bold text-[#352013] mt-1 tabular-nums">
                    ₹{(currentSeller.lifetimeDisbursed !== undefined ? currentSeller.lifetimeDisbursed : 13584.05).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <span className="text-xs text-[#6B5344] pt-1 border-t border-[#E3D8C4]">
                  {currentSeller.escrowFeeTier || '5% TrueMotion QC Escrow Fee Net'}
                </span>
              </div>
            </div>
          </div>

          {/* C. Section 2: REGISTERED SETTLEMENT BANKING & ESCROW WIRE */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#B5613D] font-bold">
                REGISTERED SETTLEMENT BANKING &amp; ESCROW WIRE
              </h3>

              <button
                type="button"
                onClick={() => setShowBanking(!showBanking)}
                className="px-3.5 py-1.5 rounded-full bg-[#FBF9F5] hover:bg-[#EFE5D3] border border-[#D3C8B7] text-xs font-mono text-[#352013] font-semibold transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                {showBanking ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-[#6B5344]" />
                    <span>Mask Wire Details</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#6B5344]" />
                    <span>Show Wire Details</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                  FINANCIAL INSTITUTION
                </span>
                <div className="text-sm font-semibold text-[#352013] flex items-center gap-2 mt-1">
                  <Landmark className="w-4 h-4 text-[#B5613D] shrink-0" />
                  <span className="truncate">{currentSeller.bankInstitution || 'HDFC Bank Ltd'}</span>
                </div>
                <p className="text-[11px] text-[#7A6252] pt-0.5">
                  Direct Wire Clearance Node
                </p>
              </div>

              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                  ACCOUNT NUMBER
                </span>
                <div className="font-mono text-sm font-semibold text-[#352013] tracking-wider mt-1">
                  {showBanking ? getFullAccountNumber() : currentSeller.bankAccountMasked || '••••••••4819'}
                </div>
                <p className="text-[11px] text-[#7A6252] pt-0.5">
                  Encrypted Escrow Vault Routing
                </p>
              </div>

              <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-2xl p-5 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-[#7A6252] tracking-wider block">
                  ROUTING / SORT CODE
                </span>
                <div className="font-mono text-sm font-medium text-[#6B5344] mt-1 truncate">
                  {showBanking ? getFullRoutingCode() : getMaskedRoutingCode()}
                </div>
                <p className="text-[11px] text-[#7A6252] pt-0.5">
                  Federal Reserve / SWIFT Validated
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECONDARY TAB: EDIT PROFILE */}
      {activeTab === 'edit' && (
        <motion.div 
          key="edit"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: luxuryEase }}
          className="p-6 rounded-[1.75rem] bg-[#FBF9F5] border border-[#D3C8B7] shadow-2xs space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#E3D8C4]">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#352013]">Edit Merchant Information</h3>
              <p className="text-xs text-[#6B5344]">Update contact and corporate identity recorded in the TrueMotion QC registry.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase bg-[#A9B89C]/35 text-[#384D35] border border-[#96A685] font-semibold">
              {currentSeller.accountStatus}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#4A2E1B] font-semibold mb-1">Atelier Brand Name</label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={e => setSellerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3ECE0]/60 border border-[#D3C8B7] rounded-2xl text-[#352013] focus:outline-none focus:border-[#B5613D]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4A2E1B] font-semibold mb-1">Authorized Representative</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3ECE0]/60 border border-[#D3C8B7] rounded-2xl text-[#352013] focus:outline-none focus:border-[#B5613D]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4A2E1B] font-semibold mb-1">Corporate Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3ECE0]/60 border border-[#D3C8B7] rounded-2xl text-[#352013] focus:outline-none focus:border-[#B5613D]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4A2E1B] font-semibold mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3ECE0]/60 border border-[#D3C8B7] rounded-2xl text-[#352013] focus:outline-none focus:border-[#B5613D]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#4A2E1B] font-semibold mb-1">Registered Business Address</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F3ECE0]/60 border border-[#D3C8B7] rounded-2xl text-[#352013] focus:outline-none focus:border-[#B5613D]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4A2E1B] font-semibold mb-1">Tax ID / VAT Registration</label>
                <input
                  type="text"
                  value={currentSeller.taxId || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[#EFE5D3]/60 border border-[#D3C8B7] rounded-2xl text-[#7A6252] font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-[#7A6252] mt-1 block">Requires compliance ticket to modify</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('credentials')}
                className="px-4 py-2 rounded-full text-xs text-[#6B5344] hover:text-[#352013] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2] font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* SECONDARY TAB: SECURITY & 2FA */}
      {activeTab === 'security' && (
        <motion.div 
          key="security"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: luxuryEase }}
          className="p-6 rounded-[1.75rem] bg-[#FBF9F5] border border-[#D3C8B7] shadow-2xs space-y-6 text-xs"
        >
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-[#352013]">Two-Factor Authentication (2FA)</h3>
            <p className="text-[#6B5344]">
              Hardware security keys or authenticator apps (TOTP) protect your escrow disbursements.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3ECE0]/70 border border-[#E3D8C4] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#B5613D]" />
              <div>
                <span className="font-semibold text-[#352013] block">Authenticator App (TOTP)</span>
                <span className="text-[#6B5344] text-[11px]">Google Authenticator / YubiKey compatible</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextVal = !twoFactorEnabled;
                setTwoFactorEnabled(nextVal);
                updateSellerProfile({ twoFactorEnabled: nextVal });
              }}
              className={`px-4 py-2 rounded-full font-semibold text-xs cursor-pointer transition-colors ${
                twoFactorEnabled 
                  ? 'bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2]' 
                  : 'bg-[#B5613D] hover:bg-[#9E5231] text-[#FFFBF2]'
              }`}
            >
              {twoFactorEnabled ? 'Enabled & Active' : 'Enable 2FA'}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#F3ECE0]/70 border border-[#E3D8C4] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#352013] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#B5613D]" />
                <span>Active API Credentials &amp; Webhook Keys</span>
              </span>
              {keyRegenerated && (
                <span className="text-[11px] font-mono text-[#384D35] bg-[#A9B89C]/35 px-2.5 py-0.5 rounded-full border border-[#96A685] font-semibold animate-pulse">
                  ✓ Fresh API Key Generated
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[#4A2E1B] font-mono text-[11px] bg-[#FBF9F5] p-3 rounded-xl border border-[#D3C8B7]">
              <span className="truncate select-all">{apiKey}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-sans font-semibold bg-[#EFE5D3] hover:bg-[#E3D8C4] text-[#352013] border border-[#D3C8B7] cursor-pointer transition-colors"
                >
                  {keyCopied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-[#7A6252]" />}
                  <span>{keyCopied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateApiKey}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-sans font-semibold bg-[#B5613D]/10 hover:bg-[#B5613D]/20 text-[#B5613D] border border-[#B5613D]/30 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[#7A6252]">
              Use this bearer key to authenticate programmatic inventory syncing and webhook events.
            </p>
          </div>

          {/* Danger Zone: Permanent Account Deletion */}
          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-red-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Danger Zone · Permanent Account Deletion</span>
              </span>
            </div>
            <p className="text-[11px] text-red-700 leading-relaxed">
              Permanently delete this seller account, registered atelier profile, products, order records, and all KYC identity documents from the SQLite database and backend servers.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account Permanently</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECONDARY TAB: AUDIT LOG HISTORY */}
      {activeTab === 'activity' && (
        <motion.div 
          key="activity"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: luxuryEase }}
          className="rounded-[1.75rem] bg-[#FBF9F5] border border-[#D3C8B7] shadow-2xs overflow-hidden text-xs"
        >
          <div className="p-5 border-b border-[#E3D8C4] flex items-center justify-between">
            <h3 className="text-base font-serif font-bold text-[#352013]">Immutable Security &amp; Action Audit Trail</h3>
            <span className="font-mono text-[#6B5344]">{activityLogs.length} logged events</span>
          </div>

          <div className="divide-y divide-[#E3D8C4]">
            {activityLogs.map((log, idx) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03, ease: luxuryEase }}
                className="p-4 flex items-start justify-between gap-4 hover:bg-[#EFE5D3]/35 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#352013]">{log.action}</div>
                  <div className="text-[#6B5344]">{log.details}</div>
                  {log.entityRef && (
                    <span className="inline-block mt-1 font-mono text-[10px] text-[#384D35] bg-[#A9B89C]/30 border border-[#96A685] px-2 py-0.5 rounded-full font-semibold">
                      Ref: {log.entityRef}
                    </span>
                  )}
                </div>

                <span className="font-mono text-[#7A6252] text-[11px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              variants={modalDialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl border border-[#E7DEC9] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-[1.25rem] leading-[1.3] font-display font-medium text-[#2B1218]">
                  Delete Account Permanently?
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#5E4A4D] leading-relaxed">
                Are you sure? This will permanently delete your account and all data from the backend.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6ECF5]">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-medium transition-colors cursor-pointer"
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
      </PopUpItem>
    </PopUpContainer>
  );
};
