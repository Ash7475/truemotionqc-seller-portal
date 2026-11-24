import type {
  SellerProfile,
  Product,
  Order,
  FinancialSummary,
  ActivityLog,
  NotificationItem,
  VerificationStage
} from '../types';

export const API_BASE_URL = 
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:5000/api';

// ==========================================
// SHARED TYPES & INTERFACES
// ==========================================

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

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface SignupRequest {
  id?: string;
  atelierName: string;
  email: string;
  password: string;
  sellerName?: string;
  phone?: string;
  fullName?: string;
  businessAddress?: string;
  taxId?: string;
}

export interface AuthResponse extends ApiResponse {
  user?: SellerProfile;
  seller?: SellerProfile;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends ApiResponse {
  requires2FA?: boolean;
  email?: string;
  sellerId?: string;
  token?: string;
  user?: SellerProfile;
  seller?: SellerProfile;
  devOtp?: string;
}

export interface SendOtpRequest {
  email?: string;
  sellerId?: string;
}

export interface SendOtpResponse extends ApiResponse {
  email?: string;
  sellerId?: string;
  devOtp?: string;
  expiresAt?: string;
}

export interface VerifyOtpRequest {
  email?: string;
  sellerId?: string;
  otp: string;
}

export interface VerifyOtpResponse extends ApiResponse {
  user?: SellerProfile;
  seller?: SellerProfile;
  token?: string;
}

export interface KycSubmitResponse extends ApiResponse {
  status?: string;
  pennyDropMatch?: boolean;
  pennyDropRef?: string;
  user?: SellerProfile;
  seller?: SellerProfile;
}

export interface KycStatusResponse extends ApiResponse {
  sellerId?: string;
  verificationStatus?: string;
  accountStatus?: string;
  panVerified?: boolean;
  gstinVerified?: boolean;
  selfieVerified?: boolean;
  pennyDropVerified?: boolean;
  pennyDropStatus?: string;
  pennyDropRef?: string | null;
  canAccessCatalog?: boolean;
}

export interface PendingKycResponse extends ApiResponse {
  count?: number;
  pendingSellers?: SellerProfile[];
  sellers?: SellerProfile[];
}

export interface AdminApproveKycResponse extends ApiResponse {
  user?: SellerProfile;
  seller?: SellerProfile;
}

export interface AdminRejectKycResponse extends ApiResponse {
  user?: SellerProfile;
  seller?: SellerProfile;
}

export interface ProductResponse extends ApiResponse {
  product?: Product;
}

export interface ProductsResponse extends ApiResponse {
  products?: Product[];
}

export interface UpdateStockResponse extends ApiResponse {
  product?: Product;
}

export interface SimulateReturnResponse extends ApiResponse {
  order?: Order;
}

export interface ProcessReturnResponse extends ApiResponse {
  order?: Order;
  product?: Product;
  action?: 'RESTOCK' | 'DISPUTE';
}

export interface OrderResponse extends ApiResponse {
  order?: Order;
}

export interface OrdersResponse extends ApiResponse {
  orders?: Order[];
  count?: number;
}

export interface WaybillResponse extends ApiResponse {
  waybillId?: string;
  trackingNumber?: string;
  carrier?: string;
  blindDestination?: string;
  order?: Order;
}

export interface PackingEvidencePayload {
  packageWeightKg: number;
  notes: string;
  photos: string[];
  hasVideoProof: boolean;
}

export interface PackingVideoResponse extends ApiResponse {
  packingVideoUrl?: string;
  packingVerifiedAt?: string;
  order?: Order;
}

export interface AdminOrdersResponse extends ApiResponse {
  count?: number;
  orders?: (Order & {
    sellerName?: string;
    sellerEmail?: string;
    packingVideoUrl?: string | null;
    packingVerifiedAt?: string | null;
  })[];
}

export interface EscrowSummaryResponse extends ApiResponse {
  summary?: FinancialSummary;
}

export interface ProfileResponse extends ApiResponse {
  seller?: SellerProfile;
  user?: SellerProfile;
}

export interface WithdrawalResponse extends ApiResponse {
  withdrawal?: PayoutWithdrawal;
}

export interface WithdrawalsResponse extends ApiResponse {
  withdrawals?: PayoutWithdrawal[];
}

export interface ActivityResponse extends ApiResponse {
  logs?: ActivityLog[];
}

export interface NotificationsResponse extends ApiResponse {
  notifications?: NotificationItem[];
}

export interface DemoQcVerifyResponse extends ApiResponse {
  order?: Order;
  mode?: 'promoted' | 'created';
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  database: string;
  timestamp: string;
}

// ==========================================
// HTTP REQUEST HELPER
// ==========================================

interface RequestOptions extends RequestInit {
  sellerId?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T extends ApiResponse<any>>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { sellerId, params, headers: customHeaders, body, ...restOptions } = options;

