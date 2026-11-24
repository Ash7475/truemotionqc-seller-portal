import { FALLBACK_PRODUCT_IMAGE, getProductImage, handleImageError } from './productImages';
import { Product, Order, SellerProfile } from '../types';

export type Seller = SellerProfile;
export { FALLBACK_PRODUCT_IMAGE, getProductImage, handleImageError };

/**
 * Normalizes any product row (from Supabase snake_case, SQLite, or frontend camelCase)
 * so every component can reliably access all fields in both conventions.
 */
export function normalizeProduct(raw: any): Product {
  if (!raw) return {} as Product;

  const id = raw.id || raw.productId || `prod-${Date.now()}`;
  const title = raw.title || raw.name || raw.productTitle || 'Atelier Fine Piece';
  const sku = raw.sku || raw.serialNumber || 'SKU-9426009';
  const category = raw.category || 'Watches';
  const brand = raw.brand || raw.specs?.brand || 'Atelier Dubois Horlogerie';
  const condition = raw.condition || raw.specs?.condition || 'Pristine';
  const price = typeof raw.price === 'number' ? raw.price : (parseFloat(raw.price) || 0);
  const stock = typeof raw.stock === 'number' ? raw.stock : (parseInt(raw.stock, 10) || 0);
  const lowStockThreshold = typeof raw.lowStockThreshold === 'number' ? raw.lowStockThreshold : 2;

  // Normalizing macro photos
  let macroPhotosList: string[] = [];
  const rawMacro = raw.macro_photos || raw.macroPhotos || raw.images || raw.macro_photo_urls;
  if (Array.isArray(rawMacro)) {
    macroPhotosList = rawMacro.filter(Boolean);
  } else if (typeof rawMacro === 'string') {
    try {
      const parsed = JSON.parse(rawMacro);
      if (Array.isArray(parsed)) macroPhotosList = parsed.filter(Boolean);
      else if (typeof parsed === 'string') macroPhotosList = [parsed];
    } catch {
      if (rawMacro.trim()) macroPhotosList = [rawMacro.trim()];
    }
  }

  const primaryImage = getProductImage(raw);
  if (macroPhotosList.length === 0 && primaryImage) {
    macroPhotosList = [primaryImage];
  }

  const conditionVideoUrl = raw.condition_video_url || raw.conditionVideoUrl || null;
  const sellerId = raw.seller_id || raw.sellerId || '';

  // Standardize status: ACTIVE, OUT_OF_STOCK, PENDING_QC, ARCHIVED
  let status = String(raw.status || 'ACTIVE').toUpperCase();
  if (status === 'OUT OF STOCK') status = 'OUT_OF_STOCK';
  if (status === 'IN_STOCK' || status === 'PUBLISHED') status = 'ACTIVE';

  let specs = raw.specs;
  if (typeof specs === 'string') {
    try { specs = JSON.parse(specs); } catch { specs = {}; }
  }
  if (!specs || typeof specs !== 'object') {
    specs = { brand, condition, category };
  }

  const createdAt = raw.created_at || raw.createdAt || raw.orderDate || raw.order_date || new Date().toISOString();
  const updatedAt = raw.updated_at || raw.updatedAt || new Date().toISOString();

  return {
    ...raw,
    id,
    sku,
    title,
    name: title,
    category,
    brand,
    condition,
    price,
    stock,
    lowStockThreshold,
    status: status.toLowerCase() as any, // supports both lower and upper checks
    statusUpper: status,
    macro_photos: macroPhotosList,
    macroPhotos: macroPhotosList,
    images: macroPhotosList,
    primaryImage,
    condition_video_url: conditionVideoUrl,
    conditionVideoUrl,
    seller_id: sellerId,
    sellerId,
    specs,
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt
  } as Product;
}

/**
 * Normalizes any order row (from Supabase snake_case, SQLite, or frontend camelCase)
 * ensuring standardized order statuses:
 * READY_TO_SHIP, IN_DIRECT_TRANSIT, DELIVERED, RETURN_IN_TRANSIT, RETURNED_RESTOCKED, RETURN_DISPUTED
 */
