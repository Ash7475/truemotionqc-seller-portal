import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  X,
  CheckCircle2,
  MailCheck,
  ShieldCheck,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SellerProfile } from '../../types';
import { TrueMotionQCLogo } from '../common/TrueMotionQCLogo';
import heroBurgundyHorology from '../../assets/images/hero_burgundy_horology.jpg';

interface LoginViewProps {
  onOpenRegister?: () => void;
}

const luxuryEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const LoginView: React.FC<LoginViewProps> = () => {
  const { verifyCredentials, createAccount, login, loginDemoSeller, verifyLoginOtp, resendLoginOtp } = useApp();

  const [authStep, setAuthStep] = useState<'login' | 'otp'>('login');
  const [pendingSeller, setPendingSeller] = useState<SellerProfile | null>(null);
  const [devOtp, setDevOtp] = useState<string>('123456');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0'
  );

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [atelierName, setAtelierName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const triggerToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (authStep === 'otp') {
      const focusTimer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 220);
      return () => clearTimeout(focusTimer);
    }
  }, [authStep]);

  const switchAuthMode = (signUp: boolean, keepEmail = false) => {
    setErrorMessage('');
    setAuthStep('login');
    setPendingSeller(null);
    setOtpDigits(['', '', '', '', '', '']);
    setIsSignUpMode(signUp);
    if (!keepEmail) {
      setEmail('');
    }
    setAtelierName('');
    setPhone('');
    setPassword('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (isSignUpMode && !atelierName.trim()) {
      setErrorMessage('Please enter your Brand / Store Name.');
      return;
    }

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    if (isSignUpMode && !phone.trim()) {
      setErrorMessage('Please provide your phone number.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (isSignUpMode && cleanPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUpMode) {
        const result = await createAccount({
          atelierName,
          email: cleanEmail,
          phone,
          password: cleanPassword
        });
        if (!result.success && result.error) {
          setErrorMessage(result.error);
          return;
        }
        // Account created, session persisted in localStorage and setSeller updated.
        // App.tsx detects currentSeller with kyc_status 'UNSUBMITTED' and routes directly to KYC Onboarding.
        return;
      }

      const check = await verifyCredentials(cleanEmail, cleanPassword);
      if (!check.success || !check.user) {
        setErrorMessage(check.error || 'Unable to verify credentials.');
        return;
      }

      setPendingSeller(check.user);
      if (check.devOtp) {
        setDevOtp(check.devOtp);
      }
      setOtpDigits(['', '', '', '', '', '']);
      setAuthStep('otp');
      triggerToast(`Verification code sent to ${cleanEmail}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    setErrorMessage('');
    const digits = rawValue.replace(/\D/g, '');

    if (digits.length > 1) {
      const next = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (index + i < 6 && digits[i]) {
          next[index + i] = digits[i];
        }
      }
      setOtpDigits(next);
      const nextFocusIndex = Math.min(5, index + digits.length);
      otpInputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digits;
    setOtpDigits(next);

    if (digits && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    setErrorMessage('');
    otpInputRefs.current[Math.min(5, pasted.length)]?.focus();
  };

  const otpCode = otpDigits.join('');
  const isOtpComplete = /^\d{6}$/.test(otpCode);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isOtpComplete) {
      setErrorMessage('Please enter the complete 6-digit verification code sent to your email.');
      return;
    }

    if (!pendingSeller) {
      setAuthStep('login');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyLoginOtp(otpCode, pendingSeller.email, pendingSeller.id);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid or expired 6-digit OTP code.');
        return;
      }

      // Step 3 (Post-OTP Routing): Save verified session and route strictly by kyc_status
      login(res.user?.id || pendingSeller.id, res.user || pendingSeller);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingSeller || isResending) return;
    setErrorMessage('');
    setIsResending(true);
    try {
      const res = await resendLoginOtp(pendingSeller.email, pendingSeller.id);
      if (res.success) {
        if (res.devOtp) setDevOtp(res.devOtp);
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
        triggerToast(`Fresh verification code sent to ${pendingSeller.email}`);
      } else {
        setErrorMessage(res.error || 'Failed to resend verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F8FE] bg-canvas-grid flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#0A22B8]/15 selection:text-[#0A22B8] relative">
      {/* Royal Cobalt OTP Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: luxuryEase }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0A22B8] text-white border border-white/20 shadow-xl text-xs font-semibold"
          >
            <MailCheck className="w-4 h-4 text-[#93C5FD] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: 46% Width, Royal Cobalt Blue Gradient Showcase */}
      <div className="w-full lg:w-[46%] bg-gradient-to-br from-[#0D2CD4] via-[#0A22B8] to-[#071991] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 border-b lg:border-b-0 lg:border-r border-[#E6ECF5] relative shrink-0 overflow-hidden shadow-2xl">
        {/* Subtle ice blue ambient radial glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(234, 240, 255, 0.45) 0%, rgba(10, 34, 184, 0) 70%)',
          }}
        />

        <div className="relative z-10 space-y-8">
          {/* Top Brand Lockup */}
          <div className="flex items-center">
            <TrueMotionQCLogo variant="dark" showTagline={true} size="lg" />
          </div>

          {/* Editorial Headline */}
          <div className="space-y-3.5 max-w-lg">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#93C5FD] flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#93C5FD]" />
              <span>THE SELLER ATELIER</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[48px] leading-[1.08] text-white tracking-tight font-normal">
              Your business,
              <br />
              presented
              <br />
              beautifully.
            </h1>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-md pt-1">
              Manage authenticated watches, tailored apparel, and fine leathercraft with TMQC zero-hub provenance and insured escrow settlement.
            </p>
          </div>

          {/* Flat-Lay Showcase (desktop) */}
          <div className="hidden lg:block relative max-w-lg">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-[#071991]/50 shadow-2xl group">
              <div className="aspect-[16/10] w-full overflow-hidden relative">
                <img
                  src={heroBurgundyHorology}
                  alt="Luxury rose-gold mechanical chronograph"
                  className="w-full h-full object-cover object-center transform group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071991]/80 via-transparent to-transparent" />
              </div>

              {/* Asset Caption Overlay */}
              <div className="absolute bottom-3 left-3 right-3 px-3.5 py-2.5 rounded-xl bg-[#0B1A4B]/85 backdrop-blur-md border border-white/15 flex items-center justify-between text-[11px]">
                <span className="text-white font-medium truncate">
                  LOT SKU-9426009 · Chronomètre Horology 40mm
                </span>
                <span className="text-[10px] font-bold text-white bg-[#0A22B8] px-2.5 py-0.5 rounded-full shrink-0 ml-2">
                  TMQC Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 pt-7 mt-8 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-white/70">
          <span>Watches · Tailored Apparel · Fine Craft</span>
          <span>Authorized merchant access</span>
        </div>
      </div>

      {/* RIGHT COLUMN: 54% Width, Pale Cool-White #F5F8FE Grid */}
      <div className="w-full lg:w-[54%] bg-[#F5F8FE] bg-canvas-grid text-[#0F172A] flex flex-col justify-between min-h-screen">
        {/* Top Header Strip */}
        <div className="h-20 px-6 sm:px-10 bg-white border-b border-[#E6ECF5] flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-[#64748B] font-medium">Workspace</span>
            <span className="text-[#CBD5E1] font-light">/</span>
            <span className="text-[#0F172A] font-semibold">
              {authStep === 'otp'
                ? 'Security Verification'
                : isSignUpMode
                ? 'Create Account'
                : 'Sign In'}
            </span>
          </div>

          <span className="text-xs font-semibold text-[#0A22B8] bg-[#EAF0FF] px-3 py-1 rounded-full border border-[#CBD5E1]/60">
            Seller Atelier
          </span>
        </div>

        {/* Central White Form Card */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="max-w-md w-full bg-white border border-[#E6ECF5] rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(10,34,184,0.04)] overflow-hidden">
            <AnimatePresence mode="wait">
              {authStep === 'login' ? (
                <motion.div
                  key="auth-step-login"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: luxuryEase }}
                  className="space-y-5"
                >
                  {/* Segmented Tab Switcher */}
                  <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 grid grid-cols-2 gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => switchAuthMode(false)}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        !isSignUpMode
                          ? 'bg-white text-[#0A22B8] font-bold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A] font-medium'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => switchAuthMode(true)}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        isSignUpMode
                          ? 'bg-white text-[#0A22B8] font-bold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A] font-medium'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Greeting */}
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-[28px] leading-[1.2] font-display font-normal text-[#0F172A]">
                      {isSignUpMode ? 'Create your atelier.' : 'Welcome back.'}
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#64748B]">
                      {isSignUpMode
                        ? 'Open your independent TrueMotion QC Seller Atelier account.'
                        : 'Sign in to access your TrueMotion QC Seller Atelier workspace.'}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                          <span className="break-words leading-tight font-medium">{errorMessage}</span>
                        </div>
                        {isSignUpMode && (errorMessage.includes('already registered') || errorMessage.includes('sign in instead')) && (
                          <button
                            type="button"
                            onClick={() => switchAuthMode(false, true)}
                            className="shrink-0 px-2.5 py-1 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Sign In →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Brand / Store Name (Sign Up Only) */}
                    {isSignUpMode && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#334155]">
                          Brand / Store Name
                        </label>
                        <input
                          type="text"
                          value={atelierName}
                          onChange={(e) => setAtelierName(e.target.value)}
                          placeholder="e.g. Dubois Horology Atelier"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#0A22B8] focus:border-[#0A22B8] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A22B8]/15 transition-all"
                          required
                        />
                      </div>
                    )}

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#334155]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="founder@youratelier.com"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#0A22B8] focus:border-[#0A22B8] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A22B8]/15 transition-all"
                        required
                      />
                    </div>

                    {/* Phone Number (Sign Up Only) */}
                    {isSignUpMode && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#334155]">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#0A22B8] focus:border-[#0A22B8] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A22B8]/15 transition-all"
                          required
                        />
                      </div>
                    )}

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-[#334155]">
                          Password
                        </label>
                        {!isSignUpMode && (
                          <button
                            type="button"
                            onClick={() => setShowForgotModal(true)}
                            className="text-xs text-[#0A22B8] hover:underline font-semibold cursor-pointer transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isSignUpMode ? 'Create a secure passkey' : 'Enter security passkey'}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#0A22B8] focus:border-[#0A22B8] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A22B8]/15 transition-all pr-14"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] px-1 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me Checkbox (Sign In Only) */}
                    {!isSignUpMode && (
                      <div className="flex items-center justify-between pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-[#475569] select-none">
                          <input
                            type="checkbox"
                            checked={rememberSession}
                            onChange={(e) => setRememberSession(e.target.checked)}
                            className="w-4 h-4 rounded border-[#CBD5E1] text-[#0A22B8] focus:ring-[#0A22B8] cursor-pointer"
                          />
                          <span>Keep my atelier session signed in</span>
                        </label>
                      </div>
                    )}

                    {/* Primary Royal Cobalt CTA Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-5 bg-[#0A22B8] hover:bg-[#081B9A] disabled:opacity-70 text-white font-semibold text-xs tracking-wide rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {isSubmitting ? (
                        <span>{isSignUpMode ? 'Creating atelier...' : 'Sending verification code...'}</span>
                      ) : (
                        <>
                          <span>{isSignUpMode ? 'Create Atelier Account' : 'Sign In to Workspace'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch between Sign In and Sign Up */}
                  <div className="pt-4 border-t border-[#F1F5F9] text-center">
                    <button
                      type="button"
                      onClick={() => switchAuthMode(!isSignUpMode)}
                      className="text-xs text-[#475569] hover:text-[#0A22B8] font-semibold hover:underline cursor-pointer transition-colors block mx-auto"
                    >
                      {isSignUpMode
                        ? 'Already have an atelier? Sign in.'
                        : "New to TrueMotion QC? Create a seller account."}
                    </button>
                  </div>

                  {/* Demo Seller Mode Option */}
                  <div className="pt-3 border-t border-[#F1F5F9] space-y-2">
                    <div className="flex items-center gap-2 my-1.5">
                      <div className="flex-1 h-px bg-[#E2E8F0]" />
                      <span className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider">
                        Explore Portal
                      </span>
                      <div className="flex-1 h-px bg-[#E2E8F0]" />
                    </div>

                    <button
                      type="button"
                      onClick={() => loginDemoSeller()}
                      className="w-full py-2.5 px-4 bg-[#F8FAFC] hover:bg-[#EAF0FF] border border-[#CBD5E1] hover:border-[#0A22B8] text-[#0A22B8] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <Sparkles className="w-4 h-4 text-[#0A22B8] group-hover:scale-110 transition-transform" />
                      <span>Demo Seller Login (Ashwin Demo Atelier)</span>
                    </button>
                    <p className="text-[11px] text-center text-[#64748B] leading-tight">
                      Instant access with multi-state watches, apparel, accessories &amp; verified escrow data.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="auth-step-otp"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: luxuryEase }}
                  className="space-y-5"
                >
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF0FF] border border-[#BFDBFE] text-[#0A22B8] text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Two-Factor Verification</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                      Verify your Atelier.
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#64748B] leading-relaxed">
                      Enter the 6-digit verification code sent to{' '}
                      <span className="text-[#0F172A] font-semibold">{pendingSeller?.email || email}</span>
                    </p>
                  </div>

                  {/* OTP Form */}
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                          <span className="break-words leading-tight font-medium">{errorMessage}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-[11px] uppercase tracking-wider text-[#64748B] font-bold">
                        6-Digit Security Code
                      </label>
                      <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                        {otpDigits.map((digit, index) => (
                          <input
                            key={`otp-digit-${index}`}
                            ref={(el) => {
                              otpInputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            aria-label={`Verification digit ${index + 1}`}
                            className="w-full h-12 sm:h-13 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0A22B8] focus:bg-white rounded-xl text-center text-lg font-bold text-[#0F172A] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0A22B8]/20 transition-all"
                          />
                        ))}
                      </div>

                      {/* Dev Mode Preview Pill */}
                      {isLocalhost && devOtp && (
                        <div className="mt-3 p-3 rounded-xl bg-[#EAF0FF] border border-[#CBD5E1] text-[#0A22B8] text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Lock className="w-3.5 h-3.5 text-[#0A22B8] shrink-0" />
                            <span>Dev OTP: <strong className="font-mono text-[#0A22B8] tracking-widest font-bold">{devOtp}</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const digits = devOtp.split('').slice(0, 6);
                              setOtpDigits(digits);
                              setErrorMessage('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0A22B8] hover:bg-[#081B9A] text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !isOtpComplete}
                      className="w-full py-3 px-5 bg-[#0A22B8] hover:bg-[#081B9A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wide rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Verifying code...</span>
                      ) : (
                        <>
                          <span>Verify &amp; Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Resend & Back Links */}
                  <div className="text-center pt-3 border-t border-[#F1F5F9] space-y-2">
                    <div>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isResending}
                        className="text-xs text-[#0A22B8] hover:underline disabled:opacity-60 font-semibold cursor-pointer transition-colors"
                      >
                        {isResending ? 'Resending code...' : "Didn't receive a code? Resend"}
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setAuthStep('login');
                          setPendingSeller(null);
                          setOtpDigits(['', '', '', '', '', '']);
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B] hover:text-[#0F172A] font-semibold cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Use a different atelier email</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-10 py-4 border-t border-[#E6ECF5] bg-white flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="font-semibold text-[#0F172A]">TrueMotion QC</span>
          <span>TMQC Authenticated Seller Portal</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#E6ECF5] rounded-2xl p-6 shadow-2xl relative space-y-4 text-[#0F172A]">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess(false);
              }}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#EAF0FF] text-[#0A22B8]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Reset Atelier Passkey</h3>
                <p className="text-xs text-[#64748B]">Encrypted account recovery</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#0A22B8]">
                  <CheckCircle2 className="w-4 h-4 text-[#0A22B8]" />
                  <span>Recovery Instructions Dispatched</span>
                </div>
                <p className="text-[#475569] text-[11px] leading-relaxed">
                  A secure passkey reset link has been routed to <strong>{forgotEmail}</strong>. Please check your inbox and return to sign in.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="mt-2 w-full py-2.5 bg-[#0A22B8] hover:bg-[#081B9A] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSuccess(true);
                }}
                className="space-y-3"
              >
                <p className="text-xs text-[#64748B]">
                  Enter your registered atelier email address to receive account recovery instructions.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="founder@youratelier.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] focus:border-[#0A22B8] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A22B8]/15"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0A22B8] hover:bg-[#081B9A] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Send Recovery Instructions
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