  let url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>)
  };

  if (sellerId) {
    headers['x-seller-id'] = sellerId;
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && body && typeof body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...restOptions,
      headers,
      body
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Request failed with status ${res.status}`
      } as T;
    }

    return (data || { success: true }) as T;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network request failed'
    } as T;
  }
}

// ==========================================
// 1. AUTHENTICATION & ONBOARDING
// ==========================================

export interface CheckEmailResponse extends ApiResponse {
  exists: boolean;
  message?: string;
}

export async function apiCheckEmail(email: string): Promise<CheckEmailResponse> {
  const cleanEmail = email.trim().toLowerCase();
  return request<CheckEmailResponse>(`/auth/check-email?email=${encodeURIComponent(cleanEmail)}`, {
    method: 'GET'
  });
}

export async function apiSignup(data: SignupRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiLogin(credentials: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function apiSendOtp(payload: SendOtpRequest): Promise<SendOtpResponse> {
  return request<SendOtpResponse>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function apiVerifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return request<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ==========================================
// 2. KYC & COMPLIANCE GATE
// ==========================================

export async function apiSubmitKyc(
  payload: SellerOnboardingPayload,
  sellerId?: string
): Promise<KycSubmitResponse> {
  const formData = new FormData();
  if (sellerId) {
    formData.append('sellerId', sellerId);
    formData.append('id', sellerId);
  }
  formData.append('businessName', payload.businessName || '');
  formData.append('panNumber', payload.panNumber || '');
  formData.append('isBusinessEntity', String(payload.isBusinessEntity));
  if (payload.gstin) formData.append('gstin', payload.gstin);
  formData.append('fullLegalName', payload.fullLegalName || '');
  formData.append('aadhaarNumber', payload.aadhaarNumber || '');
  formData.append('aadhaarFrontFileName', payload.aadhaarFrontFileName || '');
  formData.append('aadhaarBackFileName', payload.aadhaarBackFileName || '');
  formData.append('selfieCaptured', String(payload.selfieCaptured));
  if (payload.selfieDataUrl) formData.append('selfieDataUrl', payload.selfieDataUrl);
  formData.append('bankName', payload.bankName || '');
  formData.append('accountHolderName', payload.accountHolderName || '');
  formData.append('accountNumber', payload.accountNumber || '');
  formData.append('ifscCode', payload.ifscCode || '');

  if (payload.aadhaarFrontFile instanceof File) {
    formData.append('aadhaarFront', payload.aadhaarFrontFile, payload.aadhaarFrontFile.name);
  }
  if (payload.aadhaarBackFile instanceof File) {
    formData.append('aadhaarBack', payload.aadhaarBackFile, payload.aadhaarBackFile.name);
  }

  return request<KycSubmitResponse>('/kyc/submit', {
    method: 'POST',
    sellerId,
    body: formData
  });
}

export async function apiSaveSellerKyc(
  sellerId: string,
  payload: Partial<SellerOnboardingPayload> | Record<string, any>
): Promise<KycSubmitResponse> {
  return request<KycSubmitResponse>(`/sellers/${encodeURIComponent(sellerId)}/kyc`, {
    method: 'POST',
    sellerId,
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function apiGetSellerById(sellerId: string): Promise<ProfileResponse> {
  return request<ProfileResponse>(`/sellers/${encodeURIComponent(sellerId)}`, {
    method: 'GET',
    sellerId
  });
}

export async function apiGetKycStatus(sellerId?: string): Promise<KycStatusResponse> {
  return request<KycStatusResponse>('/kyc/status', {
    method: 'GET',
    sellerId,
    params: sellerId ? { sellerId } : undefined
  });
}

export async function apiGetPendingKyc(): Promise<PendingKycResponse> {
  return request<PendingKycResponse>('/admin/kyc/pending', {
    method: 'GET'
  });
}

export async function apiAdminApproveKyc(sellerId: string): Promise<AdminApproveKycResponse> {
  return request<AdminApproveKycResponse>(`/admin/kyc/${encodeURIComponent(sellerId)}/approve`, {
    method: 'PATCH',
    sellerId
  });
}

export async function apiAdminRejectKyc(sellerId: string, reason: string): Promise<AdminRejectKycResponse> {
  return request<AdminRejectKycResponse>(`/admin/kyc/${encodeURIComponent(sellerId)}/reject`, {
    method: 'PATCH',
    sellerId,
    body: JSON.stringify({ reason })
  });
}

export async function apiDeleteSeller(sellerId: string): Promise<ApiResponse> {
  return request<ApiResponse>(`/seller/${encodeURIComponent(sellerId)}`, {
    method: 'DELETE',
    sellerId
  });
}

// ==========================================
// 3. PRODUCTS & 6-ANGLE INTAKE
// ==========================================

export async function apiCreateProduct(
  productData: FormData | (Partial<Product> & Record<string, any>),
  sellerId?: string
): Promise<ProductResponse> {
  const isForm = typeof FormData !== 'undefined' && productData instanceof FormData;
  return request<ProductResponse>('/products', {
    method: 'POST',
    sellerId: sellerId || (!isForm ? (productData as any).sellerId : undefined),
    body: isForm ? productData : JSON.stringify(productData)
  });
}

export async function apiGetProducts(sellerId?: string): Promise<ProductsResponse> {
  return request<ProductsResponse>('/products', {
    method: 'GET',
    sellerId,
    params: sellerId ? { sellerId } : undefined
  });
}

export async function apiUpdateProductStock(
  productId: string,
  stock: number,
  sellerId?: string
): Promise<UpdateStockResponse> {
  return request<UpdateStockResponse>(`/products/${encodeURIComponent(productId)}/stock`, {
    method: 'PATCH',
    sellerId,
    body: JSON.stringify({ stock })
  });
}

export async function apiAdvanceProductStage(
  productId: string,
  sellerId?: string
): Promise<ProductResponse> {
  return request<ProductResponse>(`/products/${encodeURIComponent(productId)}/stage`, {
    method: 'POST',
    sellerId
  });
}

export async function apiApproveProduct(
  productId: string,
  sellerId?: string
): Promise<ProductResponse> {
  return request<ProductResponse>(`/products/${encodeURIComponent(productId)}/approve`, {
    method: 'POST',
    sellerId
  });
}

export async function apiFailProduct(
  productId: string,
  payload?: { defectReason?: string; failedAngleIndex?: number; failedAngleLabel?: string },
  sellerId?: string
): Promise<ProductResponse> {
  return request<ProductResponse>(`/products/${encodeURIComponent(productId)}/fail`, {
    method: 'POST',
    sellerId,
    body: JSON.stringify(payload || {})
  });
}

export async function apiDeleteProduct(
  productId: string,
  sellerId?: string
): Promise<ApiResponse> {
  return request<ApiResponse>(`/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    sellerId
  });
}

