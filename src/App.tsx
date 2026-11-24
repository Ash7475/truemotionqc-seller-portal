import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { ApplicationStatusView } from './components/auth/ApplicationStatusView';
import { SellerOnboardingWizard } from './components/onboarding/SellerOnboardingWizard';
import { LoginSplashTransition } from './components/auth/LoginSplashTransition';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ProductsView } from './components/products/ProductsView';
import { AddProductWizard } from './components/products/AddProductWizard';
import { InventoryView } from './components/inventory/InventoryView';
import { VerificationView } from './components/verification/VerificationView';
import { OrdersView } from './components/orders/OrdersView';
import { EarningsView } from './components/earnings/EarningsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReportsView } from './components/reports/ReportsView';
import { ProfileAndSecurityView } from './components/profile/ProfileAndSecurityView';

const luxuryEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const MainAppContent: React.FC = () => {
  const { 
    isLoggedIn, 
    isVerifyingSession,
    currentSeller,
    awaitingOtp,
    activeSection, 
    setActiveSection,
    openAddProductWizard, 
    setOpenAddProductWizard
  } = useApp();

  const [showLoginSplash, setShowLoginSplash] = useState<boolean>(false);
  const [isResubmittingKyc, setIsResubmittingKyc] = useState<boolean>(false);
  const wasLoggedInRef = useRef<boolean>(isLoggedIn);
  const shouldReduceMotion = useReducedMotion();

  // Redirect to dashboard if activeSection is somehow 'support'
  useEffect(() => {
    if ((activeSection as string) === 'support') {
      setActiveSection('dashboard');
    }
  }, [activeSection, setActiveSection]);

  // Trigger cinematic splash overlay when user signs in
  useEffect(() => {
    if (!wasLoggedInRef.current && isLoggedIn) {
      setShowLoginSplash(true);
    }
    wasLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  // If verifying saved session from Supabase on app load, show clean loading state
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-[#2B1218]">
        <div className="w-9 h-9 border-2 border-[#C4A46B] border-t-[#3A101C] rounded-full animate-spin mb-3.5" />
        <p className="font-serif text-sm text-[#4E383B] tracking-wide">Authenticating Atelier Credentials...</p>
      </div>
    );
  }

  // Hard-Gated 4-Way Render Lock (Zero Bypass):
  // 1. If !isLoggedIn || !currentSeller || awaitingOtp: Render ONLY Auth screen (LoginView)
  // 2. If seller.kyc_status === 'NOT_SUBMITTED': Render ONLY 3-Step KYC Onboarding Wizard (SellerOnboardingWizard)
  // 3. If seller.kyc_status === 'UNDER_REVIEW' or 'REJECTED': Render ONLY Admin Approval Waiting / Rejection Screen (ApplicationStatusView)
  //    (if isResubmittingKyc === true when REJECTED, render Onboarding Wizard)
  // 4. ONLY IF seller.kyc_status === 'VERIFIED': Render main Seller Dashboard (workstation)
  const rawKyc = (currentSeller as any)?.kyc_status || currentSeller?.kycStatus || (currentSeller as any)?.verification_status || currentSeller?.verificationStatus;
  const normKyc = String(rawKyc || 'NOT_SUBMITTED').trim().toUpperCase();

  let currentStage: 'login' | 'onboarding' | 'pending_approval' | 'workstation' = 'login';

  if (!isLoggedIn || !currentSeller || awaitingOtp) {
    currentStage = 'login';
  } else if (normKyc === 'VERIFIED') {
    currentStage = 'workstation';
  } else if (normKyc === 'UNDER_REVIEW' || normKyc === 'PENDING_APPROVAL' || normKyc === 'PENDING_VERIFICATION') {
    currentStage = 'pending_approval';
  } else if (normKyc === 'REJECTED') {
    currentStage = isResubmittingKyc ? 'onboarding' : 'pending_approval';
  } else {
    // Strictly 'NOT_SUBMITTED' (or any unrecognized status) -> forced into 3-Step KYC Onboarding
    currentStage = 'onboarding';
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B1218] overflow-x-hidden selection:bg-[#3A101C]/15 selection:text-[#3A101C] relative">
      {/* Cinematic Post-Login Splash Transition */}
      <AnimatePresence>
        {showLoginSplash && (
          <LoginSplashTransition onComplete={() => setShowLoginSplash(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentStage === 'login' && (
          <motion.div
            key="login"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: 6 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -6 }}
            transition={{ duration: 0.3, ease: luxuryEase }}
            className="w-full min-h-screen"
          >
            <LoginView />
          </motion.div>
        )}

        {currentStage === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: 6 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -6 }}
            transition={{ duration: 0.3, ease: luxuryEase }}
            className="w-full min-h-screen"
          >
            <SellerOnboardingWizard
              onSubmitted={() => setIsResubmittingKyc(false)}
            />
          </motion.div>
        )}

        {currentStage === 'pending_approval' && (
          <motion.div
            key="pending_approval"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: 6 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -6 }}
            transition={{ duration: 0.3, ease: luxuryEase }}
            className="w-full min-h-screen"
          >
            <ApplicationStatusView
              onEditAndResubmit={() => setIsResubmittingKyc(true)}
            />
          </motion.div>
        )}

        {currentStage === 'workstation' && (
          <motion.div
            key={showLoginSplash ? 'workstation-splash-hold' : 'workstation-reveal'}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: 6 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -6 }}
            transition={{ duration: 0.32, ease: luxuryEase }}
            className="h-screen w-full overflow-hidden flex bg-[#F5F8FE] bg-canvas-grid relative"
          >
            {/* Collapsible Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 h-full flex flex-col min-w-0 overflow-y-auto bg-[#F5F8FE] bg-canvas-grid">
              <Navbar />

              <main className="flex-1 p-5 sm:p-6 lg:p-7 max-w-[1380px] w-full mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.28, ease: luxuryEase }}
                    className="w-full"
                  >
                    {activeSection === 'dashboard' && <DashboardOverview isReady={!showLoginSplash} />}
                    {activeSection === 'products' && <ProductsView />}
                    {activeSection === 'add-product' && (
                      <AddProductWizard onClose={() => setActiveSection('products')} />
                    )}
                    {activeSection === 'inventory' && <InventoryView />}
                    {activeSection === 'verification' && <VerificationView />}
                    {activeSection === 'orders' && <OrdersView />}
                    {activeSection === 'earnings' && <EarningsView />}
                    {activeSection === 'analytics' && <AnalyticsView />}
                    {activeSection === 'reports' && <ReportsView />}
                    {(activeSection === 'profile' || activeSection === 'security' || activeSection === 'activity' || activeSection === 'settings') && (
                      <ProfileAndSecurityView />
                    )}
                    {/* Fallback to Overview for unknown or unhandled section */}
                    {!['products', 'add-product', 'inventory', 'verification', 'orders', 'earnings', 'analytics', 'reports', 'profile', 'security', 'activity', 'settings'].includes(activeSection as string) && activeSection !== 'dashboard' && (
                      <DashboardOverview isReady={!showLoginSplash} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dedicated Full-Screen Add Product Wizard */}
      <AnimatePresence>
        {openAddProductWizard && activeSection !== 'add-product' && (
          <AddProductWizard onClose={() => setOpenAddProductWizard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
