export type ProductCategory = 'Watches' | 'Electronics' | 'Apparel' | 'Accessories' | 'Other';

export type ProductStatus = 'active' | 'archived' | 'draft' | 'ACTIVE' | 'OUT_OF_STOCK' | 'PENDING_QC';

export type VerificationStage = 
  | 'submitted' 
  | 'ai_review' 
  | 'human_review' 
  | 'additional_evidence' 
  | 'approved' 
  | 'rejected';

export interface ProductSpecs {
  brand?: string;
  model?: string;
  watchType?: string;
  movement?: string;
  caseMaterial?: string;
  dialColor?: string;
  deviceType?: string;
  technicalSpecs?: string;
  warrantyPeriod?: string;
  size?: string;
  color?: string;
  material?: string;
  condition?: string;
  generalNotes?: string;
}

export type AnglePhotos = Record<string, string>;

export interface PackingVideo {
  fileName: string;
  videoUrl: string;
  uploadedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  title?: string;
  brand?: string;
  condition?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  lowStockThreshold: number;
  description: string;
  status: ProductStatus;
  verificationStatus: VerificationStage;
  images: string[];
  macroPhotos?: string[] | Record<string, string>;
  conditionVideoUrl?: string | null;
  specs: ProductSpecs;
  createdAt: string;
  updatedAt: string;
  reviewerNotes?: string;
  missingEvidenceChecklist?: string[];
  qcRejectionReasons?: string[];
  failedAngleIndex?: number;
  failedAngleLabel?: string;
  returnTracking?: {
    trackingNumber: string;
    carrier: string;
    estimatedDelivery: string;
    steps: Array<{
      label: string;
      timestamp: string;
      detail: string;
      status: 'completed' | 'active' | 'pending';
    }>;
  };
  sellerId: string;
  seller_id?: string;
  macro_photos?: string[] | string;
  condition_video_url?: string | null;
  created_at?: string;
  updated_at?: string;
  anglePhotos?: AnglePhotos;
  packingVideo?: PackingVideo | null;
}

export type OrderStatus =
  | 'packing'
  | 'READY_TO_SHIP'
  | 'READY_FOR_PICKUP'
  | 'shipping'
  | 'IN_DIRECT_TRANSIT'
  | 'delivered'
  | 'DELIVERED'
  | 'Authenticated & Delivered'
  | 'RETURN_IN_TRANSIT'
  | 'RETURNED_RESTOCKED'
  | 'RETURN_DISPUTED'
  | 'returned'
  | 'disputed';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

export interface PackingEvidence {
  referenceId: string;
  timestamp: string;
  packageWeightKg: number;
  notes: string;
  photos: string[];
  hasVideoProof: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  productId?: string;
  product_id?: string;
  productTitle?: string;
  product_title?: string;
  productName?: string;
  title?: string;
  sku?: string;
  price?: number;
  buyerName?: string;
  buyer_name?: string;
  amount?: number;
  quantity?: number;
  returnReason?: string | null;
  return_reason?: string | null;
  returnUnboxingVideoUrl?: string | null;
  return_unboxing_video_url?: string | null;
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  orderDate: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  escrowStatus: 'held' | 'released' | 'refunded';
  trackingNumber?: string;
  carrier?: string;
  blindWaybillId?: string;
  blindDestination?: string;
  dispatchedAt?: string;
  packingEvidence?: PackingEvidence;
  packingVideoUrl?: string;
  packingVerifiedAt?: string;
  hubQcDocket?: {
    currentStage: number;
    stages: Array<{
      stage: number;
      name: string;
      shortDesc: string;
      detail: string;
      completed: boolean;
    }>;
  };
  sellerId?: string;
  seller_id?: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  reason: string;
  claimAmount: number;
  status: 'under_investigation' | 'evidence_submitted' | 'resolved_seller_favor' | 'resolved_buyer_favor';
  createdAt: string;
  updatedAt: string;
  evidenceRefId?: string;
  defenseNotes?: string;
  resolutionNotes?: string;
  sellerId: string;
}

export type ApplicationStatus = 
  | 'pending' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'additional_info';

export type VerificationOnboardingStatus = 
  | 'NOT_SUBMITTED'
  | 'UNSUBMITTED' 
  | 'INCOMPLETE' 
  | 'PENDING_APPROVAL' 
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'APPROVED' 
  | 'VERIFIED'
  | 'REJECTED';

export interface SellerKYC {
  documentType: 'Passport' | 'National ID' | 'Drivers License' | 'Business License';
  documentNumber: string;
  expiryDate: string;
  issuingCountry: string;
  documentFileUrl?: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected' | 'action_required';
  rejectionReason?: string;
  additionalInfoRequested?: string;
}

export interface SellerProfile {
  id: string;
  sellerName: string;
  storeName?: string;
  store_name?: string;
  email: string;
  password?: string;
  phone: string;
  fullName: string;
  full_name?: string;
  owner_name?: string;
  businessAddress: string;
  taxId: string;
  aadhaarNumber?: string;
  aadhaar_number?: string;
  avatarUrl: string;
  avatar_url?: string;
  selfieUrl?: string;
  selfie_url?: string;
  rating?: number;
  reviewCount?: number;
  reviews_count?: number;
  createdAt?: string;
  created_at?: string;
  accountStatus: ApplicationStatus;
  account_status?: string;
  verificationStatus: VerificationOnboardingStatus;
  verification_status?: string;
  kycStatus?: VerificationOnboardingStatus;
  kyc_status?: string;
  applicationRefNumber: string;
  submittedAt: string;
  approvedAt?: string;
  kycSubmittedAt?: string;
  rejectionReason?: string;
  rejection_reason?: string;
  additionalInfoRequest?: string;
  twoFactorEnabled: boolean;
  memberSince: string;
  bankInstitution: string;
  bankName?: string;
  bank_name?: string;
  bankAccountMasked: string;
  accountNumber?: string;
  account_number?: string;
  routingOrSortCode: string;
  accountHolderName?: string;
  account_holder_name?: string;
  ifscCode?: string;
  ifsc_code?: string;
  panNumber?: string;
  pan?: string;
  gstin?: string;
  isBusinessEntity?: boolean;
  aadhaarMasked?: string;
  selfieCaptured?: boolean;
  selfieDataUrl?: string;
  aadhaarFrontFileName?: string;
  aadhaarBackFileName?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  aadhaar_front_url?: string;
  aadhaar_back_url?: string;
  verificationLevel: string;
  verificationScope: string;
  trustScore: number;
  authenticPassRate: string;
  lifetimeDisbursed: number;
  escrowFeeTier: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'orders' | 'payments' | 'products' | 'alerts';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  sellerId: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  entityRef?: string;
  timestamp: string;
  sellerId: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  availableBalance: number;
  escrowBalance: number;
  pendingPayouts: number;
  completedPayouts: number;
}

export type Seller = SellerProfile;
