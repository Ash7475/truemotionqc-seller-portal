import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Plus,
  Store,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SellerOnboardingGuide } from './SellerOnboardingGuide';
import { normalizeOrder } from '../../utils/supabaseNormalizer';

interface DashboardOverviewProps {
  isReady?: boolean;
}

const luxuryEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DashboardOverview: React.FC<DashboardOverviewProps> = () => {
  const {
    currentSeller,
    products,
    orders,
    withdrawals,
    financialSummary,
    setActiveSection,
    setOpenAddProductWizard,
  } = useApp();

  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedRange, setSelectedRange] = useState<'5 Months' | '12 Months'>('5 Months');
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);
  const [showRangeDropdown, setShowRangeDropdown] = useState<boolean>(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [avatarImgError, setAvatarImgError] = useState<boolean>(false);

  const shouldReduceMotion = useReducedMotion();
  const activeUserId = currentSeller?.id ?? null;

  // Seller identity details
  const firstName = currentSeller?.fullName
    ? currentSeller.fullName.split(' ')[0]
    : currentSeller?.sellerName?.split(' ')[0] || currentSeller?.storeName?.split(' ')[0] || 'Atelier';

  const storeName = currentSeller?.store_name || currentSeller?.storeName || currentSeller?.sellerName || 'Seller Atelier';
  const ownerName = currentSeller?.owner_name || currentSeller?.fullName || '';

  // Clean Store Initials Fallback (e.g. "AA")
  const storeInitials = useMemo(() => {
    const parts = (storeName || 'Atelier').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0] || 'AT').slice(0, 2).toUpperCase();
  }, [storeName]);

  // Real join year from Supabase
  const joinYear = useMemo(() => {
    const joinDate = currentSeller?.created_at || currentSeller?.createdAt || currentSeller?.submittedAt || currentSeller?.memberSince;
    return joinDate ? new Date(joinDate).getFullYear() : new Date().getFullYear();
  }, [currentSeller]);

  // Real rating & reviews from Supabase sellers table
  const sellerRating = useMemo(() => {
    if (currentSeller?.rating && Number(currentSeller.rating) > 0) {
      return Number(currentSeller.rating).toFixed(1);
    }
    return 'New';
  }, [currentSeller?.rating]);

  const reviewCount = useMemo(() => {
    return currentSeller?.reviewCount ?? currentSeller?.reviews_count ?? 0;
  }, [currentSeller?.reviewCount, currentSeller?.reviews_count]);

  // Check if seller has custom avatar (excluding mock asset paths)
  const isRealAvatar = useMemo(() => {
    if (avatarImgError) return false;
    const rawUrl = currentSeller?.avatar_url || currentSeller?.avatarUrl || currentSeller?.selfie_url || currentSeller?.selfieUrl;
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    const isMock =
      rawUrl.includes('watch_macro_dial_crown') ||
      rawUrl.includes('seller_avatar_portrait') ||
      rawUrl.includes('watch_vintage') ||
      rawUrl.includes('product_chronograph');
    return !isMock && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:image/'));
  }, [currentSeller, avatarImgError]);

  const sellerAvatarUrl = currentSeller?.avatar_url || currentSeller?.avatarUrl || currentSeller?.selfie_url || currentSeller?.selfieUrl || '';

  // 1. Live seller orders strictly for activeUserId
  const sellerOrders = useMemo(() => {
    if (!orders || orders.length === 0 || !activeUserId) return [];
    const normalized = orders.map(normalizeOrder);
    return normalized.filter((o) => o.sellerId === activeUserId || o.seller_id === activeUserId);
  }, [orders, activeUserId]);

  // 2. Delivered QC Verified Orders
  const qcVerifiedOrders = useMemo(() => {
    return sellerOrders.filter((o) => {
      const s = String(o.status || '').trim().toUpperCase();
      return s === 'DELIVERED';
    });
  }, [sellerOrders]);

  // Real total sold items count
  const totalDeliveredOrders = qcVerifiedOrders.length;

  // 3. Live seller withdrawals for activeUserId
  const sellerWithdrawals = useMemo(() => {
    if (!withdrawals || withdrawals.length === 0 || !activeUserId) return [];
    return withdrawals.filter((w) => w.sellerId === activeUserId);
  }, [withdrawals, activeUserId]);

  // 4. KPI 1: Daily Revenue (Today) vs Total Verified Revenue
  const { displayRevenue, revenueLabel, isDailyToday } = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayOrders = sellerOrders.filter((o) => {
      const d = o.createdAt || o.orderDate || o.created_at;
      return d && new Date(d).toDateString() === todayStr;
    });

    const todaySum = todayOrders.reduce(
      (acc, o) => acc + (Number(o.totalAmount) || Number(o.amount) || Number(o.price) || 0),
      0
    );

    if (todaySum > 0) {
      return {
        displayRevenue: todaySum,
        revenueLabel: 'Daily revenue',
        isDailyToday: true,
      };
    }

    // If daily revenue = 0, check total verified revenue
    const totalDelivered = qcVerifiedOrders.reduce(
      (acc, o) => acc + (Number(o.totalAmount) || Number(o.amount) || Number(o.price) || 0),
      0
    );
    const verifiedSum = financialSummary?.totalRevenue && financialSummary.totalRevenue > 0
      ? financialSummary.totalRevenue
      : totalDelivered;

    if (verifiedSum > 0) {
      return {
        displayRevenue: verifiedSum,
        revenueLabel: 'Total verified revenue',
        isDailyToday: false,
      };
    }

    return {
      displayRevenue: 0,
      revenueLabel: 'Daily revenue',
      isDailyToday: false,
    };
  }, [sellerOrders, qcVerifiedOrders, financialSummary]);

  // 5. Month-over-Month Real Delta Calculation
  const { revenueDeltaText, hasRevenueDelta, isRevenueUp } = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
    const prevYear = curMonth === 0 ? curYear - 1 : curYear;

    let curTotal = 0;
    let prevTotal = 0;

    sellerOrders.forEach((o) => {
      const dStr = o.createdAt || o.orderDate || o.created_at;
      if (!dStr) return;
      const d = new Date(dStr);
      const val = Number(o.totalAmount || o.amount || o.price || 0);
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        curTotal += val;
      } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        prevTotal += val;
      }
    });

    if (prevTotal > 0) {
      const pct = ((curTotal - prevTotal) / prevTotal) * 100;
      const isUp = pct >= 0;
      return {
        revenueDeltaText: `${isUp ? '↑' : '↓'} ${Math.abs(Math.round(pct))}%`,
        hasRevenueDelta: true,
        isRevenueUp: isUp,
      };
    }

    if (curTotal > 0) {
      return {
        revenueDeltaText: 'New',
        hasRevenueDelta: true,
        isRevenueUp: true,
      };
    }

    return {
      revenueDeltaText: '0%',
      hasRevenueDelta: false,
      isRevenueUp: true,
    };
  }, [sellerOrders]);

  // 6. KPI 2: Active Listings Count from live products for activeUserId
  const activeProductsCount = useMemo(() => {
    if (!products || products.length === 0 || !activeUserId) return 0;
    const sellerProductList = products.filter(
      (p) => p.sellerId === activeUserId || p.seller_id === activeUserId
    );
    return sellerProductList.filter((p) => {
      const st = String(p.status || '').trim().toUpperCase();
      return st === 'ACTIVE' || st === 'PUBLISHED';
    }).length;
  }, [products, activeUserId]);

  // 7. KPI 3: Escrow Ready Balance
  const escrowReady = useMemo(() => {
    if (financialSummary?.availableBalance && financialSummary.availableBalance > 0) {
      return financialSummary.availableBalance;
    }
    if (financialSummary?.escrowBalance && financialSummary.escrowBalance > 0) {
      return financialSummary.escrowBalance;
    }
    const readyOrders = sellerOrders.filter((o) => {
      const s = String(o.status || '').trim().toUpperCase();
      return s === 'DELIVERED' || s === 'QC_VERIFIED' || o.escrowStatus === 'released';
    });
    return readyOrders.reduce(
      (acc, o) => acc + (Number(o.totalAmount) || Number(o.amount) || Number(o.price) || 0),
      0
    );
  }, [financialSummary, sellerOrders]);

  // 8. Revenue Bar Chart: Grouped Real Monthly Aggregates (Gross In vs Settled Out)
  const chartMonths = useMemo(() => {
    const fullMonths = [
      { name: 'Jan', fullName: 'January', index: 0 },
      { name: 'Feb', fullName: 'February', index: 1 },
      { name: 'Mar', fullName: 'March', index: 2 },
      { name: 'Apr', fullName: 'April', index: 3 },
      { name: 'May', fullName: 'May', index: 4 },
      { name: 'Jun', fullName: 'June', index: 5 },
      { name: 'Jul', fullName: 'July', index: 6 },
      { name: 'Aug', fullName: 'August', index: 7 },
      { name: 'Sep', fullName: 'September', index: 8 },
      { name: 'Oct', fullName: 'October', index: 9 },
      { name: 'Nov', fullName: 'November', index: 10 },
      { name: 'Dec', fullName: 'December', index: 11 },
    ];

    // For 5 Months: show a 5-month window (May to Sep default, or last 5 months of the selected year)
    const activeRange = selectedRange === '5 Months' ? fullMonths.slice(4, 9) : fullMonths;

    return activeRange.map((m) => {
      // Real Gross In: Sum of confirmed orders in that month & year
      const inVal = sellerOrders.reduce((sum, o) => {
        const dStr = o.createdAt || o.orderDate || o.created_at;
        if (!dStr) return sum;
        const d = new Date(dStr);
        if (d.getFullYear() === selectedYear && d.getMonth() === m.index) {
          return sum + (Number(o.totalAmount) || Number(o.amount) || Number(o.price) || 0);
        }
        return sum;
      }, 0);

      // Real Settled Out: Sum of settled withdrawals/payouts in that month & year
      const outVal = sellerWithdrawals.reduce((sum, w) => {
        if (!w.timestamp) return sum;
        const d = new Date(w.timestamp);
        if (d.getFullYear() === selectedYear && d.getMonth() === m.index && w.status === 'settled') {
          return sum + (Number(w.amount) || 0);
        }
        return sum;
      }, 0);

      return {
        month: m.name,
        fullName: m.fullName,
        index: m.index,
        inVal,
        outVal,
      };
    });
  }, [selectedRange, selectedYear, sellerOrders, sellerWithdrawals]);

  // Compute dynamic chart scale ceiling based on real transaction maximum
  const { chartCeiling, yAxisLabels } = useMemo(() => {
    const maxVal = Math.max(0, ...chartMonths.map((m) => Math.max(m.inVal, m.outVal)));
    // If no transactions yet, default scale ceiling to 5,000 for standard guidelines
    const ceiling = maxVal > 0 ? Math.ceil(maxVal * 1.25 / 1000) * 1000 : 5000;

    const labels = [
      `₹${(ceiling / 1000).toFixed(0)}K`,
      `₹${((ceiling * 0.8) / 1000).toFixed(0)}K`,
      `₹${((ceiling * 0.6) / 1000).toFixed(0)}K`,
      `₹${((ceiling * 0.4) / 1000).toFixed(0)}K`,
      `₹${((ceiling * 0.2) / 1000).toFixed(0)}K`,
      '₹0',
    ];

    return { chartCeiling: ceiling, yAxisLabels: labels };
  }, [chartMonths]);

  // Format INR nicely with standard Indian notation
  const formatINR = (val: number) => {
    return Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP SPLIT WELCOME BANNER (Matching Mockup) */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: luxuryEase }}
        className="w-full rounded-2xl overflow-hidden border border-[#E6ECF5] bg-white shadow-xs grid grid-cols-1 lg:grid-cols-12 min-h-[220px]"
      >
        {/* Left Side: Dynamic Welcome, Subtitle & 3 Action Buttons */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[#FAF9F6] lg:bg-[#FAF9F6]/60">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] text-[#0F172A] font-normal leading-tight">
            Welcome back, {firstName}.
          </h1>
          <p className="text-[#64748B] text-sm sm:text-base mt-2 mb-6 font-normal">
            Your business, presented beautifully.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {/* 1. + Add Product */}
            <button
              type="button"
              onClick={() => setOpenAddProductWizard(true)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#0A22B8] hover:bg-[#081B9A] text-white font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>

            {/* 2. View Store */}
            <button
              type="button"
              onClick={() => setActiveSection('products')}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-white border border-[#DDE5F2] hover:bg-[#F8FAFC] text-[#0F172A] font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Store className="w-4 h-4 text-[#64748B]" />
              <span>View Store</span>
            </button>

            {/* 3. Seller Guide */}
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#DCE5F2]/80 hover:bg-[#DCE5F2] text-[#0A22B8] font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <BookOpen className="w-4 h-4" />
              <span>Seller Guide</span>
            </button>
          </div>
        </div>

        {/* Right Side: High-res Watchmaker Desk Hero Banner Image */}
        <div className="lg:col-span-5 h-48 sm:h-56 lg:h-full relative overflow-hidden bg-[#2C0A14]">
          <img
            src="/images/hero_burgundy_horology.jpg"
            alt="Artisanal Timepiece Atelier"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.src = '/images/watch_hero_natural_surface_1794924992907.jpg';
            }}
          />
        </div>
      </motion.div>

      {/* 2. SECTION HEADING (Script Display Font) */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-[34px] text-[#0F172A] font-normal leading-none mt-8 mb-4">
          Business Statistics
        </h2>
      </div>

      {/* 3. MAIN DASHBOARD GRID (Left ~72% / Right ~28%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Top 3 Sparkline Cards + Bottom Revenue Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Top Row: 3 Equal KPI Sparkline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* KPI 1: Daily Revenue */}
            <div className="bg-white rounded-2xl border border-[#E6ECF5] p-5 shadow-xs flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
              <div>
                <span className="text-[13px] font-medium text-[#64748B] block truncate">
                  {revenueLabel}
                </span>
                <div className="text-2xl sm:text-[28px] font-bold text-[#0B1A4B] mt-1 tracking-tight font-sans tabular-nums">
                  ₹{formatINR(displayRevenue)}
                </div>
                <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#0A22B8] bg-[#EAF0FF] px-2 py-0.5 rounded-full">
                  <span>{revenueDeltaText}</span>
                  <span className="text-[#64748B] font-normal ml-0.5">
                    {hasRevenueDelta ? (isRevenueUp ? 'Last Month' : 'Decrease') : (isDailyToday ? 'Today' : 'No prior data')}
                  </span>
                </div>
              </div>

              {/* Blue Area Sparkline (Dynamic baseline when 0 / new) */}
              <div className="w-full h-14 mt-2">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blueSparkline1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0A22B8" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0A22B8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {hasRevenueDelta && displayRevenue > 0 ? (
                    <>
                      <path
                        d="M 0 32 Q 20 28, 40 22 T 70 16 T 100 10 L 100 40 L 0 40 Z"
                        fill="url(#blueSparkline1)"
                      />
                      <path
                        d="M 0 32 Q 20 28, 40 22 T 70 16 T 100 10"
                        fill="none"
                        stroke="#0A22B8"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </>
                  ) : (
                    <>
                      <path
                        d="M 0 35 L 100 35 L 100 40 L 0 40 Z"
                        fill="url(#blueSparkline1)"
                      />
                      <path
                        d="M 0 35 L 100 35"
                        fill="none"
                        stroke="#0A22B8"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeDasharray="3 3"
                      />
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* KPI 2: Active Listings (Center Solid Royal Cobalt Hero Card) */}
            <div className="bg-gradient-to-br from-[#0D2CD4] to-[#071991] rounded-2xl p-5 text-white shadow-md flex flex-col justify-between h-48 relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[13px] font-medium text-white/80">Active listings</span>
                <div className="text-3xl sm:text-[32px] font-bold text-white mt-1 tracking-tight font-sans tabular-nums">
                  {activeProductsCount}
                </div>
                <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                  <span>{activeProductsCount > 0 ? 'Active' : '0%'}</span>
                  <span className="text-white/80 font-normal ml-0.5">Live Published</span>
                </div>
              </div>

              {/* White Translucent Area Sparkline */}
              <div className="w-full h-14 mt-2 relative z-10">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="whiteSparkline2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {activeProductsCount > 0 ? (
                    <>
                      <path
                        d="M 0 32 Q 25 30, 50 20 T 75 16 T 100 12 L 100 40 L 0 40 Z"
                        fill="url(#whiteSparkline2)"
                      />
                      <path
                        d="M 0 32 Q 25 30, 50 20 T 75 16 T 100 12"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </>
                  ) : (
                    <>
                      <path
                        d="M 0 35 L 100 35 L 100 40 L 0 40 Z"
                        fill="url(#whiteSparkline2)"
                      />
                      <path
                        d="M 0 35 L 100 35"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeDasharray="3 3"
                      />
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* KPI 3: Escrow Ready */}
            <div className="bg-white rounded-2xl border border-[#E6ECF5] p-5 shadow-xs flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
              <div>
                <span className="text-[13px] font-medium text-[#64748B]">Escrow ready</span>
                <div className="text-2xl sm:text-[28px] font-bold text-[#0B1A4B] mt-1 tracking-tight font-sans tabular-nums">
                  ₹{formatINR(escrowReady)}
                </div>
                <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#0A22B8] bg-[#EAF0FF] px-2 py-0.5 rounded-full">
                  <span>{escrowReady > 0 ? 'Ready' : '0%'}</span>
                  <span className="text-[#64748B] font-normal ml-0.5">QC Cleared</span>
                </div>
              </div>

              {/* Blue Area Sparkline */}
              <div className="w-full h-14 mt-2">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blueSparkline3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0A22B8" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0A22B8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {escrowReady > 0 ? (
                    <>
                      <path
                        d="M 0 30 Q 30 25, 55 18 T 80 14 T 100 10 L 100 40 L 0 40 Z"
                        fill="url(#blueSparkline3)"
                      />
                      <path
                        d="M 0 30 Q 30 25, 55 18 T 80 14 T 100 10"
                        fill="none"
                        stroke="#0A22B8"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </>
                  ) : (
                    <>
                      <path
                        d="M 0 35 L 100 35 L 100 40 L 0 40 Z"
                        fill="url(#blueSparkline3)"
                      />
                      <path
                        d="M 0 35 L 100 35"
                        fill="none"
                        stroke="#0A22B8"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeDasharray="3 3"
                      />
                    </>
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Card: Revenue Grouped Bar Chart (In vs Out) */}
          <div className="bg-white rounded-2xl border border-[#E6ECF5] p-6 shadow-xs flex-1 flex flex-col justify-between relative">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Revenue</h3>

              <div className="flex items-center gap-2 relative">
                {/* Year Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowYearDropdown(!showYearDropdown);
                      setShowRangeDropdown(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] bg-[#F8FAFC] hover:bg-white transition-colors cursor-pointer"
                  >
                    <span>{selectedYear}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </button>
                  {showYearDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 z-30 min-w-[80px]">
                      {[2026, 2025, 2024].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            setSelectedYear(yr);
                            setShowYearDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            selectedYear === yr ? 'bg-[#EAF0FF] text-[#0A22B8]' : 'text-[#475569] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Range Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRangeDropdown(!showRangeDropdown);
                      setShowYearDropdown(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] bg-[#F8FAFC] hover:bg-white transition-colors cursor-pointer"
                  >
                    <span>{selectedRange}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </button>
                  {showRangeDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 z-30 min-w-[100px]">
                      {(['5 Months', '12 Months'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setSelectedRange(r);
                            setShowRangeDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            selectedRange === r ? 'bg-[#EAF0FF] text-[#0A22B8]' : 'text-[#475569] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart Area with Gridlines and Grouped Bars */}
            <div className="relative pt-6 pb-2">
              {/* Y-Axis Guidelines & Labels */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] font-mono text-[#94A3B8] pb-8">
                {yAxisLabels.map((lbl, i) => (
                  <div key={i} className="border-b border-[#F1F5F9] pb-1">
                    {lbl}
                  </div>
                ))}
              </div>

              {/* Grouped Bars Container */}
              <div className="relative h-56 flex items-end justify-between px-6 sm:px-10 pl-16 z-10">
                {chartMonths.map((item, idx) => {
                  const inHeight = Math.min(100, (item.inVal / chartCeiling) * 100);
                  const outHeight = Math.min(100, (item.outVal / chartCeiling) * 100);
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div
                      key={item.month}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className="flex flex-col items-center group cursor-pointer relative"
                    >
                      {/* Floating Tooltip matching hovered month */}
                      {isHovered && (
                        <div className="absolute -top-16 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2.5 text-xs text-[#0F172A] z-20 min-w-[130px] pointer-events-none">
                          <div className="font-bold text-[#0F172A] text-[11px] mb-1">
                            {item.fullName} {selectedYear}
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[10px]">
                            <span className="flex items-center gap-1.5 text-[#64748B]">
                              <span className="w-2 h-2 rounded-full bg-[#0A22B8]" />
                              In
                            </span>
                            <span className="font-bold font-mono">₹{formatINR(item.inVal)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[10px] mt-0.5">
                            <span className="flex items-center gap-1.5 text-[#64748B]">
                              <span className="w-2 h-2 rounded-full border border-[#0A22B8] bg-white" />
                              Out
                            </span>
                            <span className="font-bold font-mono">₹{formatINR(item.outVal)}</span>
                          </div>
                        </div>
                      )}

                      {/* Bar Pair */}
                      <div className="flex items-end gap-1.5 h-44">
                        {/* Bar: In (Diagonal Striped / Radial Dot) */}
                        <div
                          style={{ height: `${Math.max(inHeight, item.inVal > 0 ? 4 : 0)}%` }}
                          className="w-4 sm:w-5 rounded-t-sm border border-[#0A22B8] bg-[radial-gradient(#0A22B8_1px,transparent_1px)] [background-size:6px_6px] transition-all duration-300 group-hover:opacity-90"
                          title={`In: ₹${formatINR(item.inVal)}`}
                        />

                        {/* Bar: Out (Solid Cobalt) */}
                        <div
                          style={{ height: `${Math.max(outHeight, item.outVal > 0 ? 4 : 0)}%` }}
                          className="w-4 sm:w-5 rounded-t-sm bg-[#0A22B8] transition-all duration-300 group-hover:opacity-90"
                          title={`Out: ₹${formatINR(item.outVal)}`}
                        />
                      </div>

                      {/* Month Label */}
                      <span className="text-xs font-semibold text-[#64748B] mt-2 group-hover:text-[#0A22B8] transition-colors">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#F8FAFC]">
                <div className="flex items-center gap-2 text-xs font-medium text-[#475569]">
                  <span className="w-3.5 h-3.5 rounded-xs border border-[#0A22B8] bg-[radial-gradient(#0A22B8_1px,transparent_1px)] [background-size:4px_4px]" />
                  <span>Gross In</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#475569]">
                  <span className="w-3.5 h-3.5 rounded-xs bg-[#0A22B8]" />
                  <span>Settled Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Seller Profile Summary Card */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-white rounded-2xl border border-[#E6ECF5] p-6 shadow-xs flex flex-col items-center justify-between h-full min-h-[460px]">
            {/* Store Avatar & Badge */}
            <div className="flex flex-col items-center mt-6">
              <div className="relative">
                {isRealAvatar ? (
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#FAF9F6]">
                    <img
                      src={sellerAvatarUrl}
                      alt={storeName}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarImgError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#EAF0FF] flex items-center justify-center">
                    <span className="text-3xl font-bold text-[#0A22B8] tracking-wider select-none font-sans">
                      {storeInitials}
                    </span>
                  </div>
                )}

                {/* Rating Badge floating directly beneath */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0A22B8] text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1 whitespace-nowrap">
                  <span>★</span>
                  <span>{sellerRating}</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-[#0F172A] mt-5 text-center tracking-tight">
                {storeName}
              </h3>
              <p className="text-xs text-[#64748B] mt-1 text-center font-medium">
                {ownerName ? `${ownerName} • ` : ''}Since {joinYear}
              </p>
            </div>

            {/* Bottom 2 Stat Tiles: Solid Cobalt Rating + Pale Ice Blue Products Sold */}
            <div className="grid grid-cols-2 gap-3.5 w-full mt-8">
              {/* Tile 1: Solid Royal Cobalt Blue (Live Rating & Reviews) */}
              <div className="bg-[#0A22B8] text-white rounded-xl p-3.5 text-center shadow-xs">
                <div className="text-2xl font-bold font-sans tabular-nums">
                  {sellerRating}
                </div>
                <div className="text-[11px] text-white/80 font-medium mt-0.5">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </div>
              </div>

              {/* Tile 2: Pale Ice Blue (Live Total Sold Items) */}
              <div className="bg-[#EAF0FF] text-[#0A22B8] rounded-xl p-3.5 text-center shadow-xs">
                <div className="text-2xl font-bold font-sans tabular-nums">
                  {totalDeliveredOrders}
                </div>
                <div className="text-[11px] text-[#0A22B8]/80 font-semibold mt-0.5">
                  {totalDeliveredOrders === 1 ? 'Product Sold' : 'Products Sold'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT ORDERS STRIP (Clean White Row) */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Recent Orders</h3>
          <button
            type="button"
            onClick={() => setActiveSection('orders')}
            className="text-xs font-bold text-[#0A22B8] hover:underline cursor-pointer"
          >
            View All Orders →
          </button>
        </div>

        {sellerOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6ECF5] p-8 text-center shadow-xs">
            <p className="text-sm font-semibold text-[#0F172A]">No orders placed yet</p>
            <p className="text-xs text-[#64748B] mt-1">
              When buyers purchase your verified atelier listings, they will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sellerOrders.slice(0, 4).map((order) => {
              const productName = order.items && order.items[0]?.productName
                ? order.items[0].productName
                : (order.productTitle || order.productName || 'Artisanal Piece');
              const buyerName = order.customerName || order.buyerName || 'Verified Collector';
              const buyerInitials = buyerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={order.id}
                  onClick={() => setActiveSection('orders')}
                  className="bg-white rounded-2xl border border-[#E6ECF5] p-4 flex items-center justify-between gap-4 shadow-xs hover:border-[#0A22B8]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#EAF0FF] text-[#0A22B8] font-bold text-xs flex items-center justify-center shrink-0">
                      {buyerInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#0F172A] truncate group-hover:text-[#0A22B8] transition-colors">
                        Purchased {productName}
                      </div>
                      <div className="text-xs text-[#64748B] font-mono mt-0.5">
                        #{order.orderNumber} • {new Date(order.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-[#0F172A] tabular-nums font-sans">
                      ₹{formatINR(Number(order.totalAmount || order.amount || 0))}
                    </div>
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#EAF0FF] text-[#0A22B8] mt-1">
                      {String(order.status || 'QC Verified').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seller Onboarding Guide Modal */}
      <SellerOnboardingGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
};