export async function apiUpdateProductStatus(
  productId: string,
  status: string,
  sellerId?: string
): Promise<ApiResponse> {
  return request<ApiResponse>(`/products/${encodeURIComponent(productId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    sellerId
  });
}

// ==========================================
// 4. ORDERS & PACKING EVIDENCE
// ==========================================

export async function apiGetOrders(sellerId?: string): Promise<OrdersResponse> {
  return request<OrdersResponse>('/orders', {
    method: 'GET',
    sellerId,
    params: sellerId ? { sellerId } : undefined
  });
}

export interface SimulateReturnPayload {
  id?: string;
  sku?: string;
  productTitle?: string;
  productName?: string;
  title?: string;
  quantity?: number;
  amount?: number;
  price?: number;
  returnReason?: string;
  returnUnboxingVideoUrl?: string;
  productId?: string;
  sellerId?: string;
  buyerName?: string;
  customerName?: string;
  orderNumber?: string;
  items?: any[];
  [key: string]: any;
}

export async function apiSimulateReturn(
  orderId: string,
  payload?: string | SimulateReturnPayload,
  sellerId?: string
): Promise<SimulateReturnResponse> {
  const body = typeof payload === 'string'
    ? { returnReason: payload }
    : (payload ? { ...payload } : {});

  return request<SimulateReturnResponse>(`/orders/${encodeURIComponent(orderId)}/simulate-return`, {
    method: 'POST',
    sellerId: sellerId || (typeof payload === 'object' ? payload.sellerId : undefined),
    body: JSON.stringify(body)
  });
}

export interface ProcessReturnPayload {
  action: 'RESTOCK' | 'DISPUTE';
  sku?: string;
  quantity?: number;
  [key: string]: any;
}

export async function apiProcessReturn(
  orderId: string,
  actionOrPayload: 'RESTOCK' | 'DISPUTE' | ProcessReturnPayload,
  payloadOrSellerId?: { sku?: string; quantity?: number } | string,
  sellerId?: string
): Promise<ProcessReturnResponse> {
  let body: any = {};
  let activeSellerId = sellerId;

  if (typeof actionOrPayload === 'string') {
    body.action = actionOrPayload;
    if (typeof payloadOrSellerId === 'object' && payloadOrSellerId !== null) {
      Object.assign(body, payloadOrSellerId);
    } else if (typeof payloadOrSellerId === 'string') {
      activeSellerId = payloadOrSellerId;
    }
  } else if (typeof actionOrPayload === 'object') {
    body = { ...actionOrPayload };
    if (typeof payloadOrSellerId === 'string') {
      activeSellerId = payloadOrSellerId;
    }
  }

  return request<ProcessReturnResponse>(`/orders/${encodeURIComponent(orderId)}/process-return`, {
    method: 'POST',
    sellerId: activeSellerId,
    body: JSON.stringify(body)
  });
}

export async function apiAdvanceOrderStage(
  orderId: string,
  status?: string,
  sellerId?: string
): Promise<OrderResponse> {
  return request<OrderResponse>(`/orders/${encodeURIComponent(orderId)}/stage`, {
    method: 'PATCH',
    sellerId,
    body: JSON.stringify(status ? { status } : {})
  });
}

export async function apiCreateWaybill(
  orderId: string,
  carrier?: string,
  sellerId?: string
): Promise<WaybillResponse> {
  return request<WaybillResponse>(`/orders/${encodeURIComponent(orderId)}/waybill`, {
    method: 'POST',
    sellerId,
    body: JSON.stringify({ carrier })
  });
}

export async function apiSubmitPackingEvidence(
  orderId: string,
  evidence: PackingEvidencePayload,
  sellerId?: string
): Promise<OrderResponse> {
  return request<OrderResponse>(`/orders/${encodeURIComponent(orderId)}/evidence`, {
    method: 'POST',
    sellerId,
    body: JSON.stringify(evidence)
  });
}

export async function apiUploadPackingVideo(
  orderId: string,
  videoFile: Blob | File,
  sellerId?: string
): Promise<PackingVideoResponse> {
  const formData = new FormData();
  const filename = videoFile instanceof File ? videoFile.name : `packing-${orderId}-${Date.now()}.webm`;
  formData.append('video', videoFile, filename);
  if (sellerId) {
    formData.append('sellerId', sellerId);
  }

  return request<PackingVideoResponse>(`/orders/${encodeURIComponent(orderId)}/packing-video`, {
    method: 'POST',
    sellerId,
    body: formData
  });
}

export async function apiGetAdminOrders(): Promise<AdminOrdersResponse> {
  return request<AdminOrdersResponse>('/admin/orders', {
    method: 'GET'
  });
}

// ==========================================
// 5. ESCROW & FINANCIAL SUMMARY
// ==========================================

export async function apiGetEscrowSummary(sellerId?: string): Promise<EscrowSummaryResponse> {
  return request<EscrowSummaryResponse>('/escrow/summary', {
    method: 'GET',
    sellerId,
    params: sellerId ? { sellerId } : undefined
  });
}

// ==========================================
// 6. SELLER PROFILE & SETTINGS
// ==========================================

export async function apiGetProfile(sellerId?: string): Promise<ProfileResponse> {
  return request<ProfileResponse>('/seller/profile', {
    method: 'GET',
    sellerId,
    params: sellerId ? { sellerId } : undefined
  });
}

export async function apiUpdateProfile(
  profileData: Partial<SellerProfile>,
  sellerId?: string
): Promise<ProfileResponse> {
  return request<ProfileResponse>('/seller/profile', {
    method: 'PUT',
    sellerId,
    body: JSON.stringify(profileData)
  });
}

export async function apiVerifySeller(sellerId?: string): Promise<ProfileResponse> {
  return request<ProfileResponse>('/seller/verify', {
    method: 'POST',
    sellerId
  });
}

// ==========================================
// 7. PAYOUTS & WITHDRAWALS
// ==========================================

export async function apiGetWithdrawals(sellerId?: string): Promise<WithdrawalsResponse> {
  return request<WithdrawalsResponse>('/withdrawals', {
    method: 'GET',
    sellerId,
    params: sellerId ? { sellerId } : undefined
  });
}

export async function apiCreateWithdrawal(
  amount: number,
  bankLabel?: string,
  sellerId?: string
): Promise<WithdrawalResponse> {
  return request<WithdrawalResponse>('/withdrawals', {
    method: 'POST',
    sellerId,
    body: JSON.stringify({ amount, bankLabel })
  });
}

// ==========================================
// 8. ACTIVITY, NOTIFICATIONS & DEMO QC
// ==========================================

export async function apiGetActivity(sellerId?: string): Promise<ActivityResponse> {
  return request<ActivityResponse>('/activity', {
    method: 'GET',
    sellerId,
    params: sellerId ? { sellerId } : undefined
  });
}

export async function apiGetNotifications(sellerId?: string): Promise<NotificationsResponse> {
  return request<NotificationsResponse>('/notifications', {
    method: 'GET',
    sellerId,
    params: sellerId ? { sellerId } : undefined
  });
}

export async function apiDemoQcVerify(sellerId?: string): Promise<DemoQcVerifyResponse> {
  return request<DemoQcVerifyResponse>('/demo/qc-verify', {
    method: 'POST',
    sellerId
  });
}

export async function apiHealthCheck(): Promise<HealthCheckResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch (err: any) {
    return {
      status: 'offline',
      service: 'TrueMotion QC Seller Atelier API',
      database: 'SQLite',
      timestamp: new Date().toISOString()
    };
  }
}

