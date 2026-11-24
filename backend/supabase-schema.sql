-- ==========================================================
-- TruemotionQC Seller Atelier - Supabase PostgreSQL Schema
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ahhjnszfisfyqdrcotph/sql
-- ==========================================================

-- 1. SELLERS TABLE
CREATE TABLE IF NOT EXISTS public.sellers (
    id TEXT PRIMARY KEY,
    seller_name TEXT NOT NULL,
    "sellerName" TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    full_name TEXT,
    "fullName" TEXT,
    business_address TEXT,
    "businessAddress" TEXT,
    tax_id TEXT,
    "taxId" TEXT,
    avatar_url TEXT,
    "avatarUrl" TEXT,
    account_status TEXT DEFAULT 'pending',
    "accountStatus" TEXT DEFAULT 'pending',
    verification_status TEXT DEFAULT 'UNSUBMITTED',
    "verificationStatus" TEXT DEFAULT 'UNSUBMITTED',
    kyc_status TEXT DEFAULT 'UNSUBMITTED',
    "kycStatus" TEXT DEFAULT 'UNSUBMITTED',
    application_ref_number TEXT,
    "applicationRefNumber" TEXT,
    submitted_at TEXT,
    "submittedAt" TEXT,
    approved_at TEXT,
    "approvedAt" TEXT,
    kyc_submitted_at TEXT,
    "kycSubmittedAt" TEXT,
    two_factor_enabled INTEGER DEFAULT 0,
    "twoFactorEnabled" INTEGER DEFAULT 0,
    two_factor_otp TEXT,
    "twoFactorOtp" TEXT,
    two_factor_otp_expiry TEXT,
    "twoFactorOtpExpiry" TEXT,
    member_since TEXT,
    "memberSince" TEXT,
    bank_institution TEXT,
    "bankInstitution" TEXT,
    bank_account_masked TEXT,
    "bankAccountMasked" TEXT,
    routing_or_sort_code TEXT,
    "routingOrSortCode" TEXT,
    account_holder_name TEXT,
    "accountHolderName" TEXT,
    ifsc_code TEXT,
    "ifscCode" TEXT,
    pan_number TEXT,
    "panNumber" TEXT,
    gstin TEXT,
    is_business_entity INTEGER DEFAULT 0,
    "isBusinessEntity" INTEGER DEFAULT 0,
    aadhaar_masked TEXT,
    "aadhaarMasked" TEXT,
    selfie_captured INTEGER DEFAULT 0,
    "selfieCaptured" INTEGER DEFAULT 0,
    selfie_url TEXT,
    "selfieDataUrl" TEXT,
    aadhaar_front_file_name TEXT,
    "aadhaarFrontFileName" TEXT,
    aadhaar_back_file_name TEXT,
    "aadhaarBackFileName" TEXT,
    verification_level TEXT,
    "verificationLevel" TEXT,
    verification_scope TEXT,
    "verificationScope" TEXT,
    trust_score REAL DEFAULT 5.0,
    "trustScore" REAL DEFAULT 5.0,
    authentic_pass_rate TEXT,
    "authenticPassRate" TEXT,
    lifetime_disbursed REAL DEFAULT 0,
    "lifetimeDisbursed" REAL DEFAULT 0,
    escrow_fee_tier TEXT,
    "escrowFeeTier" TEXT,
    penny_drop_status TEXT,
    "pennyDropStatus" TEXT,
    penny_drop_ref TEXT,
    "pennyDropRef" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL DEFAULT 'seller-01',
    "sellerId" TEXT NOT NULL DEFAULT 'seller-01',
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    condition TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    macro_photos TEXT,
    "macroPhotos" TEXT,
    condition_video_url TEXT,
    "conditionVideoUrl" TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TEXT,
    sku TEXT,
    name TEXT,
    low_stock_threshold INTEGER NOT NULL DEFAULT 2,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 2,
    description TEXT,
    verification_status TEXT NOT NULL DEFAULT 'approved',
    "verificationStatus" TEXT NOT NULL DEFAULT 'approved',
    images TEXT,
    specs TEXT,
    angle_photos TEXT,
    "anglePhotos" TEXT,
    packing_video TEXT,
    "packingVideo" TEXT,
    reviewer_notes TEXT,
    "reviewerNotes" TEXT,
    missing_evidence_checklist TEXT,
    "missingEvidenceChecklist" TEXT,
    qc_rejection_reasons TEXT,
    "qcRejectionReasons" TEXT,
    failed_angle_index INTEGER,
    "failedAngleIndex" INTEGER,
    failed_angle_label TEXT,
    "failedAngleLabel" TEXT,
    return_tracking TEXT,
    "returnTracking" TEXT,
    updated_at TEXT,
    "updatedAt" TEXT
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    "productId" TEXT,
    product_title TEXT,
    "productTitle" TEXT,
    seller_id TEXT NOT NULL DEFAULT 'seller-01',
    "sellerId" TEXT NOT NULL DEFAULT 'seller-01',
    buyer_name TEXT,
    "buyerName" TEXT,
    amount REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'READY_TO_SHIP',
    packing_video_url TEXT,
    "packingVideoUrl" TEXT,
    return_reason TEXT,
    "returnReason" TEXT,
    return_unboxing_video_url TEXT,
    "returnUnboxingVideoUrl" TEXT,
    updated_at TEXT,
    "updatedAt" TEXT,
    order_number TEXT,
    "orderNumber" TEXT,
    customer_name TEXT,
    "customerName" TEXT,
    customer_email TEXT,
    "customerEmail" TEXT,
    shipping_address TEXT,
    "shippingAddress" TEXT,
    order_date TEXT,
    "orderDate" TEXT,
    items TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    shipping_fee REAL NOT NULL DEFAULT 0,
    "shippingFee" REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    escrow_status TEXT NOT NULL DEFAULT 'held',
    "escrowStatus" TEXT NOT NULL DEFAULT 'held',
    tracking_number TEXT,
    "trackingNumber" TEXT,
    carrier TEXT,
    blind_waybill_id TEXT,
    "blindWaybillId" TEXT,
    blind_destination TEXT,
    "blindDestination" TEXT,
    dispatched_at TEXT,
    "dispatchedAt" TEXT,
    packing_evidence TEXT,
    "packingEvidence" TEXT,
    packing_verified_at TEXT,
    "packingVerifiedAt" TEXT
);

