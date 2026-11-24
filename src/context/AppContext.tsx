import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SellerProfile,
  Product,
  Order,
  Dispute,
  NotificationItem,
  ActivityLog,
  ProductCategory,
  VerificationStage,
  FinancialSummary
} from '../types';
import {
  INITIAL_SELLERS,
  INITIAL_DISPUTES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS
} from '../data/mockData';
import {
  DEMO_SELLER_ID,
  DEMO_SELLER_EMAIL,
  DEMO_SELLER_PROFILE,
  DEMO_PRODUCTS,
  DEMO_ORDERS,
  DEMO_WITHDRAWALS,
  DEMO_ESCROW_SUMMARY
} from '../data/demoSellerData';
import { normalizeProduct, normalizeOrder, normalizeSeller } from '../utils/supabaseNormalizer';
import { getCategoryFallbackImage } from '../utils/qcAngles';
import {
  apiSignup,
  apiCheckEmail,
  apiLogin,
  apiSendOtp,
  apiVerifyOtp,
  apiSubmitKyc,
  apiSaveSellerKyc,
  apiGetKycStatus,
  KycSubmitResponse,
  apiGetSellerById,
  apiCreateProduct,
  apiGetProducts,
  apiUpdateProductStock,
  apiAdvanceProductStage,
  apiApproveProduct,
  apiFailProduct,
  apiDeleteProduct,
  apiUpdateProductStatus,
  apiGetOrders,
  apiAdvanceOrderStage,
  apiSimulateReturn,
  apiProcessReturn,
  apiCreateWaybill,
  apiSubmitPackingEvidence,
  apiGetEscrowSummary,
  apiGetProfile,
  apiUpdateProfile,
  apiGetWithdrawals,
  apiCreateWithdrawal,
  apiGetActivity,
  apiGetNotifications,
  apiDemoQcVerify,
  apiGetPendingKyc,
  apiAdminApproveKyc,
  apiAdminRejectKyc,
  apiDeleteSeller,
  apiUploadPackingVideo
} from './api';

export type NavSection =
  | 'dashboard'
  | 'products'
  | 'add-product'
  | 'inventory'
  | 'verification'
  | 'orders'
  | 'earnings'
  | 'analytics'
  | 'reports'
  | 'profile'
  | 'security'
  | 'activity'
  | 'settings';

export interface SellerOnboardingPayload {
  businessName: string;
  panNumber: string;
  isBusinessEntity: boolean;
  gstin?: string;
  fullLegalName: string;
  aadhaarNumber: string;
  aadhaarFrontFileName: string;
  aadhaarBackFileName: string;
  aadhaarFrontFile?: File;
  aadhaarBackFile?: File;
  selfieCaptured: boolean;
  selfieDataUrl?: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface PayoutWithdrawal {
  id: string;
  reference: string;
  amount: number;
  bankLabel: string;
  timestamp: string;
  status: 'processing' | 'settled';
  sellerId: string;
}

interface AppContextType {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth & Seller
  currentSeller: SellerProfile | null;
  isLoggedIn: boolean;
  isVerifyingSession: boolean;
  awaitingOtp: boolean;
  setAwaitingOtp: (val: boolean) => void;
  pendingOtpSeller: SellerProfile | null;
  setPendingOtpSeller: (seller: SellerProfile | null) => void;
  login: (sellerId?: string, sellerProfile?: SellerProfile) => void;
  loginDemoSeller: () => void;
  verifyCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: SellerProfile; devOtp?: string; requires2FA?: boolean }>;
  verifyLoginOtp: (otp: string, email?: string, sellerId?: string) => Promise<{ success: boolean; error?: string; user?: SellerProfile }>;
  resendLoginOtp: (email?: string, sellerId?: string) => Promise<{ success: boolean; error?: string; devOtp?: string }>;
  authenticateUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  createAccount: (data: { atelierName: string; email: string; phone?: string; password: string }) => Promise<{ success: boolean; error?: string; user?: SellerProfile }>;
  logout: () => void;
  updateSellerProfile: (updated: Partial<SellerProfile>) => void;
  submitSellerOnboarding: (payload: SellerOnboardingPayload) => Promise<boolean>;
  verifySellerAccount: () => void;
  adminApproveKyc: (sellerId?: string) => Promise<void>;
  adminRejectKyc: (sellerId?: string, reason?: string) => Promise<void>;
  checkSellerStatus: (sellerId?: string) => Promise<SellerProfile | null>;
  deleteSellerAccount: (sellerId?: string) => Promise<boolean>;

  // Registration
  registerNewSeller: (data: {
    sellerName: string;
    email: string;
    phone: string;
    fullName: string;
    businessAddress: string;
    taxId: string;
    password?: string;
    documentType?: string;
    documentNumber?: string;
  }) => string;
  registerNewMerchant: (data: {
    sellerName: string;
    email: string;
    phone: string;
    fullName: string;
    businessAddress: string;
    taxId: string;
    password?: string;
    documentType?: string;
    documentNumber?: string;
  }) => string;

  // Navigation
  activeSection: NavSection;
  setActiveSection: (sec: NavSection) => void;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  openAddProductWizard: boolean;
  setOpenAddProductWizard: (open: boolean) => void;

  // Data Collections (Scoped to Current Seller)
  products: Product[];
  orders: Order[];
  disputes: Dispute[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];

  // Product Actions
  addProduct: (productOrFormData: FormData | Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sellerId'>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  archiveProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
  deleteProduct: (id: string) => void;

  // Inventory Actions
  updateProductStock: (id: string, newStock: number) => void;
  bulkUpdateStock: (updates: { id: string; stock: number }[]) => void;

  // Order & Packing Evidence Actions
  updateOrderStatus: (orderId: string, status: Order['status'], tracking?: string, carrier?: string) => void;
  dispatchBlindOrder: (orderId: string, waybillId: string, trackingNumber: string, carrier?: string) => void;
  submitPackingEvidence: (orderId: string, evidence: {
    packageWeightKg: number;
    notes: string;
    photos: string[];
    hasVideoProof: boolean;
  }) => void;
  uploadOrderPackingVideo: (orderId: string, videoBlob: Blob) => Promise<{
    success: boolean;
    packingVideoUrl?: string;
    packingVerifiedAt?: string;
    order?: Order;
    error?: string;
  }>;
  simulateReturn: (orderId: string, orderData?: Partial<Order> | string, returnReason?: string) => Promise<{ success: boolean; order?: Order; error?: string }>;
  advanceOrderStage: (orderId: string, status?: string) => Promise<{ success: boolean; order?: Order; error?: string }>;
  processReturn: (orderId: string, action: 'RESTOCK' | 'DISPUTE', sku?: string, quantity?: number) => Promise<{ success: boolean; order?: Order; product?: Product; error?: string }>;
  refreshData: () => Promise<void>;
  refreshOrders: () => Promise<void>;

  // Quality Control Resubmission & Admin QC Sandbox Controls
  resubmitProductEvidence: (productId: string, note: string) => void;
  advanceProductQcStage: (productId: string) => VerificationStage | null;
  approveProductQc: (productId: string) => void;
  failProductQc: (
    productId: string,
    defectReason: string,
    failedAngleIndex?: number,
    failedAngleLabel?: string
  ) => void;
  simulateDemoQcVerification: () => {
    orderNumber: string;
    amount: number;
    productName: string;
    mode: 'promoted' | 'created';
  } | null;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Disputes & Withdrawals
  submitDisputeDefense: (disputeId: string, defenseNote: string) => void;
  withdrawals: PayoutWithdrawal[];
  requestWithdrawal: (amount?: number) => PayoutWithdrawal | null;

  // Mobile Navigation Drawer
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Financial Stats
  financialSummary: {
    totalRevenue: number;
    availableBalance: number;
    escrowBalance: number;
    pendingPayouts: number;
    completedPayouts: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'tm_qc_theme',
  ACTIVE_USER_ID: 'activeUserId',
  REGISTERED_USERS: 'registeredUsers',
  PRODUCTS: 'tm_qc_products_v1',
  ORDERS: 'tm_qc_orders_v1',
  DISPUTES: 'tm_qc_disputes_v1',
  NOTIFICATIONS: 'tm_qc_notifications_v1',
  TICKETS: 'tm_qc_tickets_v1',
  ACTIVITY: 'tm_qc_activity_v1',
  WITHDRAWALS: 'tm_qc_withdrawals_v1',
};

const safeSetStorageItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const compactProductsForStorage = (items: Product[]): Product[] =>
  items.map(p => {
    const fallback = getCategoryFallbackImage(p.category);
    const compactImages = (p.images || []).map(img =>
      (img.startsWith('data:') && img.length > 60000) || img.startsWith('blob:') ? fallback : img
    );
    const compactAngles = p.anglePhotos
      ? Object.fromEntries(
        Object.entries(p.anglePhotos).map(([k, v]) => [
          k,
          v && ((v.startsWith('data:') && v.length > 60000) || v.startsWith('blob:')) ? fallback : v
        ])
      )
      : undefined;
    const compactVideo =
      p.packingVideo &&
        (p.packingVideo.videoUrl.startsWith('data:') || p.packingVideo.videoUrl.startsWith('blob:'))
        ? {
          ...p.packingVideo,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        }
        : p.packingVideo;

    return {
      ...p,
      images: compactImages.length > 0 ? compactImages : [fallback],
      anglePhotos: compactAngles,
      packingVideo: compactVideo
    };
  });

const safeParseStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    // Automatically migrate any legacy /src/assets/images/ URLs stored in previous sessions
    const migrated = saved.includes('/src/assets/images/')
      ? saved.replaceAll('/src/assets/images/', '/images/')
      : saved;
    return JSON.parse(migrated) as T;
  } catch {
    return fallback;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state (default warm ivory light mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    safeSetStorageItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Registered Users Database persisted in localStorage ('registeredUsers')
  const [sellers, setSellers] = useState<SellerProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (saved) {
      try {
        const parsed: SellerProfile[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(u => normalizeSeller(u) as unknown as SellerProfile);
        }
      } catch {
        // Fallback to empty list
      }
    }
    return [];
  });

