import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Repeat, 
  Layers, 
  ShoppingBag, 
  Plus, 
  CheckCircle2, 
  ArrowUpDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ProductDetailModal } from '../products/ProductDetailModal';
import { getProductImage, handleImageError } from '../../utils/productImages';
import { PopUpContainer, PopUpItem, luxuryEase } from '../common/MotionPrimitives';

type Timeframe = '30D' | '90D' | '1Y';
type SortField = 'revenue' | 'conversion' | 'views' | 'price';

export const AnalyticsView: React.FC = () => {
  const { 
    currentSeller, 
    products, 
    orders, 
    financialSummary, 
    setOpenAddProductWizard,
    setActiveSection
  } = useApp();

  const shouldReduceMotion = useReducedMotion();
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const isZeroState = products.length === 0 && orders.length === 0;
  const isZeroSeller = (orders.length === 0 && financialSummary.totalRevenue === 0) || isZeroState;

  const isPrimaryAccount = false;
  const currentOrdersRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const extraRevenue = isPrimaryAccount ? Math.max(0, currentOrdersRevenue - 48258) : 0;
  const extraOrders = isPrimaryAccount ? Math.max(0, orders.length - 2) : 0;

  const telemetryData = useMemo(() => {
    if (isZeroSeller) {
      return {
        aov: 0,
        aovTrend: '0.0%',
        conversionRate: '0.0%',
        conversionViews: 0,
        conversionOrders: 0,
        tmqcPassRate: '100%',
        tmqcSubtitle: 'Awaiting initial catalog batch',
        repeatCollectorRate: '0.0%',
        repeatSubtitle: 'New merchant tier',
        funnel: {
          impressions: 0,
          passports: 0,
          passportsPct: '0.0%',
          checkouts: 0,
          checkoutsPct: '0.0%',
          sales: 0,
          salesPct: '0.0%'
        },
        categoryShare: [
          { name: 'Chronographs & Timepieces', revenue: 0, units: 0, pct: 0 },
          { name: 'Tailored Outerwear', revenue: 0, units: 0, pct: 0 },
          { name: 'Bespoke Leather Goods', revenue: 0, units: 0, pct: 0 },
          { name: 'Studio Acoustics', revenue: 0, units: 0, pct: 0 }
        ]
      };
    }

    const base = {
      '30D': {
        aov: 4021 + Math.round(extraRevenue / Math.max(1, 48 + extraOrders)),
        aovTrend: '+9.4%',
        conversionRate: '4.8%',
        conversionViews: 1420,
        conversionOrders: 48 + extraOrders,
        tmqcPassRate: '100%',
        tmqcSubtitle: 'Zero macro-serial rejections',
        repeatCollectorRate: '34.2%',
        repeatSubtitle: 'Returning verified buyers',
        funnel: {
          impressions: 12480,
          passports: 3190,
          passportsPct: '25.5%',
          checkouts: 112,
          checkoutsPct: '3.5%',
          sales: 48 + extraOrders,
          salesPct: '42.8%'
        },
        categoryShare: [
          { name: 'Chronographs & Timepieces', revenue: 26400 + extraRevenue, units: 18 + extraOrders, pct: 54.7 },
          { name: 'Tailored Outerwear', revenue: 11850, units: 14, pct: 24.6 },
          { name: 'Bespoke Leather Goods', revenue: 6780, units: 10, pct: 14.0 },
          { name: 'Studio Acoustics', revenue: 3228, units: 6, pct: 6.7 }
        ]
      },
      '90D': {
        aov: 3890 + Math.round(extraRevenue / Math.max(1, 142 + extraOrders)),
        aovTrend: '+14.2%',
        conversionRate: '5.2%',
        conversionViews: 3850,
        conversionOrders: 142 + extraOrders,
        tmqcPassRate: '99.3%',
        tmqcSubtitle: '1 minor macro-spec request cleared',
        repeatCollectorRate: '38.6%',
        repeatSubtitle: 'Quarterly loyal clientele',
        funnel: {
          impressions: 34200,
          passports: 8940,
          passportsPct: '26.1%',
          checkouts: 318,
          checkoutsPct: '3.6%',
          sales: 142 + extraOrders,
          salesPct: '44.7%'
        },
        categoryShare: [
          { name: 'Chronographs & Timepieces', revenue: 61400 + extraRevenue, units: 48 + extraOrders, pct: 54.6 },
          { name: 'Tailored Outerwear', revenue: 27800, units: 42, pct: 24.7 },
          { name: 'Bespoke Leather Goods', revenue: 15600, units: 32, pct: 13.9 },
          { name: 'Studio Acoustics', revenue: 7600, units: 20, pct: 6.8 }
        ]
      },
      '1Y': {
        aov: 3960 + Math.round(extraRevenue / Math.max(1, 390 + extraOrders)),
        aovTrend: '+28.5%',
        conversionRate: '5.6%',
        conversionViews: 14800,
        conversionOrders: 390 + extraOrders,
        tmqcPassRate: '99.7%',
        tmqcSubtitle: 'Tier-1 Atelier Accreditation',
        repeatCollectorRate: '41.8%',
        repeatSubtitle: 'Annual private accounts',
        funnel: {
          impressions: 148000,
          passports: 38200,
          passportsPct: '25.8%',
          checkouts: 1410,
          checkoutsPct: '3.7%',
          sales: 390 + extraOrders,
          salesPct: '44.6%'
        },
        categoryShare: [
          { name: 'Chronographs & Timepieces', revenue: 210500 + extraRevenue, units: 148 + extraOrders, pct: 54.7 },
          { name: 'Tailored Outerwear', revenue: 95400, units: 118, pct: 24.8 },
          { name: 'Bespoke Leather Goods', revenue: 53800, units: 82, pct: 14.0 },
          { name: 'Studio Acoustics', revenue: 25200, units: 42, pct: 6.5 }
        ]
      }
    }[timeframe];

    return base;
  }, [timeframe, isZeroSeller, currentSeller?.id, extraRevenue, extraOrders]);

  const rankedProducts = useMemo(() => {
    if (products.length === 0) return [];

    const multipliers = {
      '30D': 1,
      '90D': 2.6,
      '1Y': 7.4
    }[timeframe];

    const mapped = products.map((prod, idx) => {
      const baseViews = 240 + ((idx * 83) % 320);
      const views = Math.round(baseViews * multipliers);
      const conversionRate = Math.min(8.8, Math.max(2.4, 5.8 - idx * 0.6));
      const estimatedUnits = Math.max(1, Math.round(views * (conversionRate / 100)));
      const netRevenue = estimatedUnits * prod.price;

      const tmqcGrade = prod.verificationStatus === 'approved' 
        ? 'Grade AAA · 100% Passed' 
        : prod.verificationStatus === 'human_review'
        ? 'In Physical Lab Review'
        : 'Inspection Pending';

      return {
        product: prod,
        views,
        conversionRate,
        estimatedUnits,
        netRevenue,
        tmqcGrade
      };
    });

    mapped.sort((a, b) => {
      let diff = 0;
      if (sortField === 'revenue') diff = b.netRevenue - a.netRevenue;
      if (sortField === 'conversion') diff = b.conversionRate - a.conversionRate;
      if (sortField === 'views') diff = b.views - a.views;
      if (sortField === 'price') diff = b.product.price - a.product.price;
      return sortAsc ? -diff : diff;
    });

    return mapped;
  }, [products, timeframe, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <PopUpContainer className="space-y-6 pb-6">
      {/* A. Header & Timeframe Switcher */}
      <PopUpItem className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div className="space-y-1">
          <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#B5613D] font-bold block">
            STORE INTELLIGENCE &amp; TELEMETRY
          </span>
          <h1 className="text-[1.875rem] sm:text-[2.5rem] leading-[1.15] font-display font-semibold tracking-tight text-[#352013]">
            Performance Analytics
          </h1>
          <p className="text-[0.9375rem] text-[#6B5344] pt-0.5 leading-relaxed">
            Granular conversion velocity, category margins, and TMQC authentication metrics.
          </p>
        </div>

        {/* Timeframe Pill Selector */}
        <div className="bg-[#EFE5D3] p-1.5 rounded-full text-xs font-medium text-[#6B5344] flex items-center gap-1 self-start sm:self-auto shrink-0 border border-[#D3C8B7] shadow-2xs">
          {(['30D', '90D', '1Y'] as const).map(tf => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer font-semibold ${
                timeframe === tf
                  ? 'bg-[#384D35] text-[#FFFBF2] shadow-xs'
                  : 'text-[#6B5344] hover:text-[#352013] hover:bg-[#FBF9F5]/60'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </PopUpItem>

      {/* B. Top 4 Intelligence KPI Cards */}
      <PopUpItem className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Average Order Value */}
        <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-5 shadow-2xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#A9B89C]/35 border border-[#96A685] flex items-center justify-center text-[#384D35]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[0.75rem] uppercase tracking-[0.06em] text-[#6B5344] font-semibold">Average Order Value</span>
            </div>
            <span className="text-[11px] font-mono text-[#384D35] bg-[#A9B89C]/35 px-2.5 py-0.5 rounded-full font-semibold">
              {telemetryData.aovTrend}
            </span>
          </div>

          <div className="text-[2.25rem] font-bold font-sans text-[#352013] tracking-tight py-1 tabular-nums leading-none">
            ₹{telemetryData.aov.toLocaleString()}
          </div>

          <div className="text-[11px] text-[#6B5344] font-mono pt-1">
            Calculated across verified escrow settlements
          </div>
        </div>

        {/* KPI 2: Listing Conversion Rate */}
        <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-5 shadow-2xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EFE5D3] border border-[#D3C8B7] flex items-center justify-center text-[#B5613D]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-[0.75rem] uppercase tracking-[0.06em] text-[#6B5344] font-semibold">Listing Conversion</span>
            </div>
            <span className="text-[10px] font-mono text-[#B5613D] uppercase font-bold">
              VELOCITY
            </span>
          </div>

          <div className="text-[2.25rem] font-bold font-sans text-[#352013] tracking-tight py-1 tabular-nums leading-none">
            {telemetryData.conversionRate}
          </div>

          <div className="text-[11px] text-[#6B5344] font-mono pt-1 truncate tabular-nums">
            {telemetryData.conversionViews.toLocaleString()} collector views → {telemetryData.conversionOrders} orders
          </div>
        </div>

        {/* KPI 3: TMQC First-Pass Rate */}
        <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-5 shadow-2xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#A9B89C]/35 border border-[#96A685] flex items-center justify-center text-[#384D35]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[0.75rem] uppercase tracking-[0.06em] text-[#6B5344] font-semibold">TMQC First-Pass Rate</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#384D35]" />
          </div>

          <div className="text-[2.25rem] font-bold font-sans text-[#352013] tracking-tight py-1 tabular-nums leading-none">
            {telemetryData.tmqcPassRate}
          </div>

          <div className="text-[11px] text-[#384D35] font-mono font-semibold pt-1 truncate">
            {telemetryData.tmqcSubtitle}
          </div>
        </div>

        {/* KPI 4: Repeat Collector Rate */}
        <div className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-5 shadow-2xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EFE5D3] border border-[#D3C8B7] flex items-center justify-center text-[#B5613D]">
                <Repeat className="w-4 h-4" />
              </div>
              <span className="text-[0.75rem] uppercase tracking-[0.06em] text-[#6B5344] font-semibold">Repeat Collector Rate</span>
            </div>
            <span className="text-[10px] font-mono text-[#7A6252] uppercase font-bold">
              LOYALTY
            </span>
          </div>

          <div className="text-[2.25rem] font-bold font-sans text-[#352013] tracking-tight py-1 tabular-nums leading-none">
            {telemetryData.repeatCollectorRate}
          </div>

          <div className="text-[11px] text-[#6B5344] font-mono pt-1 truncate">
            {telemetryData.repeatSubtitle}
          </div>
        </div>
      </PopUpItem>

      {/* C. Middle Row: Category Performance & Collector Acquisition Funnel */}
      <PopUpItem className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Revenue by Atelier Category (7 cols) */}
        <div className="lg:col-span-7 min-w-0 bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E3D8C4]">
            <div>
              <span className="text-[0.75rem] font-mono uppercase tracking-[0.06em] text-[#B5613D] font-bold block">
                PORTFOLIO SHARE
              </span>
              <h2 className="text-[1.75rem] leading-[1.2] font-display font-medium text-[#352013]">
                Revenue by Atelier Category
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#6B5344]">
              {timeframe} Cumulative Velocity
            </span>
          </div>

          {/* Category Horizontal Bars */}
          <div className="space-y-4 py-1">
            {telemetryData.categoryShare.map((cat, idx) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-[#B5613D] font-bold">0{idx + 1}</span>
                    <span className="font-semibold text-[#352013] truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                    <span className="text-[#6B5344] text-[11px] hidden sm:inline">{cat.units} units</span>
                    <span className="font-semibold text-[#352013]">₹{cat.revenue.toLocaleString()}</span>
                    <span className="text-[#384D35] font-bold w-12 text-right">{cat.pct}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-[#EFE5D3] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + idx * 0.1, ease: luxuryEase }}
                    className="h-full rounded-full bg-gradient-to-r from-[#384D35] to-[#B5613D]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E3D8C4] flex items-center justify-between text-xs text-[#6B5344]">
            <span>Category allocation rebalances in real-time upon order intake.</span>
            <button
              onClick={() => setActiveSection('products')}
              className="font-semibold text-[#B5613D] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Manage listings</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Right: Collector Acquisition Funnel (5 cols) in Warm Terracotta Clay */}
        <div className="lg:col-span-5 min-w-0 bg-[#B5613D] text-[#FFFBF2] border border-[#9E5231] rounded-[1.75rem] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#FFFBF2]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between pb-2 border-b border-[#FFFBF2]/20">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#EFE5D3] font-semibold block">
                  CONVERSION EFFICIENCY
                </span>
                <h3 className="text-[1.25rem] leading-[1.3] font-display font-medium text-[#FFFBF2] leading-snug">
                  Collector Acquisition Funnel
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#FFFBF2] border border-[#FFFBF2]/30 bg-[#352013]/25 px-2.5 py-0.5 rounded-full">
                ESCROW SECURED
              </span>
            </div>

            {/* 4 Funnel Stages */}
            <div className="space-y-3.5 pt-1 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#F3ECE0] font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EFE5D3]" />
                    <span>01 · Atelier Impressions</span>
                  </span>
                  <span className="font-mono font-semibold text-[#FFFBF2] tabular-nums">
                    {telemetryData.funnel.impressions.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#352013]/25 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isZeroSeller ? '0%' : '100%' }}
                    transition={{ duration: 0.5, delay: 0.25, ease: luxuryEase }}
                    className="h-full bg-[#FFFBF2] rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#F3ECE0] font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EFE5D3]" />
                    <span>02 · Lot Passport Inspections</span>
                  </span>
                  <span className="font-mono text-[#FFFBF2] tabular-nums">
                    {telemetryData.funnel.passports.toLocaleString()} <span className="text-[#EFE5D3] text-[10px]">({telemetryData.funnel.passportsPct})</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-[#352013]/25 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isZeroSeller ? '0%' : '58%' }}
                    transition={{ duration: 0.5, delay: 0.35, ease: luxuryEase }}
                    className="h-full bg-[#F3ECE0]/90 rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#F3ECE0] font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EFE5D3]" />
                    <span>03 · Escrow Checkout Initiated</span>
                  </span>
                  <span className="font-mono text-[#FFFBF2] tabular-nums">
                    {telemetryData.funnel.checkouts.toLocaleString()} <span className="text-[#EFE5D3] text-[10px]">({telemetryData.funnel.checkoutsPct})</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-[#352013]/25 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isZeroSeller ? '0%' : '26%' }}
                    transition={{ duration: 0.5, delay: 0.45, ease: luxuryEase }}
                    className="h-full bg-[#EFE5D3]/85 rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#F3ECE0] font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A9B89C]" />
                    <span>04 · Completed Verified Sales</span>
                  </span>
                  <span className="font-mono font-semibold text-[#FFFBF2] tabular-nums">
                    {telemetryData.funnel.sales.toLocaleString()} <span className="text-[#EFE5D3] text-[10px]">({telemetryData.funnel.salesPct})</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-[#352013]/25 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isZeroSeller ? '0%' : '16%' }}
                    transition={{ duration: 0.5, delay: 0.55, ease: luxuryEase }}
                    className="h-full bg-[#A9B89C] rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#FFFBF2]/20 relative z-10 flex items-center justify-between text-[11px] text-[#F3ECE0]">
            <span>Average conversion cycle: 4.2 days</span>
            <span className="text-[#FFFBF2] font-mono font-semibold">0.0% Chargebacks</span>
          </div>
        </div>
      </PopUpItem>

      {/* D. Bottom Row: Top Performing Lots Ledger */}
      <PopUpItem className="bg-[#FBF9F5] border border-[#D3C8B7] rounded-[1.75rem] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3D8C4]">
          <div>
            <h2 className="text-[1.75rem] leading-[1.2] font-display font-medium text-[#352013]">
              Top Performing Lots Ledger
            </h2>
            <p className="text-xs text-[#6B5344] mt-0.5">
              Listing engagement, escrow velocity, and TMQC authenticity grading.
            </p>
          </div>

          {/* Sort Controls */}
          {rankedProducts.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-[#6B5344] flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </span>
              <div className="flex items-center gap-1 bg-[#EFE5D3] p-1 rounded-full text-xs border border-[#D3C8B7]">
                {(['revenue', 'conversion', 'views', 'price'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => handleSort(f)}
                    className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-colors cursor-pointer ${
                      sortField === f 
                        ? 'bg-[#384D35] text-[#FFFBF2] font-semibold shadow-2xs' 
                        : 'text-[#6B5344] hover:text-[#352013]'
                    }`}
                  >
                    {f} {sortField === f && (sortAsc ? '↑' : '↓')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Zero State for new seller without products */}
        {rankedProducts.length === 0 ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#A9B89C]/35 border border-[#96A685] text-[#384D35] flex items-center justify-center mx-auto shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#352013] font-bold">
              No pieces listed yet
            </h3>
            <p className="text-xs text-[#6B5344] leading-relaxed">
              Your atelier catalog has not yet been registered with TrueMotion QC Quality Control. List your first piece to unlock real-time store telemetry.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setOpenAddProductWizard(true)}
                className="px-5 py-2.5 bg-[#384D35] hover:bg-[#2D3C25] text-[#FFFBF2] text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>List First Piece</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-0 rounded-2xl border border-[#E3D8C4]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFE5D3]/60 text-[#6B5344] font-mono uppercase text-[10px] tracking-wider border-b border-[#E3D8C4]">
                <tr>
                  <th className="py-3 px-4">Lot / SKU</th>
                  <th className="py-3 px-4">Product Piece</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-right">Conversion</th>
                  <th className="py-3 px-4 text-right">Net Revenue</th>
                  <th className="py-3 px-4">TMQC Grade</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3D8C4] text-[#4A2E1B]">
                {rankedProducts.map((row, idx) => {
                  const p = row.product;
                  const thumb = getProductImage(p);

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + idx * 0.04, ease: luxuryEase }}
                      onClick={() => setSelectedProduct(p)}
                      className="hover:bg-[#EFE5D3]/35 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#352013] whitespace-nowrap">
                        {p.sku}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5 max-w-xs">
                          <img 
                            src={thumb} 
                            alt={p.name} 
                            onError={handleImageError}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-[#D3C8B7] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-[#352013] truncate group-hover:text-[#B5613D] transition-colors">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-[#6B5344] truncate tabular-nums">
                              ₹{p.price.toLocaleString()} · {p.specs.brand || 'Atelier Exclusive'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#6B5344] whitespace-nowrap font-mono text-[11px]">
                        {p.category}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-right whitespace-nowrap text-[#4A2E1B] tabular-nums">
                        {row.views.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-right whitespace-nowrap tabular-nums">
                        <span className="bg-[#EFE5D3] text-[#B5613D] border border-[#D3C8B7] px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
                          <span>{row.conversionRate}%</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-right text-[#352013] whitespace-nowrap tabular-nums">
                        ₹{row.netRevenue.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-[#A9B89C]/35 text-[#384D35] border border-[#96A685] px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#384D35]" />
                          <span>{row.tmqcGrade}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#B5613D] group-hover:underline inline-flex items-center gap-1">
                          <span>Inspect</span>
                          <span>↗</span>
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PopUpItem>

      {/* Connected Product Lot & Authentication Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </PopUpContainer>
  );
};