export function normalizeOrder(raw: any): Order {
  if (!raw) return {} as Order;

  const id = raw.id || raw.orderNumber || `ord-${Date.now()}`;
  const orderNumber = raw.orderNumber || raw.order_number || id;
  const productId = raw.product_id || raw.productId || raw.items?.[0]?.productId || 'prod-001';
  const sku = raw.sku || raw.items?.[0]?.sku || 'SKU-9426009';
  const productTitle = raw.product_title || raw.productTitle || raw.productName || raw.title || raw.items?.[0]?.productName || 'Luxury Mechanical Piece';
  const sellerId = raw.seller_id || raw.sellerId || '';
  const buyerName = raw.buyer_name || raw.buyerName || raw.customerName || raw.customer_name || 'Verified Collector';
  const buyerEmail = raw.buyer_email || raw.buyerEmail || raw.customerEmail || raw.customer_email || 'client@truemotion-qc.internal';
  const amount = typeof raw.amount === 'number' ? raw.amount : (parseFloat(raw.amount) || parseFloat(raw.price) || 0);
  const quantity = Math.max(1, typeof raw.quantity === 'number' ? raw.quantity : (parseInt(raw.quantity, 10) || 1));

  // Standardize order status
  let status = String(raw.status || 'READY_TO_SHIP').toUpperCase();
  if (status === 'PACKING' || status === 'PENDING' || status === 'READY_FOR_PICKUP') {
    status = 'READY_TO_SHIP';
  } else if (status === 'SHIPPING' || status === 'IN_TRANSIT') {
    status = 'IN_DIRECT_TRANSIT';
  } else if (status === 'COMPLETED' || status === 'SETTLED') {
    status = 'DELIVERED';
  } else if (status === 'RETURNED' || status === 'RESTOCKED') {
    status = 'RETURNED_RESTOCKED';
  } else if (status === 'DISPUTED') {
    status = 'RETURN_DISPUTED';
  }

  const packingVideoUrl = raw.packing_video_url || raw.packingVideoUrl || null;
  const returnReason = raw.return_reason || raw.returnReason || null;
  const returnUnboxingVideoUrl = raw.return_unboxing_video_url || raw.returnUnboxingVideoUrl || null;

  const createdAt = raw.created_at || raw.createdAt || raw.orderDate || raw.order_date || new Date().toISOString();
  const updatedAt = raw.updated_at || raw.updatedAt || new Date().toISOString();

  const items = Array.isArray(raw.items) && raw.items.length > 0
    ? raw.items
    : [{
        productId,
        sku,
        productName: productTitle,
        quantity,
        price: amount,
        image: getProductImage(raw)
      }];

  return {
    ...raw,
    id,
    orderNumber,
    product_id: productId,
    productId,
    sku,
    product_title: productTitle,
    productTitle,
    productName: productTitle,
    seller_id: sellerId,
    sellerId,
    buyer_name: buyerName,
    buyerName,
    customerName: buyerName,
    customerEmail: buyerEmail,
    amount,
    price: amount,
    quantity,
    status: status as any,
    packing_video_url: packingVideoUrl,
    packingVideoUrl,
    return_reason: returnReason,
    returnReason,
    return_unboxing_video_url: returnUnboxingVideoUrl,
    returnUnboxingVideoUrl,
    items,
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt
  } as Order;
}

/**
 * Normalizes seller/KYC information across snake_case and camelCase
 */
export function normalizeSeller(raw: any): Seller {
  if (!raw) return {} as Seller;

  const id = raw.id || raw.sellerId || '';
  const storeName = raw.store_name || raw.storeName || raw.businessName || raw.business_name || 'Seller Atelier';
  const fullLegalName = raw.name || raw.full_name || raw.fullName || raw.fullLegalName || 'Seller';
  const email = (raw.email || '').trim().toLowerCase();
  const panNumber = (raw.pan || raw.pan_number || raw.panNumber || '').trim().toUpperCase();
  const gstin = (raw.gstin || '').trim().toUpperCase();

  // Strict normalization: NEVER default to 'VERIFIED'. Only exact 'VERIFIED' is approved.
  // Missing, null, empty, 'UNSUBMITTED', or unrecognized values normalize strictly to 'NOT_SUBMITTED'.
  const rawStatus = String(
    raw.kyc_status ?? raw.kycStatus ?? raw.verification_status ?? raw.verificationStatus ?? ''
  ).trim().toUpperCase();

  let kycStatus: 'NOT_SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' = 'NOT_SUBMITTED';
  if (rawStatus === 'VERIFIED') {
    kycStatus = 'VERIFIED';
  } else if (rawStatus === 'UNDER_REVIEW' || rawStatus === 'PENDING_APPROVAL' || rawStatus === 'PENDING_VERIFICATION') {
    kycStatus = 'UNDER_REVIEW';
  } else if (rawStatus === 'REJECTED') {
    kycStatus = 'REJECTED';
  } else {
    kycStatus = 'NOT_SUBMITTED';
  }

  const selfieUrl = raw.selfie_url || raw.selfieUrl || raw.selfieDataUrl || '/images/seller_avatar_portrait_1794326164878.jpg';
  const bankName = raw.bank_name || raw.bankName || raw.bankInstitution || '';
  const accountNumber = raw.account_number || raw.accountNumber || '';
  const ifscCode = (raw.ifsc_code || raw.ifscCode || '').trim().toUpperCase();
  const accountStatus = kycStatus === 'VERIFIED' ? 'approved' : (kycStatus === 'UNDER_REVIEW' ? 'under_review' : 'pending');

  return {
    ...raw,
    id,
    sellerId: id,
    store_name: storeName,
    storeName,
    businessName: storeName,
    full_name: fullLegalName,
    fullName: fullLegalName,
    fullLegalName,
    email,
    pan: panNumber,
    panNumber,
    gstin,
    account_status: accountStatus,
    accountStatus: accountStatus,
    kyc_status: kycStatus,
    kycStatus,
    verificationStatus: kycStatus as any,
    verification_status: kycStatus,
    selfie_url: selfieUrl,
    selfieUrl,
    bank_name: bankName,
    bankName,
    account_number: accountNumber,
    accountNumber,
    ifsc_code: ifscCode,
    ifscCode
  } as unknown as Seller;
}
