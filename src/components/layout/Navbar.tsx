import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell,
  ChevronDown,
  Search,
  LogOut,
  UserCog,
  Menu,
  Package,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useApp, NavSection } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const {
    currentSeller,
    logout,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    activeSection,
    setActiveSection,
    setActiveSubTab,
    setIsMobileMenuOpen,
    products,
    orders,
  } = useApp();

  const [showSellerMenu, setShowSellerMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const sellerContainerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const firstName = currentSeller?.fullName
    ? currentSeller.fullName.split(' ')[0]
    : currentSeller?.sellerName?.split(' ')[0] || 'Ashwin';

  // Close dropdowns on click-outside or Escape
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(target)) {
        setShowNotifMenu(false);
      }
      if (sellerContainerRef.current && !sellerContainerRef.current.contains(target)) {
        setShowSellerMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setShowNotifMenu(false);
        setShowSellerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Live Global Search across seller products & orders
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { matchedProducts: [], matchedOrders: [] };

    const matchedProducts = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedOrders = orders
      .filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q))
      )
      .slice(0, 4);

    return { matchedProducts, matchedOrders };
  }, [searchQuery, products, orders]);

  const hasSearchText = searchQuery.trim().length > 0;
  const totalMatches =
    searchResults.matchedProducts.length + searchResults.matchedOrders.length;

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Overview';
      case 'products': return 'My Listings / Products';
      case 'add-product': return 'Add Product';
      case 'inventory': return 'Inventory';
      case 'verification': return 'KYC & Verification';
      case 'orders': return 'Orders & QC';
      case 'earnings': return 'Payouts & Earnings';
      case 'analytics': return 'Analytics';
      case 'reports': return 'Reports';
      case 'profile': return 'Store Profile & Security';
      case 'settings': return 'Settings';
      case 'security': return 'Security';
      case 'activity': return 'Activity';
      default: return 'Overview';
    }
  };

  const navigateFromNotification = (category: string) => {
    const map: Record<string, NavSection> = {
      orders: 'orders',
      products: 'verification',
      payments: 'earnings',
      alerts: 'dashboard',
    };
    const dest = map[category] || 'dashboard';
    setActiveSection(dest);
    setShowNotifMenu(false);
  };

  return (
    <header className="h-20 px-6 sm:px-8 bg-white border-b border-[#E6ECF5] sticky top-0 z-30 flex items-center justify-between gap-4 no-print shadow-[0_2px_10px_rgba(10,34,184,0.02)]">
      {/* 1. Left: Mobile Drawer Button + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0 text-[14px]">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('dashboard')}
          className="text-[#64748B] hover:text-[#0A22B8] transition-colors cursor-pointer font-medium hidden xs:inline"
        >
          Workspace
        </button>
        <span className="text-[#CBD5E1] font-light hidden xs:inline">/</span>
        <span className="text-[#0F172A] font-semibold truncate tracking-[-0.01em]">
          {getSectionTitle()}
        </span>
      </div>

      {/* 2. Right Controls: Rounded Pill Search, Notifications, Profile */}
      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        {/* Global Live Search with Rounded Pill Container */}
        <div ref={searchContainerRef} className="relative hidden sm:block">
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-4 py-2 w-64 md:w-80 shadow-xs focus-within:border-[#0A22B8] focus-within:ring-2 focus-within:ring-[#0A22B8]/10 focus-within:bg-white transition-all">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search products, SKUs, orders..."
              className="bg-transparent text-xs text-[#0F172A] placeholder-[#94A3B8] w-full focus:outline-none"
            />
            {hasSearchText ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="text-[#94A3B8] hover:text-[#0F172A] ml-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="w-4 h-4 text-[#94A3B8] shrink-0 ml-1.5" />
            )}
          </div>

          <AnimatePresence>
            {searchFocused && hasSearchText && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white border border-[#E6ECF5] rounded-2xl shadow-xl p-3 z-50 space-y-2"
              >
                {totalMatches === 0 ? (
                  <div className="py-5 text-center text-xs text-[#64748B]">
                    No products or orders matching &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <>
                    {searchResults.matchedProducts.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                          Products
                        </div>
                        {searchResults.matchedProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setActiveSection('products');
                              setActiveSubTab('all');
                              setSearchFocused(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Package className="w-4 h-4 text-[#0A22B8] shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[#0F172A] truncate">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-[#64748B] font-mono">
                                  {p.sku} · {p.category}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#0F172A] tabular-nums shrink-0">
                              ₹{p.price.toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.matchedOrders.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-[#F1F5F9]">
                        <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                          Orders
                        </div>
                        {searchResults.matchedOrders.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              setActiveSection('orders');
                              setActiveSubTab('all');
                              setSearchFocused(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ShoppingBag className="w-4 h-4 text-[#0A22B8] shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[#0F172A] truncate">
                                  {o.orderNumber} · {o.items[0]?.productName}
                                </div>
                                <div className="text-[10px] text-[#64748B] truncate">
                                  {o.customerName}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#0F172A] tabular-nums shrink-0">
                              ₹{o.totalAmount.toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell */}
        <div ref={notifContainerRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifMenu((prev) => !prev);
              setShowSellerMenu(false);
            }}
            className="p-2.5 rounded-full text-[#475569] hover:text-[#0A22B8] hover:bg-[#F1F5F9] transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0A22B8] ring-2 ring-white" />
            )}
          </button>

          <AnimatePresence>
            {showNotifMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E6ECF5] rounded-2xl shadow-xl p-4 z-50 origin-top-right"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-2 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Notifications ({unreadCount} unread)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs text-[#0A22B8] font-semibold hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#64748B]">
                      No recent notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          navigateFromNotification(n.category);
                        }}
                        className={`p-3 rounded-xl text-xs cursor-pointer transition-colors ${
                          !n.read
                            ? 'bg-[#EAF0FF]/60 border border-[#CBD5E1] text-[#0F172A]'
                            : 'bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[#0F172A]">{n.title}</span>
                          <span className="text-[10px] text-[#94A3B8]">
                            {new Date(n.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#475569]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Pill / Dropdown */}
        <div ref={sellerContainerRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSellerMenu((prev) => !prev);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-[#F1F5F9] transition-colors cursor-pointer group"
          >
            <img
              src={currentSeller?.avatarUrl || '/images/seller_avatar_portrait_1794326164878.jpg'}
              alt={firstName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0] shadow-xs shrink-0"
            />
            <span className="text-sm font-semibold text-[#0F172A] hidden sm:inline">
              {firstName}
            </span>
            <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#0A22B8] transition-colors shrink-0" />
          </button>

          <AnimatePresence>
            {showSellerMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-60 bg-white border border-[#E6ECF5] rounded-2xl shadow-xl p-2 z-50 text-xs origin-top-right"
              >
                <div className="px-3.5 py-2.5 border-b border-[#F1F5F9] mb-1">
                  <div className="font-bold text-[#0F172A] truncate">
                    {currentSeller?.fullName || currentSeller?.sellerName || 'Atelier Account'}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                    {currentSeller?.email || currentSeller?.sellerName || ''}
                  </div>
                  <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-[#0A22B8] bg-[#EAF0FF] px-2 py-0.5 rounded-full">
                    <span>Verified Seller</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSellerMenu(false);
                      setActiveSection('profile');
                      setActiveSubTab('profile');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0A22B8] transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <UserCog className="w-4 h-4 text-[#64748B]" />
                    <span>Profile &amp; Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSellerMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