-- 4. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL,
    amount REAL NOT NULL,
    bank_label TEXT NOT NULL,
    "bankLabel" TEXT,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    seller_id TEXT NOT NULL,
    "sellerId" TEXT
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    seller_id TEXT NOT NULL,
    "sellerId" TEXT
);

-- 6. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    entity_ref TEXT,
    "entityRef" TEXT,
    timestamp TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    "sellerId" TEXT
);

-- 7. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.disputes (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    "orderId" TEXT,
    order_number TEXT NOT NULL,
    "orderNumber" TEXT,
    customer_name TEXT NOT NULL,
    "customerName" TEXT,
    reason TEXT NOT NULL,
    claim_amount REAL NOT NULL,
    "claimAmount" REAL,
    status TEXT NOT NULL DEFAULT 'under_investigation',
    created_at TEXT NOT NULL,
    "createdAt" TEXT,
    updated_at TEXT NOT NULL,
    "updatedAt" TEXT,
    defense_notes TEXT,
    "defenseNotes" TEXT,
    seller_id TEXT NOT NULL,
    "sellerId" TEXT
);

-- 8. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL,
    "ticketNumber" TEXT,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    "createdAt" TEXT,
    responses TEXT,
    seller_id TEXT NOT NULL,
    "sellerId" TEXT
);

-- 9. SUPABASE STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('kyc-docs', 'kyc-docs', true),
    ('product-photos', 'product-photos', true),
    ('packing-videos', 'packing-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage public read policy
DO $$
BEGIN
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES ('Public Read', 'kyc-docs', '{"statement": "SELECT"}')
    ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if storage policies are managed via Supabase Dashboard UI
    NULL;
END $$;

-- Grant table privileges to service_role, anon, authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role, anon, authenticated;