  // In-memory 2FA Challenge state (never persisted in localStorage)
  const [awaitingOtp, setAwaitingOtp] = useState<boolean>(false);
  const [pendingOtpSeller, setPendingOtpSeller] = useState<SellerProfile | null>(null);

  // Active Session persisted in localStorage ('activeUserId')
  const [currentSellerId, setCurrentSellerId] = useState<string | null>(() => {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    return activeId || null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    return Boolean(activeId);
  });

  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID));
  });

  // Navigation
  const [activeSection, _setActiveSection] = useState<NavSection>('dashboard');
  const setActiveSection = (sec: NavSection) => {
    if ((sec as string) === 'support') {
      _setActiveSection('dashboard');
    } else {
      _setActiveSection(sec);
    }
  };
  const [activeSubTab, setActiveSubTab] = useState<string>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [openAddProductWizard, setOpenAddProductWizard] = useState<boolean>(false);

  // Core Collections (Strictly Live from Supabase / Backend, No localStorage fallback)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    } catch { }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
    } catch { }
    return [];
  });

  const [disputes, setDisputes] = useState<Dispute[]>(() =>
    safeParseStorage<Dispute[]>(STORAGE_KEYS.DISPUTES, INITIAL_DISPUTES)
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    safeParseStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  );

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    safeParseStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, INITIAL_ACTIVITY_LOGS)
  );

  const [withdrawals, setWithdrawals] = useState<PayoutWithdrawal[]>(() =>
    safeParseStorage<PayoutWithdrawal[]>(STORAGE_KEYS.WITHDRAWALS, [])
  );

  const [apiEscrowSummary, setApiEscrowSummary] = useState<FinancialSummary | null>(null);

  const logout = () => {
    try {
      // Clear all TruemotionQC session keys completely
      const keysToClear = [
        STORAGE_KEYS.ACTIVE_USER_ID,
        STORAGE_KEYS.REGISTERED_USERS,
        'activeUserId',
        'registeredUsers',
        'tmqc_token',
        'tmqc_current_seller_id',
        'tmqc_seller_session',
        STORAGE_KEYS.PRODUCTS,
        STORAGE_KEYS.ORDERS,
        STORAGE_KEYS.DISPUTES,
        STORAGE_KEYS.NOTIFICATIONS,
        'tm_qc_tickets_v1',
        STORAGE_KEYS.ACTIVITY,
        STORAGE_KEYS.WITHDRAWALS
      ];
      keysToClear.forEach(k => {
        try { localStorage.removeItem(k); } catch { }
      });
      // Iterate backwards and clear any remaining tm_ or tmqc_ keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('tm_') || k.startsWith('tmqc_') || k.toLowerCase().includes('user'))) {
          try { localStorage.removeItem(k); } catch { }
        }
      }
    } catch (e) {
      console.warn('Logout storage clear error:', e);
    }
    setAwaitingOtp(false);
    setPendingOtpSeller(null);
    setCurrentSellerId(null);
    setIsLoggedIn(false);
    setSellers([]);
    setProducts([]);
    setOrders([]);
    setApiEscrowSummary(null);
    setActiveSection('dashboard');
  };

  // Verify stored session against Supabase on app mount
  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    if (!storedId) {
      setIsVerifyingSession(false);
      setIsLoggedIn(false);
      setCurrentSellerId(null);
      return;
    }

    // Direct Instant Restore for Demo Seller Session
    if (storedId === DEMO_SELLER_ID) {
      setSellers([DEMO_SELLER_PROFILE]);
      setCurrentSellerId(DEMO_SELLER_ID);
      setProducts(DEMO_PRODUCTS);
      setOrders(DEMO_ORDERS);
      setWithdrawals(DEMO_WITHDRAWALS);
      setApiEscrowSummary(DEMO_ESCROW_SUMMARY);
      setIsLoggedIn(true);
      setIsVerifyingSession(false);
      return;
    }

    let isMounted = true;
    const verifySession = async () => {
      try {
        const res = await apiGetSellerById(storedId);
        if (!isMounted) return;

        if (res.success && (res.seller || res.user)) {
          const liveSeller = normalizeSeller(res.seller || res.user);
          setSellers(prev => {
            const exists = prev.some(s => s.id === liveSeller.id);
            if (exists) {
              return prev.map(s => s.id === liveSeller.id ? { ...s, ...liveSeller } : s);
            }
            return [liveSeller, ...prev];
          });
          setCurrentSellerId(liveSeller.id);
          setIsLoggedIn(true);
        } else {
          console.warn('[AppContext] Stored seller not found in Supabase. Clearing session.');
          logout();
        }
      } catch (err) {
        console.warn('[AppContext] Session verification failed:', err);
        logout();
      } finally {
        if (isMounted) {
          setIsVerifyingSession(false);
        }
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, []);

  const refreshData = async () => {
    if (!currentSellerId) {
      setProducts([]);
      setOrders([]);
      setApiEscrowSummary(null);
      return;
    }
    if (currentSellerId === DEMO_SELLER_ID) {
      setProducts(prev => (prev.length > 0 ? prev : DEMO_PRODUCTS));
      setOrders(prev => (prev.length > 0 ? prev : DEMO_ORDERS));
      setApiEscrowSummary(DEMO_ESCROW_SUMMARY);
      return;
    }
    try {
      const activeId = currentSellerId;
      const [prodRes, ordRes, escrowRes] = await Promise.all([
        apiGetProducts(activeId),
        apiGetOrders(activeId),
        apiGetEscrowSummary(activeId)
      ]);
      if (prodRes.success && Array.isArray(prodRes.products)) {
        setProducts(prodRes.products.filter(p => p.id !== 'prod-007' && p.id !== 'prod-008').map(normalizeProduct));
      }
      if (ordRes.success && Array.isArray(ordRes.orders)) {
        setOrders(ordRes.orders.map(normalizeOrder));
      }
      if (escrowRes.success && escrowRes.summary) {
        setApiEscrowSummary(escrowRes.summary);
      }
    } catch (err) {
      console.warn('[AppContext] refreshData error:', err);
    }
  };

  const refreshOrders = async () => {
    if (!currentSellerId) {
      setOrders([]);
      return;
    }
    if (currentSellerId === DEMO_SELLER_ID) {
      setOrders(prev => (prev.length > 0 ? prev : DEMO_ORDERS));
      return;
    }
    try {
      const activeId = currentSellerId;
      const ordRes = await apiGetOrders(activeId);
      if (ordRes.success && Array.isArray(ordRes.orders)) {
        setOrders(ordRes.orders.map(normalizeOrder));
      }
    } catch (err) {
      console.warn('[AppContext] refreshOrders error:', err);
    }
  };

  // Sync state with TrueMotion QC REST API (http://localhost:5000/api)
  useEffect(() => {
    if (!currentSellerId) return;
    if (currentSellerId === DEMO_SELLER_ID) return;
    const activeId = currentSellerId;
    let isMounted = true;
    const syncBackend = async () => {
      try {
        const [prodRes, ordRes, escrowRes, kycRes, profileRes] = await Promise.all([
          apiGetProducts(activeId),
          apiGetOrders(activeId),
          apiGetEscrowSummary(activeId),
          apiGetKycStatus(activeId),
          apiGetProfile(activeId)
        ]);

        if (!isMounted) return;

        if (prodRes.success && Array.isArray(prodRes.products)) {
          setProducts(prodRes.products.filter(p => p.id !== 'prod-007' && p.id !== 'prod-008').map(normalizeProduct));
        }

        if (ordRes.success && Array.isArray(ordRes.orders)) {
          setOrders(ordRes.orders.map(normalizeOrder));
        }

        if (escrowRes.success && escrowRes.summary) {
          setApiEscrowSummary(escrowRes.summary);
        }

        if (profileRes.success && profileRes.seller) {
          setSellers(prev => {
            const exists = prev.some(s => s.id === profileRes.seller!.id);
            if (exists) {
              return prev.map(s => s.id === profileRes.seller!.id ? { ...s, ...profileRes.seller } : s);
            }
            return [...prev, profileRes.seller!];
          });
        } else if (kycRes.success && kycRes.verificationStatus && currentSellerId) {
          setSellers(prev => prev.map(s => s.id === currentSellerId ? {
            ...s,
            verificationStatus: (kycRes.verificationStatus as any) || s.verificationStatus,
            accountStatus: (kycRes.accountStatus as any) || s.accountStatus,
          } : s));
        }
      } catch (err) {
        console.warn('[AppContext] API background sync note:', err);
      }
    };

    syncBackend();
    return () => { isMounted = false; };
  }, [currentSellerId]);

  // Sync to localStorage (quota-safe & strips ephemeral blob: URLs)
  useEffect(() => {
    safeSetStorageItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    safeSetStorageItem(STORAGE_KEYS.DISPUTES, JSON.stringify(disputes));
  }, [disputes]);

  useEffect(() => {
    safeSetStorageItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    safeSetStorageItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    safeSetStorageItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    if (currentSellerId && isLoggedIn) {
      safeSetStorageItem(STORAGE_KEYS.ACTIVE_USER_ID, currentSellerId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
    }
  }, [currentSellerId, isLoggedIn]);

  // Current Seller Object (Strictly matched to activeUserId)
  const currentSeller = currentSellerId ? sellers.find(s => s.id === currentSellerId) || null : null;

  // Filtered collections strictly isolated by activeUserId (sellerId === currentSellerId)
  const sellerProducts = currentSellerId ? products.filter(p => p.sellerId === currentSellerId) : [];
  const sellerOrders = currentSellerId ? orders.filter(o => o.sellerId === currentSellerId) : [];
  const sellerDisputes = currentSellerId ? disputes.filter(d => d.sellerId === currentSellerId) : [];
  const sellerNotifications = currentSellerId ? notifications.filter(n => n.sellerId === currentSellerId) : [];
  const sellerActivity = currentSellerId ? activityLogs.filter(a => a.sellerId === currentSellerId) : [];
  const sellerWithdrawals = currentSellerId ? withdrawals.filter(w => w.sellerId === currentSellerId) : [];

  // Financial summary strictly scoped to activeUserId and QC-verified Delivered orders
  const financialSummary = React.useMemo(() => {
    if (apiEscrowSummary && currentSellerId) {
      return apiEscrowSummary;
    }

    if (!currentSellerId) {
      return {
        totalRevenue: 0,
        availableBalance: 0,
        escrowBalance: 0,
        pendingPayouts: 0,
        completedPayouts: 0
      };
    }

    let revenue = 0;
    let escrowGross = 0;
    let releasedGross = 0;

    sellerOrders.forEach(o => {
      const isDelivered = String(o.status).toLowerCase() === 'delivered';
      if (isDelivered) {
        revenue += o.totalAmount || 0;
        if (o.escrowStatus !== 'refunded') {
          releasedGross += o.totalAmount || 0;
        }
      } else if (o.escrowStatus === 'held') {
        escrowGross += o.totalAmount || 0;
      }
    });

    const netReleased = Math.round(releasedGross * 0.95);
    const netEscrow = Math.round(escrowGross * 0.95);
    const totalWithdrawn = sellerWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const pendingWithdrawn = sellerWithdrawals
      .filter(w => w.status === 'processing')
      .reduce((sum, w) => sum + w.amount, 0);

    return {
      totalRevenue: revenue,
      availableBalance: Math.max(0, netReleased - totalWithdrawn),
      escrowBalance: netEscrow,
      pendingPayouts: pendingWithdrawn,
      completedPayouts: totalWithdrawn
    };
  }, [sellerOrders, sellerWithdrawals, currentSellerId]);

  // Auth Methods
  const login = (sellerId?: string, sellerProfile?: SellerProfile) => {
    if (!sellerId) return;
    const resolvedId = sellerId;
    setAwaitingOtp(false);
    setPendingOtpSeller(null);
    if (sellerProfile) {
      const normalized = normalizeSeller(sellerProfile);
      setSellers(prev => {
        const filtered = prev.filter(s => s.id !== resolvedId);
        const updated = [normalized, ...filtered];
        safeSetStorageItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(updated));
        return updated;
      });
    }
    setCurrentSellerId(resolvedId);
    setIsLoggedIn(true);
    safeSetStorageItem(STORAGE_KEYS.ACTIVE_USER_ID, resolvedId);
    safeSetStorageItem('tmqc_current_seller_id', resolvedId);
    setActiveSection('dashboard');
    setActiveSubTab('all');

    const target = sellerProfile || sellers.find(s => s.id === resolvedId);
    if (target) {
      logActivity(resolvedId, 'Session Authenticated', `Signed in to ${target.sellerName}`);
    }
  };

  const loginDemoSeller = () => {
    setAwaitingOtp(false);
    setPendingOtpSeller(null);
    setSellers(prev => [DEMO_SELLER_PROFILE, ...prev.filter(s => s.id !== DEMO_SELLER_ID)]);
    setCurrentSellerId(DEMO_SELLER_ID);
    setProducts(DEMO_PRODUCTS);
    setOrders(DEMO_ORDERS);
    setWithdrawals(DEMO_WITHDRAWALS);
    setApiEscrowSummary(DEMO_ESCROW_SUMMARY);
    setIsLoggedIn(true);
    safeSetStorageItem(STORAGE_KEYS.ACTIVE_USER_ID, DEMO_SELLER_ID);
    safeSetStorageItem('tmqc_current_seller_id', DEMO_SELLER_ID);
    setActiveSection('dashboard');
    setActiveSubTab('all');
    logActivity(DEMO_SELLER_ID, 'Demo Session Active', 'Signed in to Ashwin Demo Atelier');
  };

  const verifyCredentials = async (
    emailInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string; user?: SellerProfile; devOtp?: string; requires2FA?: boolean }> => {
    const normalizedEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    // Instant sign-in for Demo Seller Account
    if (normalizedEmail === DEMO_SELLER_EMAIL) {
      loginDemoSeller();
      return {
        success: true,
        user: DEMO_SELLER_PROFILE,
        devOtp: '123456',
        requires2FA: false,
      };
    }

    try {
      const res = await apiLogin({
        email: normalizedEmail,
        password: cleanPassword
      });

      if (!res.success) {
        return {
          success: false,
          error: res.error || 'Authentication failed. Please verify your credentials.'
        };
      }

      const activeUser = res.user || res.seller;
      if (activeUser) {
        const normalized = normalizeSeller(activeUser);
        setSellers(prev => [normalized, ...prev.filter(s => s.id !== normalized.id)]);
        return {
          success: true,
          user: normalized,
          devOtp: res.devOtp,
          requires2FA: res.requires2FA !== false
        };
      }
    } catch (apiErr: any) {
      console.warn('[verifyCredentials] Backend login call failed, trying local fallback:', apiErr?.message);
    }

    // Local fallback check if backend was offline
    const matched = sellers.find(u => (u.email || '').trim().toLowerCase() === normalizedEmail);
    if (!matched) {
      return {
        success: false,
        error: 'No atelier found for this email address. Please create an account below.'
      };
    }
    if (matched.password && matched.password !== cleanPassword) {
      return {
        success: false,
        error: 'Incorrect password for this atelier account. Please try again.'
      };
    }
    return { success: true, user: matched, devOtp: '123456', requires2FA: true };
  };

  const verifyLoginOtp = async (
    otp: string,
    email?: string,
    sellerId?: string
  ): Promise<{ success: boolean; error?: string; user?: SellerProfile }> => {
    try {
      const res = await apiVerifyOtp({
        otp,
        email: email?.trim().toLowerCase(),
        sellerId
      });

      if (!res.success) {
        return {
          success: false,
          error: res.error || 'Invalid or expired 6-digit OTP code.'
        };
      }

      const activeUser = res.user || res.seller;
      if (activeUser) {
        const normalized = normalizeSeller(activeUser);
        setSellers(prev => [normalized, ...prev.filter(s => s.id !== normalized.id)]);
        return { success: true, user: normalized };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to verify OTP code.'
      };
    }
  };

  const resendLoginOtp = async (
    email?: string,
    sellerId?: string
  ): Promise<{ success: boolean; error?: string; devOtp?: string }> => {
    try {
      const res = await apiSendOtp({
        email: email?.trim().toLowerCase(),
        sellerId
      });
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to resend OTP code.' };
      }
      return { success: true, devOtp: res.devOtp };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to resend OTP code.' };
    }
  };

  const authenticateUser = async (emailInput: string, passwordInput: string): Promise<{ success: boolean; error?: string }> => {
    const res = await verifyCredentials(emailInput, passwordInput);
    if (!res.success || !res.user) {
      return { success: false, error: res.error };
    }
    login(res.user.id, res.user);
    return { success: true };
  };

  const createAccount = async (data: {
    atelierName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; user?: SellerProfile }> => {
    // 1. Normalize all email inputs with email.trim().toLowerCase()
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const cleanAtelier = (data.atelierName || '').trim();
    const cleanPhone = (data.phone || '').trim();

    // 2. Never use localStorage or in-memory state to check if email is registered - query live Supabase data
    try {
      const checkRes = await apiCheckEmail(normalizedEmail);
      if (checkRes.exists) {
        return {
          success: false,
          error: 'This email is already registered. Please sign in instead.'
        };
      }
    } catch (ignore) { }

    const newId = `SELLER-${Date.now()}`;
    let createdSeller: SellerProfile | null = null;

    try {
      const res = await apiSignup({
        id: newId,
        atelierName: cleanAtelier,
        sellerName: cleanAtelier,
        email: normalizedEmail,
        phone: cleanPhone,
        password: data.password
      });

      if (!res.success) {
        const isDuplicate =
          res.error === 'Email is already in use' ||
          res.error?.toLowerCase().includes('already') ||
          res.message?.toLowerCase().includes('already');
        return {
          success: false,
          error: isDuplicate
            ? 'This email is already registered. Please sign in instead.'
            : (res.error || 'Failed to create account. Please try again.')
        };
      }

      if (res.seller || res.user) {
        createdSeller = normalizeSeller(res.seller || res.user);
      }
    } catch (apiErr: any) {
      console.warn('[createAccount] Backend signup failed:', apiErr?.message);
      const isDuplicate = apiErr?.message?.toLowerCase().includes('already');
      return {
        success: false,
        error: isDuplicate
          ? 'This email is already registered. Please sign in instead.'
          : (apiErr?.message || 'Unable to connect to registration server. Please try again.')
      };
    }

    if (!createdSeller) {
      return {
        success: false,
        error: 'Could not create account. Please try again.'
      };
    }

    const fallbackUser: SellerProfile = {
      id: createdSeller?.id || newId,
      sellerName: cleanAtelier,
      email: normalizedEmail,
      password: data.password,
      phone: cleanPhone,
      fullName: cleanAtelier,
      businessAddress: '',
      taxId: '',
      avatarUrl: '/images/seller_avatar_portrait_1794326164878.jpg',
      accountStatus: 'pending',
      verificationStatus: 'NOT_SUBMITTED',
      kycStatus: 'NOT_SUBMITTED',
      applicationRefNumber: `ATL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      submittedAt: new Date().toISOString(),
      twoFactorEnabled: false,
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      bankInstitution: 'Pending Settlement Bank Link',
      bankAccountMasked: '••••••••0000',
      routingOrSortCode: 'NOT LINKED',
      verificationLevel: 'Pending Onboarding (NOT_SUBMITTED)',
      verificationScope: 'Mandatory KYC & Banking Required',
      trustScore: 5.0,
      authenticPassRate: 'Awaiting Compliance Review',
      lifetimeDisbursed: 0,
      escrowFeeTier: '5% TrueMotion QC Escrow Fee Net'
    };

    const finalSeller: SellerProfile = {
      ...fallbackUser,
      ...(createdSeller || {}),
      phone: cleanPhone || createdSeller?.phone || '',
      kyc_status: 'NOT_SUBMITTED',
      kycStatus: 'NOT_SUBMITTED',
      verification_status: 'NOT_SUBMITTED',
      verificationStatus: 'NOT_SUBMITTED',
      account_status: 'pending',
      accountStatus: 'pending'
    };

    const resolvedId = finalSeller.id;

    setAwaitingOtp(false);
    setPendingOtpSeller(null);

    setSellers(prev => {
      const filtered = prev.filter(s => s.id !== resolvedId);
      const nextSellers = [finalSeller, ...filtered];
      safeSetStorageItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(nextSellers));
      return nextSellers;
    });

    safeSetStorageItem(STORAGE_KEYS.ACTIVE_USER_ID, resolvedId);
    safeSetStorageItem('tmqc_current_seller_id', resolvedId);
    setCurrentSellerId(resolvedId);
    setIsLoggedIn(true);
    setActiveSection('dashboard');
    setActiveSubTab('all');

    logActivity(resolvedId, 'Atelier Created', `Initialized new seller atelier (Verification Incomplete): ${finalSeller.sellerName}`, resolvedId);
    return { success: true, user: finalSeller };
  };

  const updateSellerProfile = (updated: Partial<SellerProfile>) => {
    if (!currentSellerId) return;
    setSellers(prev => prev.map(s => s.id === currentSellerId ? { ...s, ...updated } : s));
    logActivity(currentSellerId, 'Profile Updated', 'Seller profile details and atelier contact settings modified');
  };

  const submitSellerOnboarding = async (payload: SellerOnboardingPayload): Promise<boolean> => {
    const targetSellerId = currentSellerId || currentSeller?.id;
    if (!targetSellerId) {
      throw new Error('No active authenticated seller session found.');
    }
    const submittedAt = new Date().toISOString();
    const cleanPan = (payload.panNumber || '').trim().toUpperCase() || 'ABCDE1234F';
    const cleanGstin = payload.gstin?.trim() ? payload.gstin.trim().toUpperCase() : undefined;
    const cleanIfsc = (payload.ifscCode || '').trim().toUpperCase() || 'HDFC0000240';
    const cleanAadhaar = (payload.aadhaarNumber || '').replace(/\D/g, '');
    const cleanAccount = (payload.accountNumber || '').replace(/\D/g, '') || '50100234567890';

    let res: KycSubmitResponse | null = null;
    try {
      res = await apiSubmitKyc(payload, targetSellerId);
    } catch (apiErr: any) {
      console.warn('Backend KYC multipart submission error, trying JSON fallback:', apiErr?.message);
    }

    if (!res || !res.success) {
      try {
        console.warn('Multipart submit did not succeed, attempting apiSaveSellerKyc JSON fallback...');
        const jsonFallbackRes = await apiSaveSellerKyc(targetSellerId, {
          businessName: payload.businessName,
          sellerName: payload.businessName,
          fullLegalName: payload.fullLegalName,
          fullName: payload.fullLegalName,
          panNumber: cleanPan,
          pan: cleanPan,
          gstin: cleanGstin,
          aadhaarNumber: cleanAadhaar,
          aadhaarFrontFileName: payload.aadhaarFrontFileName,
          aadhaarBackFileName: payload.aadhaarBackFileName,
          selfieCaptured: true,
          selfieDataUrl: payload.selfieDataUrl,
          bankName: payload.bankName,
          accountHolderName: payload.accountHolderName,
          accountNumber: cleanAccount,
          ifscCode: cleanIfsc,
          kyc_status: 'UNDER_REVIEW'
        });
        if (jsonFallbackRes && jsonFallbackRes.success) {
          res = jsonFallbackRes;
        } else {
          const errMsg = res?.error || jsonFallbackRes?.error || 'Submission failed: Non-200 response from Supabase KYC endpoint.';
          throw new Error(errMsg);
        }
      } catch (jsonErr: any) {
        const errMsg = res?.error || jsonErr?.message || 'Submission failed: Non-200 response from Supabase KYC endpoint.';
        throw new Error(errMsg);
      }
    }

    setSellers(prev => {
      let found = false;
      const next = prev.map(s => {
        if (s.id !== targetSellerId) return s;
        found = true;
        return {
          ...s,
          ...(res?.user || {}),
          sellerName: payload.businessName.trim() || s.sellerName,
          fullName: payload.fullLegalName.trim() || s.fullName,
          taxId: cleanGstin || cleanPan,
          panNumber: cleanPan,
          isBusinessEntity: payload.isBusinessEntity,
          gstin: cleanGstin,
          aadhaarMasked: cleanAadhaar ? `•••• •••• ${cleanAadhaar.slice(-4)}` : s.aadhaarMasked || '•••• •••• Verified',
          selfieCaptured: true,
          selfieDataUrl: payload.selfieDataUrl || s.selfieDataUrl || '/images/seller_avatar_portrait_1794326164878.jpg',
          aadhaarFrontFileName: payload.aadhaarFrontFileName || s.aadhaarFrontFileName,
          aadhaarBackFileName: payload.aadhaarBackFileName || s.aadhaarBackFileName,
          bankInstitution: payload.bankName.trim() || s.bankInstitution || 'HDFC Bank Ltd',
          accountHolderName: payload.accountHolderName.trim() || s.accountHolderName,
          bankAccountMasked: `••••••••${cleanAccount.slice(-4)}`,
          routingOrSortCode: cleanIfsc,
          ifscCode: cleanIfsc,
          verificationStatus: 'UNDER_REVIEW' as const,
          verification_status: 'UNDER_REVIEW',
          kycStatus: 'UNDER_REVIEW' as const,
          kyc_status: 'UNDER_REVIEW',
          accountStatus: 'under_review' as const,
          account_status: 'under_review',
          verificationLevel: 'Pending Compliance Review',
          verificationScope: 'KYC & Settlement Review in Progress',
          kycSubmittedAt: submittedAt
        };
      });

      const finalSellers = found ? next : [
        ...next,
        {
          id: targetSellerId,
          sellerName: payload.businessName.trim() || 'Seller Atelier',
          fullName: payload.fullLegalName.trim() || 'Seller Legal Name',
          email: `${targetSellerId}@atelier-truemotion.com`,
          taxId: cleanGstin || cleanPan,
          panNumber: cleanPan,
          isBusinessEntity: payload.isBusinessEntity,
          gstin: cleanGstin,
          avatarUrl: payload.selfieDataUrl || '/images/seller_avatar_portrait_1794326164878.jpg',
          accountStatus: 'under_review' as const,
          account_status: 'under_review',
          verificationStatus: 'UNDER_REVIEW' as const,
          verification_status: 'UNDER_REVIEW',
          kycStatus: 'UNDER_REVIEW' as const,
          kyc_status: 'UNDER_REVIEW',
          applicationRefNumber: `APP-${Date.now().toString().slice(-5)}`,
          submittedAt,
          kycSubmittedAt: submittedAt,
          twoFactorEnabled: true,
          bankInstitution: payload.bankName.trim() || 'HDFC Bank Ltd',
          bankAccountMasked: `••••••••${cleanAccount.slice(-4)}`,
          routingOrSortCode: cleanIfsc,
          accountHolderName: payload.accountHolderName.trim() || payload.fullLegalName.trim(),
          ifscCode: cleanIfsc,
          aadhaarMasked: cleanAadhaar ? `•••• •••• ${cleanAadhaar.slice(-4)}` : '•••• •••• Verified',
          selfieCaptured: true,
          selfieDataUrl: payload.selfieDataUrl || '/images/seller_avatar_portrait_1794326164878.jpg',
          aadhaarFrontFileName: payload.aadhaarFrontFileName || 'eaadhaar_official.pdf',
          aadhaarBackFileName: payload.aadhaarBackFileName || 'aadhaar_card_back.pdf',
          verificationLevel: 'Pending Compliance Review',
          verificationScope: 'KYC & Settlement Review in Progress',
          ...(res?.user || {})
        } as SellerProfile
      ];

      safeSetStorageItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(finalSellers));
      safeSetStorageItem(STORAGE_KEYS.ACTIVE_USER_ID, targetSellerId);
      return finalSellers;
    });

    logActivity(
      targetSellerId,
      'KYC & Banking Submitted',
      `Submitted PAN (${cleanPan}), Aadhaar KYC, and ${payload.bankName.trim()} (${cleanIfsc}) for compliance review`,
      cleanPan
    );

    return true;
  };

  const checkSellerStatus = async (sellerId?: string): Promise<SellerProfile | null> => {
    const targetId = sellerId || currentSellerId;
    if (!targetId) return null;
    try {
      const res = await apiGetSellerById(targetId);
      if (res.success && res.seller) {
        const updated = normalizeSeller(res.seller);
        setSellers(prev => prev.map(s => s.id === targetId ? { ...s, ...updated } : s));
        if (updated.kycStatus === 'VERIFIED' || updated.verificationStatus === 'VERIFIED' || updated.kycStatus === 'APPROVED' || updated.verificationStatus === 'APPROVED') {
          setActiveSection('dashboard');
        }
        return updated;
      }
    } catch (err) {
      console.warn('checkSellerStatus error:', err);
    }
    return null;
  };

  const adminApproveKyc = async (sellerId?: string) => {
    const targetId = sellerId || currentSellerId;
    if (!targetId) return;
    const approvedAt = new Date().toISOString();

    try {
      const res = await apiAdminApproveKyc(targetId);
      if (res.success && res.user) {
        setSellers(prev =>
          prev.map(s =>
            s.id === targetId
              ? {
                ...s,
                ...res.user,
                verificationStatus: 'VERIFIED' as const,
                kycStatus: 'VERIFIED' as const,
                accountStatus: 'approved' as const,
                approvedAt
              }
              : s
          )
        );
      }
    } catch (e) {
      console.error('apiAdminApproveKyc error:', e);
    }

    setSellers(prev => {
      const next = prev.map(s => {
        if (s.id !== targetId) return s;
        return {
          ...s,
          verificationStatus: 'VERIFIED' as const,
          kycStatus: 'VERIFIED' as const,
          accountStatus: 'approved' as const,
          verificationLevel: 'TrueMotion QC Maker Verified',
          verificationScope: '100% Macro Dossier & Banking Verified',
          approvedAt
        };
      });
      safeSetStorageItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
      return next;
    });

    logActivity(
      targetId,
      'Atelier Approved',
      'TrueMotion QC Admin approved KYC & banking credentials. Dashboard access unlocked.',
      targetId
    );
    setActiveSection('dashboard');
  };

  const adminRejectKyc = async (sellerId?: string, reason?: string) => {
    const targetId = sellerId || currentSellerId;
    if (!targetId) return;
    const finalReason = (reason || 'Document verification failed. Please review your details and re-upload required documents.').trim();

    try {
      const res = await apiAdminRejectKyc(targetId, finalReason);
      if (res.success && (res.user || res.seller)) {
        const liveUser = res.user || res.seller;
        setSellers(prev =>
          prev.map(s =>
            s.id === targetId
              ? {
                ...s,
                ...liveUser,
                verificationStatus: 'REJECTED' as const,
                kycStatus: 'REJECTED' as const,
                rejectionReason: finalReason,
                rejection_reason: finalReason
              }
              : s
          )
        );
      }
    } catch (e) {
      console.error('apiAdminRejectKyc error:', e);
    }

    setSellers(prev => {
      const next = prev.map(s => {
        if (s.id !== targetId) return s;
        return {
          ...s,
          verificationStatus: 'REJECTED' as const,
          kycStatus: 'REJECTED' as const,
          rejectionReason: finalReason,
          rejection_reason: finalReason
        };
      });
      safeSetStorageItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
      return next;
    });

    logActivity(
      targetId,
      'Atelier Rejected',
      `Admin rejected KYC accreditation for ${targetId}: ${finalReason}`,
      targetId
    );
  };

  const deleteSellerAccount = async (sellerId?: string): Promise<boolean> => {
    const targetId = sellerId || currentSellerId;
    if (!targetId) return false;

    try {
      await apiDeleteSeller(targetId);
    } catch (e) {
      console.error('apiDeleteSeller error:', e);
    }

    setSellers(prev => {
      const remaining = prev.filter(s => s.id !== targetId);
      safeSetStorageItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(remaining));
      return remaining;
    });

    setProducts(prev => {
      const remaining = prev.filter(p => p.sellerId !== targetId);
      return remaining;
    });

    setOrders(prev => {
      const remaining = prev.filter(o => o.sellerId !== targetId);
      safeSetStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(remaining));
      return remaining;
    });

    setNotifications(prev => prev.filter(n => n.sellerId !== targetId));
    setDisputes(prev => prev.filter(d => d.sellerId !== targetId));
    setActivityLogs(prev => prev.filter(a => a.sellerId !== targetId));
    setWithdrawals(prev => prev.filter(w => w.sellerId !== targetId));

    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
    setCurrentSellerId(null);
    setIsLoggedIn(false);
    setActiveSection('dashboard');
    return true;
  };

  const verifySellerAccount = () => {
    adminApproveKyc();
  };

  const logActivity = (sellerId: string, action: string, details: string, entityRef?: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      details,
      entityRef,
      timestamp: new Date().toISOString(),
      sellerId
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const registerNewSeller = (data: {
    sellerName: string;
    email: string;
    phone: string;
    fullName: string;
    businessAddress: string;
    taxId: string;
    password?: string;
    documentType?: string;
    documentNumber?: string;
  }): string => {
    const newId = `SELLER-${Date.now()}`;
    const refNumber = `APP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newUser: SellerProfile = {
      id: newId,
      sellerName: data.sellerName.trim(),
      email: data.email.trim(),
      password: data.password || 'atelier-vault-2026',
      phone: data.phone.trim(),
      fullName: data.fullName.trim(),
      businessAddress: data.businessAddress.trim(),
      taxId: data.taxId.trim(),
      avatarUrl: '/images/seller_avatar_portrait_1794326164878.jpg',
      accountStatus: 'pending',
      verificationStatus: 'UNSUBMITTED',
      kycStatus: 'UNSUBMITTED',
      applicationRefNumber: refNumber,
      submittedAt: new Date().toISOString(),
      kycSubmittedAt: new Date().toISOString(),
      twoFactorEnabled: false,
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      bankInstitution: 'Pending Settlement Bank Verification',
      bankAccountMasked: '••••••••0000',
      routingOrSortCode: 'NOT LINKED',
      verificationLevel: 'Pending Onboarding (UNSUBMITTED)',
      verificationScope: 'KYC & Settlement Review in Progress',
      trustScore: 5.0,
      authenticPassRate: 'Awaiting Compliance Review',
      lifetimeDisbursed: 0,
      escrowFeeTier: '5% TrueMotion QC Escrow Fee Net'
    };

    const nextSellers = [...sellers, newUser];
    setSellers(nextSellers);
    safeSetStorageItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(nextSellers));
    safeSetStorageItem(STORAGE_KEYS.ACTIVE_USER_ID, newId);
    setCurrentSellerId(newId);
    setIsLoggedIn(true);
    setActiveSection('dashboard');
    setActiveSubTab('all');
    logActivity(newId, 'Atelier Accredited', `Seller credentials verified with reference ${refNumber}`, refNumber);
    return refNumber;
  };

  const addProduct = async (
    prodDataOrFormData: FormData | Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sellerId'>
  ): Promise<{ success: boolean; product?: Product; error?: string }> => {
    try {
      const activeSellerId = currentSellerId || currentSeller?.id;
      if (!activeSellerId) {
        return { success: false, error: 'No active authenticated seller session found.' };
      }

      // Handle Demo Seller in-memory creation without hitting database
      if (activeSellerId === DEMO_SELLER_ID) {
        const prodData = prodDataOrFormData instanceof FormData ? {} : (prodDataOrFormData as any);
        const newProduct: Product = {
          id: `demo-prod-${Date.now()}`,
          sku: prodData.sku || `TM-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
          name: prodData.name || prodData.title || 'Demo Horology Piece',
          title: prodData.name || prodData.title || 'Demo Horology Piece',
          category: prodData.category || 'Watches',
          price: Number(prodData.price) || 125000,
          stock: Number(prodData.stock) || 3,
          lowStockThreshold: Number(prodData.lowStockThreshold) || 1,
          description: prodData.description || 'Artisanal demo timepiece created in sandbox atelier.',
          status: 'active',
          verificationStatus: 'approved',
          images: prodData.images || ['/images/product_burgundy_watch.jpg'],
          specs: prodData.specs || { brand: 'Ashwin Horlogerie' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sellerId: DEMO_SELLER_ID,
        };
        setProducts(prev => [newProduct, ...prev]);
        logActivity(DEMO_SELLER_ID, 'Product Listed', `Listed demo item: ${newProduct.name}`, newProduct.sku);
        return { success: true, product: newProduct };
      }

      let res;

      if (typeof FormData !== 'undefined' && prodDataOrFormData instanceof FormData) {
        res = await apiCreateProduct(prodDataOrFormData, activeSellerId);
      } else {
        const prodData = prodDataOrFormData as Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sellerId'>;
        const formData = new FormData();
        formData.append('title', prodData.name || '');
        formData.append('name', prodData.name || '');
        formData.append('sku', prodData.sku || '');
        formData.append('category', prodData.category || 'Watches');
        formData.append('price', String(prodData.price || 0));
        formData.append('stock', String(prodData.stock || 1));
        formData.append('lowStockThreshold', String(prodData.lowStockThreshold || 1));
        formData.append('description', prodData.description || '');
        formData.append('seller_id', activeSellerId);
        formData.append('sellerId', activeSellerId);
        if (prodData.specs) formData.append('specs', JSON.stringify(prodData.specs));
        if (prodData.images) formData.append('images', JSON.stringify(prodData.images));
        if (prodData.anglePhotos) formData.append('macroPhotos', JSON.stringify(Object.values(prodData.anglePhotos).filter(Boolean)));
        res = await apiCreateProduct(formData, activeSellerId);
      }

      if (res.success && res.product) {
        const normalized = normalizeProduct(res.product);
        setProducts(prev => {
          const exists = prev.some(p => p.id === normalized.id || p.sku === normalized.sku);
          if (exists) {
            return prev.map(p => (p.id === normalized.id || p.sku === normalized.sku) ? { ...p, ...normalized } : p);
          }
          return [normalized, ...prev];
        });

        logActivity(
          activeSellerId,
          'Product Listed',
          `Listed new item: ${normalized.name || normalized.title} (${normalized.sku}) · Saved directly into Supabase Storage & products table.`,
          normalized.sku
        );

        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          title: 'Piece Saved to Supabase Cloud',
          message: `${res.product.name || res.product.title} (${res.product.sku}) has been saved with verified cloud photos.`,
          category: 'products',
          timestamp: new Date().toISOString(),
          read: false,
          sellerId: activeSellerId
        };
        setNotifications(prev => [notif, ...prev]);

        await refreshData();
        return { success: true, product: res.product };
      }

      return { success: false, error: res.error || 'Failed to list product in Supabase' };
    } catch (err: any) {
      console.error('addProduct error:', err);
      return { success: false, error: err.message || 'Error occurred while listing product' };
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    if (currentSellerId) {
      logActivity(currentSellerId, 'Product Updated', `Modified specifications for item #${id}`, id);
    }
  };

  const archiveProduct = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'archived', updatedAt: new Date().toISOString() } : p));
    if (currentSellerId) {
      logActivity(currentSellerId, 'Product Archived', `Moved item #${id} to catalog archive`, id);
    }
    apiUpdateProductStatus(id, 'ARCHIVED', currentSellerId || undefined).catch(err => console.warn('Archive product API error:', err));
  };

  const restoreProduct = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'active', updatedAt: new Date().toISOString() } : p));
    if (currentSellerId) {
      logActivity(currentSellerId, 'Product Restored', `Restored item #${id} to active catalog`, id);
    }
    apiUpdateProductStatus(id, 'ACTIVE', currentSellerId || undefined).catch(err => console.warn('Restore product API error:', err));
  };

  const deleteProduct = (id: string) => {
    const hasOrder = orders.some(o => o.items.some(i => i.productId === id));
    if (hasOrder) {
      archiveProduct(id);
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    if (currentSellerId) {
      logActivity(currentSellerId, 'Product Deleted', `Permanently removed item #${id} from atelier registry`, id);
    }
    apiDeleteProduct(id, currentSellerId || undefined).catch(err => console.warn('Delete product API error:', err));
  };

  const updateProductStock = async (id: string, newStock: number) => {
    const safeStock = Math.max(0, Math.floor(newStock));
    const newStatus = safeStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE';

    setProducts(prev => prev.map(p => p.id === id ? {
      ...p,
      stock: safeStock,
      status: newStatus,
      updatedAt: new Date().toISOString()
    } : p));

    if (currentSellerId) {
      logActivity(currentSellerId, 'Inventory Adjusted', `Stock quantity for item #${id} set to ${safeStock} (Status: ${newStatus})`, id);
    }

    try {
      const res = await apiUpdateProductStock(id, safeStock, currentSellerId || undefined);
      if (res.success && res.product) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...res.product } : p));
      }
    } catch (err) {
      console.error('Failed to update product stock on SQLite:', err);
    }
  };

  const bulkUpdateStock = (updates: { id: string; stock: number }[]) => {
    setProducts(prev => prev.map(p => {
      const match = updates.find(u => u.id === p.id);
      if (!match) return p;
      const safeStock = Math.max(0, Math.floor(match.stock));
      return {
        ...p,
        stock: safeStock,
        status: safeStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
        updatedAt: new Date().toISOString()
      };
    }));
    if (currentSellerId) {
      logActivity(currentSellerId, 'Bulk Inventory Update', `Updated stock count across ${updates.length} items`);
    }

    // Persist all to SQLite in parallel
    Promise.all(
      updates.map(u => apiUpdateProductStock(u.id, Math.max(0, Math.floor(u.stock)), currentSellerId || undefined))
    ).catch(err => console.error('Bulk stock update error:', err));
  };

  const simulateReturn = async (
    orderId: string,
    orderData?: Partial<Order> | string,
    returnReason?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> => {
    try {
      let payload: any = {};
      if (typeof orderData === 'string') {
        payload.id = orderId;
        payload.returnReason = orderData;
      } else if (orderData && typeof orderData === 'object') {
        const item = orderData.items?.[0];
        payload = {
          ...orderData,
          id: orderData.id || orderId,
          sku: orderData.sku || item?.sku || 'SKU-9426009',
          productTitle: orderData.productTitle || orderData.productName || orderData.title || item?.productName || 'Luxury Mechanical Watch',
          buyerName: orderData.buyerName || orderData.customerName || 'Verified Collector',
          amount: orderData.amount || orderData.price || orderData.totalAmount || 42500,
          quantity: orderData.quantity || item?.quantity || 1,
          returnReason: returnReason || orderData.returnReason || 'Buyer requested return — size/fit check'
        };
      } else {
        payload = {
          id: orderId,
          returnReason: returnReason || 'Buyer requested return — size/fit check'
        };
      }

      const res = await apiSimulateReturn(orderId, payload, currentSellerId || undefined);
      if (res.success && res.order) {
        const normalizedOrder = normalizeOrder(res.order);
        // Immediately update local state
        setOrders(prev => {
          const exists = prev.some(o => o.id === orderId || o.orderNumber === orderId);
          if (exists) {
            return prev.map(o => (o.id === orderId || o.orderNumber === orderId) ? { ...o, ...normalizedOrder } : o);
          }
          return [normalizedOrder, ...prev];
        });

        // Trigger live refresh from SQLite/Supabase
        await refreshOrders();
        await refreshData();

        logActivity(
          currentSellerId || 'SELLER',
          'Buyer Return Simulated',
          `Order #${normalizedOrder.orderNumber || orderId} moved to RETURN_IN_TRANSIT: "${normalizedOrder.returnReason || payload.returnReason || 'Buyer requested return — size/fit check'}"`,
          normalizedOrder.orderNumber || orderId
        );
        const notif: NotificationItem = {
          id: `notif-ret-${Date.now()}`,
          title: 'Return In Transit',
          message: `Buyer initiated return for Order #${normalizedOrder.orderNumber || orderId}. Inspection verification required upon arrival.`,
          category: 'orders',
          timestamp: new Date().toISOString(),
          read: false,
          sellerId: currentSellerId || ''
        };
        setNotifications(prev => [notif, ...prev]);
        return { success: true, order: normalizedOrder };
      }
      return { success: false, error: res.error || 'Failed to simulate return.' };
    } catch (err: any) {
      console.error('simulateReturn error:', err);
      return { success: false, error: err.message };
    }
  };

  const advanceOrderStage = async (
    orderId: string,
    status?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> => {
    try {
      const res = await apiAdvanceOrderStage(orderId, status, currentSellerId || undefined);
      if (res.success && res.order) {
        const normalizedOrder = normalizeOrder(res.order);
        setOrders(prev => {
          const exists = prev.some(o => o.id === orderId || o.orderNumber === orderId);
          if (exists) {
            return prev.map(o => (o.id === orderId || o.orderNumber === orderId) ? { ...o, ...normalizedOrder } : o);
          }
          return [normalizedOrder, ...prev];
        });

        await refreshOrders();
        await refreshData();

        logActivity(
          currentSellerId || 'SELLER',
          'Pipeline Stage Advanced',
          `Order #${orderId} stage advanced to ${normalizedOrder.status || status} via Zero-Hub Digital-QC & Direct Express dispatch pipeline.`,
          orderId
        );

        return { success: true, order: normalizedOrder };
      }
      return { success: false, error: res.error || 'Failed to advance order stage' };
    } catch (err: any) {
      console.error('advanceOrderStage error:', err);
      return { success: false, error: err.message };
    }
  };

  const processReturn = async (
    orderId: string,
    action: 'RESTOCK' | 'DISPUTE',
    sku?: string,
    quantity?: number
  ): Promise<{ success: boolean; order?: Order; product?: Product; error?: string }> => {
    try {
      const res = await apiProcessReturn(orderId, action, { sku, quantity }, currentSellerId || undefined);
      if (res.success && res.order) {
        const normalizedOrder = normalizeOrder(res.order);
        setOrders(prev => prev.map(o => (o.id === orderId || o.orderNumber === orderId) ? { ...o, ...normalizedOrder } : o));
        if (action === 'RESTOCK' && res.product) {
          const normalizedProduct = normalizeProduct(res.product);
          setProducts(prev => {
            const exists = prev.some(p => p.id === normalizedProduct.id || p.sku === normalizedProduct.sku);
            if (exists) {
              return prev.map(p => (p.id === normalizedProduct.id || p.sku === normalizedProduct.sku) ? { ...p, ...normalizedProduct } : p);
            }
            return [normalizedProduct, ...prev];
          });
        }

        // Refresh products and orders from SQLite to ensure total sync
        await refreshOrders();
        await refreshData();

        const isRestock = action === 'RESTOCK';
        logActivity(
          currentSellerId || 'SELLER',
          isRestock ? 'Return Restocked' : 'Return Disputed (Blocked)',
          isRestock
            ? `Verified return intact for Order #${res.order.orderNumber || orderId}. Stock restored (+${res.order.quantity || 1}).`
            : `Flagged tampered/fake return for Order #${res.order.orderNumber || orderId} to Admin. Stock remains blocked.`,
          res.order.orderNumber || orderId
        );

        const notif: NotificationItem = {
          id: `notif-proc-${Date.now()}`,
          title: isRestock ? 'Return Restocked & Relisted' : 'Return Disputed & Flagged',
          message: isRestock
            ? `Order #${res.order.orderNumber || orderId} verified intact. Stock auto-replenished and listed active.`
            : `Order #${res.order.orderNumber || orderId} flagged as tampered. Escrow hold maintained for admin dispute investigation.`,
          category: 'orders',
          timestamp: new Date().toISOString(),
          read: false,
          sellerId: currentSellerId || ''
        };
        setNotifications(prev => [notif, ...prev]);

        return { success: true, order: res.order, product: res.product };
      }
      return { success: false, error: res.error || 'Failed to process return.' };
    } catch (err: any) {
      console.error('processReturn error:', err);
      return { success: false, error: err.message };
    }
  };

  const updateOrderStatus = (orderId: string, status: Order['status'], tracking?: string, carrier?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status,
          trackingNumber: tracking || o.trackingNumber,
          carrier: carrier || o.carrier,
          escrowStatus: status === 'delivered' ? 'released' : o.escrowStatus
        };
      }
      return o;
    }));
    if (currentSellerId) {
      logActivity(currentSellerId, 'Order Status Changed', `Order #${orderId} marked as ${status.toUpperCase()}`, orderId);
    }
  };

  const simulateDemoQcVerification = () => {
    if (!currentSellerId) return null;

    const nowIso = new Date().toISOString();
    const pendingCandidate =
      sellerOrders.find(o => o.status === 'shipping') ||
      sellerOrders.find(o => o.status === 'packing');

    if (pendingCandidate) {
      setOrders(prev =>
        prev.map(o =>
          o.id === pendingCandidate.id
            ? {
              ...o,
              status: 'delivered',
              escrowStatus: 'released',
              orderDate: nowIso,
            }
            : o
        )
      );

      const productName = pendingCandidate.items[0]?.productName || 'Luxury Piece';
      logActivity(
        currentSellerId,
        'TMQC Verification Passed',
        `Demo QC passed for order ${pendingCandidate.orderNumber} (${productName}). Escrow of ₹${pendingCandidate.totalAmount.toLocaleString()} released.`,
        pendingCandidate.orderNumber
      );

      const notif: NotificationItem = {
        id: `notif-qc-${Date.now()}`,
        title: 'TMQC Verified & Escrow Released',
        message: `Order ${pendingCandidate.orderNumber} passed TrueMotion QC and was delivered. ₹${pendingCandidate.totalAmount.toLocaleString()} settled.`,
        category: 'orders',
        timestamp: nowIso,
        read: false,
        sellerId: currentSellerId,
      };
      setNotifications(prev => [notif, ...prev]);

      // Sync with backend API (POST /api/demo/qc-verify)
      apiDemoQcVerify(currentSellerId).then(res => {
        apiGetEscrowSummary(currentSellerId).then(es => {
          if (es.success && es.summary) setApiEscrowSummary(es.summary);
        });
      }).catch(console.error);

      return {
        orderNumber: pendingCandidate.orderNumber,
        amount: pendingCandidate.totalAmount,
        productName,
        mode: 'promoted' as const,
      };
    }

    // No pending packing/shipping order — create a realistic QC-verified Delivered demo order for this seller
    const demoCatalog = [
      {
        name: 'Luxury Mechanical Watch',
        sku: 'SKU-9426009',
        price: 42500,
        image: '/images/product_burgundy_watch.jpg',
        customer: 'Vikram Singhania',
      },
      {
        name: 'Tailored Cashmere Overcoat',
        sku: 'SKU-9325005',
        price: 28500,
        image: '/images/product_burgundy_apparel.jpg',
        customer: 'Meera Deshmukh',
      },
      {
        name: 'Heritage Leather Satchel',
        sku: 'SKU-9426003',
        price: 34200,
        image: '/images/product_burgundy_leather.jpg',
        customer: 'Kabir Malhotra',
      },
    ];

    const pickIdx = sellerOrders.length % demoCatalog.length;
    const sellerProd = sellerProducts[pickIdx % Math.max(sellerProducts.length, 1)];
    const fallback = demoCatalog[pickIdx];

    const productName = sellerProd?.name || fallback.name;
    const sku = sellerProd?.sku || fallback.sku;
    const price = sellerProd?.price || fallback.price;
    const image = sellerProd?.images?.[0] || fallback.image;
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const orderNumber = `44A${suffix}`;

    const newDeliveredOrder: Order = {
      id: `ord-demo-qc-${Date.now()}`,
      orderNumber,
      customerName: fallback.customer,
      customerEmail: 'verified-collector@truemotion-qc-escrow.in',
      shippingAddress: 'TrueMotion QC Vault Verified Delivery — Mumbai 400020',
      orderDate: nowIso,
      status: 'delivered',
      items: [
        {
          productId: sellerProd?.id || `demo-prod-${pickIdx}`,
          productName,
          sku,
          price,
          quantity: 1,
          image,
        },
      ],
      subtotal: price,
      shippingFee: 0,
      totalAmount: price,
      escrowStatus: 'released',
      trackingNumber: `TM-QC-${suffix}`,
      carrier: 'TrueMotion QC Armored Express',
      sellerId: currentSellerId,
    };

    setOrders(prev => [newDeliveredOrder, ...prev]);

    logActivity(
      currentSellerId,
      'TMQC Verification Passed',
      `Demo QC settlement ${orderNumber} (${productName}) verified & delivered. ₹${price.toLocaleString()} credited to revenue.`,
      orderNumber
    );

    const notif: NotificationItem = {
      id: `notif-qc-${Date.now()}`,
      title: 'TMQC Verified & Escrow Released',
      message: `Order ${orderNumber} (${productName}) passed TrueMotion QC. ₹${price.toLocaleString()} settled to your revenue ledger.`,
      category: 'orders',
      timestamp: nowIso,
      read: false,
      sellerId: currentSellerId,
    };
    setNotifications(prev => [notif, ...prev]);

    return {
      orderNumber,
      amount: price,
      productName,
      mode: 'created' as const,
    };
  };

  const dispatchBlindOrder = (
    orderId: string,
    waybillId: string,
    trackingNumber: string,
    carrier: string = 'TrueMotion Direct Express Courier'
  ) => {
    const dispatchedAt = new Date().toISOString();
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'IN_DIRECT_TRANSIT',
            blindWaybillId: waybillId,
            blindDestination: 'Direct Express to Buyer (Masked Waybill)',
            trackingNumber,
            carrier,
            dispatchedAt
          };
        }
        return o;
      })
    );
    if (currentSellerId) {
      logActivity(
        currentSellerId,
        'Direct Waybill Dispatched',
        `Generated direct express shipping label ${waybillId} (${trackingNumber}) routed directly to buyer with privacy-masked waybill`,
        waybillId
      );
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Dispatched via Direct Express',
        message: `Direct waybill ${waybillId} active. Parcel is now In Direct Transit (${trackingNumber}).`,
        category: 'orders',
        timestamp: dispatchedAt,
        read: false,
        sellerId: currentSellerId
      };
      setNotifications(prev => [notif, ...prev]);

      // Transmit Blind Waybill to Backend API (POST /api/orders/:id/waybill)
      apiCreateWaybill(orderId, carrier, currentSellerId).then(res => {
        if (res.success && res.order) {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...res.order } : o));
        }
        apiGetEscrowSummary(currentSellerId).then(es => {
          if (es.success && es.summary) setApiEscrowSummary(es.summary);
        });
      }).catch(console.error);
    }
  };

  const submitPackingEvidence = (orderId: string, evidence: {
    packageWeightKg: number;
    notes: string;
    photos: string[];
    hasVideoProof: boolean;
  }) => {
    const refId = `PK-PROOF-2026-${Math.floor(1000 + Math.random() * 9000)}-${orderId.slice(-4).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: o.status === 'packing' ? 'shipping' : o.status,
          packingEvidence: {
            referenceId: refId,
            timestamp,
            packageWeightKg: evidence.packageWeightKg,
            notes: evidence.notes,
            photos: evidence.photos,
            hasVideoProof: evidence.hasVideoProof
          }
        };
      }
      return o;
    }));

    if (currentSellerId) {
      logActivity(currentSellerId, 'Packing Evidence Recorded', `Dispute-proof packing record ${refId} saved for order #${orderId}`, refId);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Packing Evidence Sealed',
        message: `Packing proof ${refId} verified with weight ${evidence.packageWeightKg}kg. Ready for carrier dispatch.`,
        category: 'orders',
        timestamp,
        read: false,
        sellerId: currentSellerId
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const uploadOrderPackingVideo = async (orderId: string, videoBlob: Blob) => {
    const sellerId = currentSellerId || '';
    try {
      const res = await apiUploadPackingVideo(orderId, videoBlob, sellerId);
      if (res.success && res.order) {
        setOrders(prev =>
          prev.map(o =>
            o.id === orderId
              ? {
                ...o,
                ...res.order,
                status: 'READY_FOR_PICKUP',
                packingVideoUrl: res.packingVideoUrl || res.order?.packingVideoUrl,
                packingVerifiedAt: res.packingVerifiedAt || res.order?.packingVerifiedAt || new Date().toISOString()
              }
              : o
          )
        );

        logActivity(
          sellerId,
          'Live Packing Video Archived',
          `In-app live recorded packing proof verified for order #${res.order.orderNumber || orderId}. Order marked READY_FOR_PICKUP.`,
          orderId
        );

        const notif: NotificationItem = {
          id: `notif-pack-${Date.now()}`,
          title: 'Live Packing Video Sealed',
          message: `Watermarked packing proof recorded & archived for Order #${res.order.orderNumber || orderId}. Status updated to READY_FOR_PICKUP.`,
          category: 'orders',
          timestamp: new Date().toISOString(),
          read: false,
          sellerId
        };
        setNotifications(prev => [notif, ...prev]);

        return res;
      }

      // Local fallback if server endpoint is offline
      const localUrl = URL.createObjectURL(videoBlob);
      const verifiedAt = new Date().toISOString();
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? {
              ...o,
              status: 'READY_FOR_PICKUP',
              packingVideoUrl: localUrl,
              packingVerifiedAt: verifiedAt
            }
            : o
        )
      );

      return {
        success: true,
        packingVideoUrl: localUrl,
        packingVerifiedAt: verifiedAt
      };
    } catch (err: any) {
      console.error('uploadOrderPackingVideo error:', err);
      const localUrl = URL.createObjectURL(videoBlob);
      const verifiedAt = new Date().toISOString();
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? {
              ...o,
              status: 'READY_FOR_PICKUP',
              packingVideoUrl: localUrl,
              packingVerifiedAt: verifiedAt
            }
            : o
        )
      );

      return {
        success: true,
        packingVideoUrl: localUrl,
        packingVerifiedAt: verifiedAt
      };
    }
  };

  const resubmitProductEvidence = (productId: string, note: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          verificationStatus: 'human_review',
          reviewerNotes: `Additional evidence provided by seller: "${note}". Re-queued for master specialist review.`,
          missingEvidenceChecklist: [],
          qcRejectionReasons: undefined,
          failedAngleIndex: undefined,
          failedAngleLabel: undefined,
          returnTracking: undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    if (currentSellerId) {
      logActivity(currentSellerId, 'QC Evidence Submitted', `Submitted supplemental macro evidence for product #${productId}`, productId);
    }
  };

  const approveProductQc = (productId: string) => {
    const nowIso = new Date().toISOString();
    const target = products.find(p => p.id === productId);

    setProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        return {
          ...p,
          status: 'active',
          verificationStatus: 'approved',
          reviewerNotes: 'TMQC Verified (Stage 04 / 04): 6-angle optical & physical authentication passed. Escrow active.',
          qcRejectionReasons: undefined,
          failedAngleIndex: undefined,
          failedAngleLabel: undefined,
          returnTracking: undefined,
          updatedAt: nowIso
        };
      })
    );

    if (currentSellerId && target) {
      logActivity(
        currentSellerId,
        'TMQC Verification Approved',
        `Lot ${target.sku} (${target.name}) passed Stage 04 / 04 and is now TMQC Verified.`,
        target.sku
      );
      const notif: NotificationItem = {
        id: `notif-qc-pass-${Date.now()}`,
        title: 'TMQC Verified & Approved',
        message: `Lot ${target.sku} (${target.name}) passed full TrueMotion QC verification. Escrow is now active.`,
        category: 'products',
        timestamp: nowIso,
        read: false,
        sellerId: currentSellerId
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const advanceProductQcStage = (productId: string): VerificationStage | null => {
    const target = products.find(p => p.id === productId);
    if (!target) return null;

    const current = target.verificationStatus;
    let nextStage: VerificationStage;
    let stageNote: string;

    if (current === 'submitted') {
      nextStage = 'ai_review';
      stageNote = 'Stage 02 / 04: AI Optical Check in progress — Macro Engraving ML scanning 6 authentication angles.';
    } else if (current === 'ai_review') {
      nextStage = 'human_review';
      stageNote = 'Stage 03 / 04: Digital-QC & Direct Express Dispatch — 6-Angle Macro & Live Packing Proof Verified.';
    } else if (current === 'human_review' || current === 'additional_evidence') {
      approveProductQc(productId);
      return 'approved';
    } else {
      return current;
    }

    const nowIso = new Date().toISOString();
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
            ...p,
            verificationStatus: nextStage,
            reviewerNotes: stageNote,
            updatedAt: nowIso
          }
          : p
      )
    );

    if (currentSellerId) {
      logActivity(
        currentSellerId,
        'QC Pipeline Advanced',
        `Lot ${target.sku} advanced to ${nextStage === 'ai_review' ? 'Stage 02 / 04 (AI Optical Check)' : 'Stage 03 / 04 (Digital-QC & Direct Express Dispatch)'}`,
        target.sku
      );
    }

    return nextStage;
  };

  const failProductQc = (
    productId: string,
    defectReason: string,
    failedAngleIndex: number = 5,
    failedAngleLabel: string = '06 Macro Serial'
  ) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const estDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
    const timestampShort = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) +
      ', ' +
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const trackingCode = `TM-RET-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sellerAddress = currentSeller?.businessAddress || 'Registered Seller Atelier Address';
    const sellerAtelier = currentSeller?.sellerName || 'Seller Atelier';
    const target = products.find(p => p.id === productId);

    setProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        return {
          ...p,
          status: 'draft',
          verificationStatus: 'rejected',
          reviewerNotes: `QC Failed (${failedAngleLabel}): ${defectReason}`,
          qcRejectionReasons: [defectReason],
          failedAngleIndex,
          failedAngleLabel,
          returnTracking: {
            trackingNumber: trackingCode,
            carrier: 'TrueMotion QC Insured Armored Return',
            estimatedDelivery: estDate,
            steps: [
              {
                label: 'QC Flagged & Tamper-Sealed',
                timestamp: timestampShort,
                detail: `Digital QC audit flagged discrepancy (${failedAngleLabel}). Product withheld from live marketplace without physical hub transit.`,
                status: 'completed'
              },
              {
                label: 'Insured Return Transit to Atelier',
                timestamp: 'Active Courier Leg',
                detail: `Armored courier routing parcel back to ${sellerAtelier} (${sellerAddress}).`,
                status: 'active'
              },
              {
                label: 'Delivered to Seller Atelier',
                timestamp: `Est. ${estDate}`,
                detail: `Signature & tamper-seal verification required upon delivery at ${sellerAddress}.`,
                status: 'pending'
              }
            ]
          },
          updatedAt: nowIso
        };
      })
    );

    if (currentSellerId && target) {
      logActivity(
        currentSellerId,
        'QC Failed · Return Triggered',
        `Lot ${target.sku} failed QC (${failedAngleLabel}): ${defectReason}. Return tracking ${trackingCode} initiated.`,
        trackingCode
      );
      const notif: NotificationItem = {
        id: `notif-qc-fail-${Date.now()}`,
        title: 'QC Failed — Insured Return Active',
        message: `Lot ${target.sku} (${target.name}) failed TMQC inspection: ${defectReason}. Tracking ${trackingCode}.`,
        category: 'alerts',
        timestamp: nowIso,
        read: false,
        sellerId: currentSellerId
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => n.sellerId === currentSellerId ? { ...n, read: true } : n));
  };

  const submitDisputeDefense = (disputeId: string, defenseNote: string) => {
    const nowIso = new Date().toISOString();
    const target = disputes.find(d => d.id === disputeId);

    setDisputes(prev =>
      prev.map(d => {
        if (d.id !== disputeId) return d;
        return {
          ...d,
          status: 'evidence_submitted',
          defenseNotes: defenseNote.trim() || 'TMQC packing proof and carrier handover dossier transmitted for arbitration.',
        };
      })
    );

    if (currentSellerId && target) {
      logActivity(
        currentSellerId,
        'Dispute Defense Transmitted',
        `Submitted Seller Protection evidence dossier for ${target.orderNumber}`,
        target.orderNumber
      );
      const notif: NotificationItem = {
        id: `notif-disp-${Date.now()}`,
        title: 'Dispute Defense Packet Logged',
        message: `Your evidence packet for ${target.orderNumber} is locked with TrueMotion QC Arbitration.`,
        category: 'alerts',
        timestamp: nowIso,
        read: false,
        sellerId: currentSellerId,
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const requestWithdrawal = (amount?: number): PayoutWithdrawal | null => {
    if (!currentSellerId) return null;
    const withdrawAmt = typeof amount === 'number' ? Math.min(amount, financialSummary.availableBalance) : financialSummary.availableBalance;
    if (withdrawAmt <= 0) return null;

    const nowIso = new Date().toISOString();
    const ref = `WD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const bankLabel = `${currentSeller?.bankInstitution || 'Commercial Bank'} (${currentSeller?.bankAccountMasked || '••••4819'})`;

    const record: PayoutWithdrawal = {
      id: `wd-${Date.now()}`,
      reference: ref,
      amount: withdrawAmt,
      bankLabel,
      timestamp: nowIso,
      status: 'processing',
      sellerId: currentSellerId,
    };

    setWithdrawals(prev => [record, ...prev]);

    // Transmit withdrawal to Backend API (POST /api/withdrawals)
    apiCreateWithdrawal(withdrawAmt, bankLabel, currentSellerId).then(() => {
      apiGetEscrowSummary(currentSellerId).then(es => {
        if (es.success && es.summary) setApiEscrowSummary(es.summary);
      });
    }).catch(console.error);

    logActivity(
      currentSellerId,
      'Bank Payout Requested',
      `Initiated settlement transfer ${ref} of ₹${withdrawAmt.toLocaleString()} to ${bankLabel}`,
      ref
    );

    const notif: NotificationItem = {
      id: `notif-wd-${Date.now()}`,
      title: 'Settlement Transfer Initiated',
      message: `₹${withdrawAmt.toLocaleString()} transfer (${ref}) queued for ${bankLabel}.`,
      category: 'payments',
      timestamp: nowIso,
      read: false,
      sellerId: currentSellerId,
    };
    setNotifications(prev => [notif, ...prev]);

    return record;
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentSeller,
        isLoggedIn,
        isVerifyingSession,
        awaitingOtp,
        setAwaitingOtp,
        pendingOtpSeller,
        setPendingOtpSeller,
        login,
        loginDemoSeller,
        verifyCredentials,
        verifyLoginOtp,
        resendLoginOtp,
        authenticateUser,
        createAccount,
        logout,
        updateSellerProfile,
        submitSellerOnboarding,
        verifySellerAccount,
        adminApproveKyc,
        adminRejectKyc,
        checkSellerStatus,
        deleteSellerAccount,
        registerNewSeller,
        registerNewMerchant: registerNewSeller,
        activeSection,
        setActiveSection,
        activeSubTab,
        setActiveSubTab,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        openAddProductWizard,
        setOpenAddProductWizard,
        products: sellerProducts,
        orders: sellerOrders,
        disputes: sellerDisputes,
        notifications: sellerNotifications,
        activityLogs: sellerActivity,
        addProduct,
        updateProduct,
        archiveProduct,
        restoreProduct,
        deleteProduct,
        updateProductStock,
        bulkUpdateStock,
        updateOrderStatus,
        dispatchBlindOrder,
        submitPackingEvidence,
        uploadOrderPackingVideo,
        simulateReturn,
        advanceOrderStage,
        processReturn,
        refreshData,
        refreshOrders,
        resubmitProductEvidence,
        advanceProductQcStage,
        approveProductQc,
        failProductQc,
        simulateDemoQcVerification,
        markNotificationRead,
        markAllNotificationsRead,
        submitDisputeDefense,
        withdrawals: sellerWithdrawals,
        requestWithdrawal,
        financialSummary
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
