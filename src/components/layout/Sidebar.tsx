import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Package,
  Archive,
  ShieldCheck,
  ShoppingBag,
  Coins,
  TrendingUp,
  Settings,
  ChevronDown,
  LogOut,
  X,
} from 'lucide-react';
import { useApp, NavSection } from '../../context/AppContext';
import { TrueMotionQCLogo } from '../common/TrueMotionQCLogo';

interface NavSubItem {
  id: string;
  label: string;
  targetSection?: NavSection;
  action?: () => void;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasChevron?: boolean;
  subItems?: NavSubItem[];
  defaultSubTab?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    activeSubTab,
    setActiveSubTab,
    setOpenAddProductWizard,
    logout,
    currentSeller,
    isSidebarCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useApp();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    products: false,
    inventory: false,
    verification: false,
    orders: false,
    analytics: false,
  });

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Exact 8 core navigation items in specified order (Protection completely removed)
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: Home,
      hasChevron: false,
      defaultSubTab: 'all',
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      hasChevron: true,
      defaultSubTab: 'all',
      subItems: [
        { id: 'all', label: 'All Listings' },
        { id: 'add', label: 'Add Product', action: () => setOpenAddProductWizard(true) },
        { id: 'archived', label: 'Archived' },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Archive,
      hasChevron: true,
      defaultSubTab: 'overview',
      subItems: [
        { id: 'overview', label: 'Stock Levels' },
        { id: 'history', label: 'Reorder Alerts' },
      ],
    },
    {
      id: 'verification',
      label: 'Verification',
      icon: ShieldCheck,
      hasChevron: true,
      defaultSubTab: 'pending',
      subItems: [
        { id: 'pending', label: 'Pending Inspection' },
        { id: 'verified', label: 'TMQC Verified' },
        { id: 'rejected', label: 'QC Failed / Returns' },
      ],
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      hasChevron: true,
      defaultSubTab: 'all',
      subItems: [
        { id: 'all', label: 'All Orders' },
        { id: 'packing', label: 'To Ship' },
        { id: 'shipping', label: 'In Transit' },
      ],
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: Coins,
      hasChevron: false,
      defaultSubTab: 'overview',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      hasChevron: true,
      defaultSubTab: 'insights',
      subItems: [
        { id: 'insights', label: 'Revenue Insights', targetSection: 'analytics' },
        { id: 'sales', label: 'Tax Reports', targetSection: 'reports' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      hasChevron: false,
      defaultSubTab: 'profile',
      subItems: [
        { id: 'profile', label: 'Store Profile', targetSection: 'profile' },
        { id: 'security', label: 'Security & 2FA', targetSection: 'security' },
      ],
    },
  ];

  const handleMainItemClick = (item: NavItem, isDrawer: boolean) => {
    if (item.id === 'settings') {
      setActiveSection('profile');
      setActiveSubTab('profile');
    } else {
      setActiveSection(item.id);
      if (item.defaultSubTab) {
        setActiveSubTab(item.defaultSubTab);
      }
    }

    if (!isSidebarCollapsed && item.hasChevron && item.subItems && item.subItems.length > 0) {
      toggleGroup(item.id);
    } else if (isDrawer) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleSubItemClick = (sub: NavSubItem, parentId: NavSection, isDrawer: boolean) => {
    if (sub.action) {
      sub.action();
    } else {
      if (sub.targetSection) {
        setActiveSection(sub.targetSection);
      } else {
        setActiveSection(parentId === 'settings' ? 'profile' : parentId);
      }
      setActiveSubTab(sub.id);
    }
    if (isDrawer) {
      setIsMobileMenuOpen(false);
    }
  };

  const storeName =
    currentSeller?.store_name ||
    currentSeller?.storeName ||
    currentSeller?.sellerName ||
    'Seller Atelier';

  const storeInitials = (() => {
    const parts = (storeName || 'Atelier').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] || 'AT').slice(0, 2).toUpperCase();
  })();

  const isDemo = currentSeller?.id === 'seller-demo-ashwin';

  const renderSidebarInner = (collapsed: boolean, isDrawer = false) => (
    <div className="h-full flex flex-col justify-between bg-white text-[#0F172A] border-r border-[#E6ECF5] select-none shadow-[2px_0_12px_rgba(10,34,184,0.02)]">
      {/* 1. Top Brand Logo */}
      <div
        className={`h-20 px-6 flex items-center shrink-0 border-b border-[#F1F5F9] ${
          collapsed ? 'justify-center px-2' : 'justify-between'
        }`}
      >
        <TrueMotionQCLogo variant="cobalt" compact={collapsed} size="sidebar" />
        {isDrawer && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            activeSection === item.id ||
            (item.id === 'settings' &&
              (activeSection === 'profile' ||
                activeSection === 'security' ||
                activeSection === 'activity' ||
                (activeSection as string) === 'settings')) ||
            (item.id === 'products' && activeSection === 'add-product') ||
            (item.id === 'analytics' && activeSection === 'reports');

          const isExpanded = Boolean(expandedGroups[item.id]);
          const Icon = item.icon;
          const showChevron = Boolean(item.hasChevron && item.subItems && item.subItems.length > 0);

          return (
            <div key={item.id}>
              <motion.button
                whileTap={{ scale: 0.985 }}
                type="button"
                onClick={() => handleMainItemClick(item, isDrawer)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13.5px] rounded-xl transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[#EAF0FF] text-[#0A22B8] font-semibold shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] font-medium'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isActive ? 'text-[#0A22B8]' : 'text-[#64748B] group-hover:text-[#0A22B8]'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate text-left tracking-[-0.01em]">
                      {item.label}
                    </span>
                  )}
                </div>

                {!collapsed && showChevron && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                      isActive ? 'text-[#0A22B8]' : 'text-[#94A3B8]'
                    } ${isExpanded ? 'rotate-180' : ''}`}
                  />
                )}
              </motion.button>

              {/* Expandable Submenu Dropdown */}
              <AnimatePresence initial={false}>
                {showChevron && isExpanded && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden ml-4 pl-3 border-l-2 border-[#E6ECF5] space-y-1 my-1"
                  >
                    {item.subItems!.map((sub) => {
                      const isSubActive =
                        activeSubTab === sub.id &&
                        (!sub.targetSection || activeSection === sub.targetSection);

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSubItemClick(sub, item.id, isDrawer)}
                          className={`w-full text-left px-3 py-1.5 text-[12.5px] rounded-lg transition-colors cursor-pointer ${
                            isSubActive
                              ? 'text-[#0A22B8] font-semibold bg-[#EAF0FF]'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] font-medium'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* 3. Bottom Seller Profile & Sign Out Footer */}
      <div className="p-3.5 border-t border-[#F1F5F9] shrink-0 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E6ECF5]">
            <div className="w-8 h-8 rounded-lg bg-[#0A22B8] text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
              {storeInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0F172A] truncate leading-tight">
                {storeName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span className={`text-[10.5px] font-medium ${isDemo ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {isDemo ? 'Demo Mode Atelier' : 'Verified Atelier'}
                </span>
              </div>
            </div>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.985 }}
          type="button"
          onClick={() => {
            logout();
            if (isDrawer) setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded-xl text-[#EF4444] hover:bg-[#FEE2E2]/60 hover:text-[#DC2626] font-medium transition-colors cursor-pointer group ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-[17px] h-[17px] shrink-0 text-[#EF4444] transition-colors" />
          {!collapsed && (
            <span className="truncate flex-1 text-left tracking-[-0.01em]">
              Sign Out
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block h-full shrink-0 z-40 transition-all duration-300 no-print ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarInner(isSidebarCollapsed, false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex no-print">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10"
            >
              {renderSidebarInner(false, true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
