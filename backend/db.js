import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../truemotionqc_seller.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high performance concurrent reads and writes
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sellers (
    id TEXT PRIMARY KEY,
    sellerName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    fullName TEXT,
    businessAddress TEXT,
    taxId TEXT,
    avatarUrl TEXT,
    accountStatus TEXT DEFAULT 'pending',
    verificationStatus TEXT DEFAULT 'NOT_SUBMITTED',
    kycStatus TEXT DEFAULT 'NOT_SUBMITTED',
    applicationRefNumber TEXT,
    submittedAt TEXT,
    approvedAt TEXT,
    kycSubmittedAt TEXT,
    twoFactorEnabled INTEGER DEFAULT 0,
    twoFactorOtp TEXT,
    twoFactorOtpExpiry TEXT,
    memberSince TEXT,
    bankInstitution TEXT,
    bankAccountMasked TEXT,
    routingOrSortCode TEXT,
    accountHolderName TEXT,
    ifscCode TEXT,
    panNumber TEXT,
    gstin TEXT,
    isBusinessEntity INTEGER DEFAULT 0,
    aadhaarMasked TEXT,
    selfieCaptured INTEGER DEFAULT 0,
    selfieDataUrl TEXT,
    aadhaarFrontFileName TEXT,
    aadhaarBackFileName TEXT,
    verificationLevel TEXT,
    verificationScope TEXT,
    trustScore REAL DEFAULT 5.0,
    authenticPassRate TEXT,
    lifetimeDisbursed REAL DEFAULT 0,
    escrowFeeTier TEXT,
    pennyDropStatus TEXT,
    pennyDropRef TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sellerId TEXT NOT NULL DEFAULT 'seller-01',
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    condition TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    macroPhotos TEXT,
    conditionVideoUrl TEXT,
    createdAt TEXT NOT NULL,
    sku TEXT,
    name TEXT,
    lowStockThreshold INTEGER NOT NULL DEFAULT 2,
    description TEXT,
    verificationStatus TEXT NOT NULL DEFAULT 'approved',
    images TEXT,
    specs TEXT,
    anglePhotos TEXT,
    packingVideo TEXT,
    reviewerNotes TEXT,
    missingEvidenceChecklist TEXT,
    qcRejectionReasons TEXT,
    failedAngleIndex INTEGER,
    failedAngleLabel TEXT,
    returnTracking TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    productId TEXT,
    productTitle TEXT,
    sellerId TEXT NOT NULL DEFAULT 'seller-01',
    buyerName TEXT,
    amount REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'READY_TO_SHIP',
    packingVideoUrl TEXT,
    returnReason TEXT,
    returnUnboxingVideoUrl TEXT,
    updatedAt TEXT,
    orderNumber TEXT,
    customerName TEXT,
    customerEmail TEXT,
    shippingAddress TEXT,
    orderDate TEXT,
    items TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    shippingFee REAL NOT NULL DEFAULT 0,
    totalAmount REAL NOT NULL DEFAULT 0,
    escrowStatus TEXT NOT NULL DEFAULT 'held',
    trackingNumber TEXT,
    carrier TEXT,
    blindWaybillId TEXT,
    blindDestination TEXT,
    dispatchedAt TEXT,
    packingEvidence TEXT,
    packingVerifiedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL,
    amount REAL NOT NULL,
    bankLabel TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    sellerId TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    sellerId TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    entityRef TEXT,
    timestamp TEXT NOT NULL,
    sellerId TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    orderNumber TEXT NOT NULL,
    customerName TEXT NOT NULL,
    reason TEXT NOT NULL,
    claimAmount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'under_investigation',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    defenseNotes TEXT,
    sellerId TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    ticketNumber TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    createdAt TEXT NOT NULL,
    responses TEXT,
    sellerId TEXT NOT NULL
  );
`);

// Safe column migrations for existing databases
try {
  const sellerCols = db.prepare('PRAGMA table_info(sellers)').all();
  if (!sellerCols.some(c => c.name === 'kycStatus')) {
    try {
      db.exec("ALTER TABLE sellers ADD COLUMN kycStatus TEXT DEFAULT 'UNSUBMITTED';");
    } catch (ignore) {}
    try {
      db.exec("UPDATE sellers SET kycStatus = verificationStatus;");
    } catch (ignore) {}
  }
  try {
    db.exec("ALTER TABLE sellers ADD COLUMN aadhaarFrontUrl TEXT;");
  } catch (ignore) {}
  try {
    db.exec("ALTER TABLE sellers ADD COLUMN aadhaarBackUrl TEXT;");
  } catch (ignore) {}

  // Safe migration for products table columns (individually wrapped in try/catch)
  const productAlterStatements = [
    "ALTER TABLE products ADD COLUMN title TEXT;",
    "ALTER TABLE products ADD COLUMN brand TEXT;",
    "ALTER TABLE products ADD COLUMN condition TEXT;",
    "ALTER TABLE products ADD COLUMN macroPhotos TEXT;",
    "ALTER TABLE products ADD COLUMN conditionVideoUrl TEXT;",
    "ALTER TABLE products ADD COLUMN name TEXT;",
    "ALTER TABLE products ADD COLUMN sku TEXT;",
    "ALTER TABLE products ADD COLUMN updatedAt TEXT;"
  ];
  for (const sql of productAlterStatements) {
    try {
      db.exec(sql);
    } catch (ignore) {}
  }

  // Backfill products columns if null
  try {
    db.exec(`
      UPDATE products SET
        title = COALESCE(NULLIF(title, ''), name, 'Untitled Piece'),
        name = COALESCE(NULLIF(name, ''), title, 'Untitled Piece'),
        brand = COALESCE(NULLIF(brand, ''), 'Atelier Dubois Horlogerie'),
        condition = COALESCE(NULLIF(condition, ''), 'Brand New In Box'),
        macroPhotos = COALESCE(NULLIF(macroPhotos, ''), images, anglePhotos, '[]'),
        conditionVideoUrl = COALESCE(NULLIF(conditionVideoUrl, ''), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
        status = CASE
          WHEN stock <= 0 THEN 'OUT_OF_STOCK'
          WHEN status IN ('active', 'ACTIVE') THEN 'ACTIVE'
          WHEN status IN ('draft', 'pending', 'PENDING_QC') THEN 'PENDING_QC'
          ELSE 'ACTIVE'
        END,
        updatedAt = COALESCE(updatedAt, createdAt, datetime('now'))
      WHERE title IS NULL OR title = '' OR status IN ('active', 'out_of_stock');
    `);
  } catch (ignore) {}

  // Safe migration for orders table columns (individually wrapped in try/catch)
  // Ensures: quantity, packingVideoUrl, returnReason, returnUnboxingVideoUrl, updatedAt, etc.
  const orderAlterStatements = [
    "ALTER TABLE orders ADD COLUMN quantity INTEGER DEFAULT 1;",
    "ALTER TABLE orders ADD COLUMN packingVideoUrl TEXT;",
    "ALTER TABLE orders ADD COLUMN returnReason TEXT;",
    "ALTER TABLE orders ADD COLUMN returnUnboxingVideoUrl TEXT;",
    "ALTER TABLE orders ADD COLUMN updatedAt TEXT;",
    "ALTER TABLE orders ADD COLUMN productId TEXT;",
    "ALTER TABLE orders ADD COLUMN productTitle TEXT;",
    "ALTER TABLE orders ADD COLUMN buyerName TEXT;",
    "ALTER TABLE orders ADD COLUMN amount REAL DEFAULT 0;",
    "ALTER TABLE orders ADD COLUMN packingVerifiedAt TEXT;"
  ];
  for (const sql of orderAlterStatements) {
    try {
      db.exec(sql);
    } catch (ignore) {}
  }

  // Backfill orders columns if null
  try {
    db.exec(`
      UPDATE orders SET
        buyerName = COALESCE(NULLIF(buyerName, ''), customerName, 'Verified Collector'),
        customerName = COALESCE(NULLIF(customerName, ''), buyerName, 'Verified Collector'),
        amount = COALESCE(NULLIF(amount, 0), totalAmount, 42500),
        totalAmount = COALESCE(NULLIF(totalAmount, 0), amount, 42500),
        subtotal = COALESCE(NULLIF(subtotal, 0), amount, 42500),
        quantity = COALESCE(quantity, 1),
        orderNumber = COALESCE(NULLIF(orderNumber, ''), id),
        updatedAt = COALESCE(updatedAt, dispatchedAt, orderDate, datetime('now')),
        orderDate = COALESCE(orderDate, updatedAt, datetime('now'))
      WHERE buyerName IS NULL OR amount = 0 OR updatedAt IS NULL;
    `);
  } catch (ignore) {}

  // Backfill productId and productTitle from items JSON if available
  try {
    const existingOrders = db.prepare('SELECT id, items, productId, productTitle FROM orders').all();
    for (const ord of existingOrders) {
      if (!ord.productId || !ord.productTitle) {
        try {
          const parsedItems = ord.items ? JSON.parse(ord.items) : [];
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            const item = parsedItems[0];
            db.prepare('UPDATE orders SET productId = ?, productTitle = ?, quantity = ? WHERE id = ?')
              .run(item.productId || 'prod-001', item.productName || item.title || 'Luxury Piece', item.quantity || 1, ord.id);
          } else {
            db.prepare('UPDATE orders SET productId = ?, productTitle = ? WHERE id = ?')
              .run('prod-001', 'Luxury Mechanical Watch', ord.id);
          }
        } catch (ignore) {
          db.prepare('UPDATE orders SET productId = ?, productTitle = ? WHERE id = ?')
            .run('prod-001', 'Luxury Mechanical Watch', ord.id);
        }
      }
    }
  } catch (ignore) {}

  // Normalize order status to standard enum
  try {
    db.exec(`
      UPDATE orders SET status = 'DELIVERED' WHERE status IN ('delivered');
      UPDATE orders SET status = 'IN_DIRECT_TRANSIT' WHERE status IN ('shipping');
      UPDATE orders SET status = 'READY_TO_SHIP' WHERE status IN ('packing', 'READY_FOR_PICKUP');
    `);
  } catch (ignore) {}
} catch (e) {
  console.warn('[DB Migration Warning]:', e.message);
}

// Check counts for seeding: ONLY seed if tables have 0 rows
const sellerCount = db.prepare('SELECT COUNT(*) as count FROM sellers').get().count;
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

// 1. Initial Seller: Evelyn Dubois (Only if sellers table has 0 rows)
if (sellerCount === 0) {
  console.log('[DB] Seeding initial TrueMotion QC Atelier seller record...');
  const insertSeller = db.prepare(`
    INSERT INTO sellers (
      id, sellerName, email, password, phone, fullName, businessAddress, taxId, avatarUrl,
      accountStatus, verificationStatus, applicationRefNumber, submittedAt, approvedAt,
      twoFactorEnabled, memberSince, bankInstitution, bankAccountMasked, routingOrSortCode,
      accountHolderName, ifscCode, panNumber, gstin, isBusinessEntity, aadhaarMasked,
      selfieCaptured, verificationLevel, verificationScope, trustScore, authenticPassRate,
      lifetimeDisbursed, escrowFeeTier, pennyDropStatus, pennyDropRef
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  insertSeller.run(
    'seller-01',
    'Evelyn Dubois Atelier',
    'evelyn@atelier-dubois.com',
    'atelier-vault-2026',
    '+1 (555) 382-9014',
    'Evelyn Claire Dubois',
    '450 Rue Saint-Honoré, Suite 4B, Paris / New York',
    'FR-948201948',
    '/images/seller_avatar_portrait_1794326164878.jpg',
    'approved',
    'VERIFIED',
    'APP-2025-10492',
    '2025-08-14T09:30:00Z',
    '2025-08-16T14:22:00Z',
    1,
    'August 2025',
    'HDFC Bank Ltd',
    '••••••••4819',
    'HDFC0000240 / CHASUS33',
    'Evelyn Claire Dubois',
    'HDFC0000240',
    'ABCDE1234F',
    '27ABCDE1234F1Z5',
    1,
    '•••• •••• 9012',
    1,
    'Level 3 Enterprise Verified',
    'Optical AI & Physical Dispute Authorized',
    4.95,
    '100% Authentic Pass Rate',
    13584.05,
    '5% TrueMotion QC Escrow Fee Net',
    'SUCCESS',
    'PENNY-DROP-SEEDED-01'
  );
}

// 2. Initial Products: Auto-seeding disabled for 100% real-time data
if (false && productCount === 0) {
  console.log('[DB] Seeding initial TrueMotion QC products...');
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, sellerId, title, category, brand, condition, price, stock, status,
      macroPhotos, conditionVideoUrl, createdAt,
      sku, name, lowStockThreshold, description, verificationStatus,
      images, specs, anglePhotos, packingVideo, reviewerNotes, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProduct.run(
    'prod-001',
    'seller-01',
    'Luxury Mechanical Watch',
    'Watches',
    'Atelier Dubois Horlogerie',
    'Brand New In Box',
    42500,
    5,
    'ACTIVE',
    JSON.stringify(['/images/product_burgundy_watch.jpg', '/images/hero_burgundy_horology.jpg']),
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '2026-09-10T14:00:00Z',
    'SKU-9426009',
    'Luxury Mechanical Watch',
    2,
    'Rose-gold mechanical dress chronograph featuring deep burgundy sunburst dial, hand-stitched alligator strap, and exhibition sapphire caseback.',
    'approved',
    JSON.stringify(['/images/product_burgundy_watch.jpg']),
    JSON.stringify({
      brand: 'Atelier Dubois Horlogerie',
      model: 'Chronomètre Bordeaux 40mm',
      watchType: 'Mechanical Automatic',
      movement: 'Calibre TM-3235 Perpetual',
      caseMaterial: '18k Rose Gold',
      dialColor: 'Deep Bordeaux Sunburst',
      condition: 'Brand New In Box'
    }),
    JSON.stringify({
      dial: '/images/product_burgundy_watch.jpg',
      case: '/images/hero_burgundy_horology.jpg',
      crown: '/images/product_burgundy_watch.jpg',
      back: '/images/hero_burgundy_horology.jpg',
      clasp: '/images/product_burgundy_watch.jpg',
      serial: '/images/hero_burgundy_horology.jpg'
    }),
    JSON.stringify({
      fileName: 'TM-QC-SEAL-9426009.mp4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      uploadedAt: '2026-09-10T14:15:00Z'
    }),
    'Physical TMQC inspection passed. Timegrapher variance +0.8s/day. Complete dossier and presentation box verified.',
    '2026-10-15T11:20:00Z'
  );

  insertProduct.run(
    'prod-003',
    'seller-01',
    'Tailored Cashmere Overcoat',
    'Apparel',
    'Atelier Dubois Tailoring',
    'Brand New with Garment Bag',
    42500,
    4,
    'ACTIVE',
    JSON.stringify(['/images/product_burgundy_apparel.jpg', '/images/hero_burgundy_horology.jpg']),
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '2026-09-20T16:45:00Z',
    'SKU-9325005',
    'Tailored Cashmere Overcoat',
    2,
    'Double-faced pure Italian cashmere single-breasted overcoat in signature deep oxblood burgundy with horn buttons and silk cupro lining.',
    'approved',
    JSON.stringify(['/images/product_burgundy_apparel.jpg']),
    JSON.stringify({
      brand: 'Atelier Dubois Tailoring',
      model: 'Sartorial Bordeaux 2026',
      size: 'EU 50 (US 40R)',
      color: 'Deep Burgundy Oxblood',
      material: '100% Loro Piana Pure Cashmere',
      condition: 'Brand New with Garment Bag'
    }),
    JSON.stringify({
      front: '/images/product_burgundy_apparel.jpg',
      collar: '/images/hero_burgundy_horology.jpg',
      cuff: '/images/product_burgundy_apparel.jpg',
      fabric: '/images/hero_burgundy_horology.jpg',
      tag: '/images/product_burgundy_apparel.jpg',
      buttons: '/images/hero_burgundy_horology.jpg'
    }),
    JSON.stringify({
      fileName: 'TM-QC-SEAL-9325005.mp4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      uploadedAt: '2026-09-20T16:50:00Z'
    }),
    'TMQC fabric weave, horn hardware, and sartorial seam inspection passed.',
    '2026-10-22T12:00:00Z'
  );

  insertProduct.run(
    'prod-004',
    'seller-01',
    'Leather Accessory & Satchel',
    'Accessories',
    'Atelier Dubois Maroquinerie',
    'New with Dust Bag & Authenticity Booklet',
    42500,
    3,
    'ACTIVE',
    JSON.stringify(['/images/product_burgundy_leather.jpg', '/images/hero_burgundy_horology.jpg']),
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '2026-10-01T10:00:00Z',
    'SKU-9426003',
    'Leather Accessory & Satchel',
    1,
    'Hand-patinated full-grain Florentine calfskin briefcase with solid brass hardware, structured laptop compartment, and burgundy suede interior.',
    'approved',
    JSON.stringify(['/images/product_burgundy_leather.jpg']),
    JSON.stringify({
      brand: 'Atelier Dubois Maroquinerie',
      model: 'Malle Bordeaux Briefcase',
      material: 'Full-Grain Box Calfskin',
      color: 'Burgundy Antique Patina',
      condition: 'New with Dust Bag & Authenticity Booklet'
    }),
    JSON.stringify({
      front: '/images/product_burgundy_leather.jpg',
      corner: '/images/hero_burgundy_horology.jpg',
      hardware: '/images/product_burgundy_leather.jpg',
      interior: '/images/hero_burgundy_horology.jpg',
      strap: '/images/product_burgundy_leather.jpg',
      stamp: '/images/hero_burgundy_horology.jpg'
    }),
    JSON.stringify({
      fileName: 'TM-QC-SEAL-9426003.mp4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      uploadedAt: '2026-10-01T10:15:00Z'
    }),
    'TMQC leather grain, stitch density, and foil blind stamp verified.',
    '2026-11-01T09:30:00Z'
  );
}

// 3. Initial Orders: Auto-seeding disabled for 100% real-time data
if (false && orderCount === 0) {
  console.log('[DB] Seeding initial TrueMotion QC orders...');
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, productId, productTitle, sellerId, buyerName, amount, quantity, status,
      packingVideoUrl, returnReason, returnUnboxingVideoUrl, updatedAt,
      orderNumber, customerName, customerEmail, shippingAddress, orderDate,
      items, subtotal, shippingFee, totalAmount, escrowStatus,
      trackingNumber, carrier, blindWaybillId, blindDestination, dispatchedAt,
      packingEvidence
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?
    )
  `);

  // Order 1: Delivered (QC-Verified & Settled)
  insertOrder.run(
    'ord-44A1020',
    'prod-001',
    'Luxury Mechanical Watch',
    'seller-01',
    'Vikram Singhania',
    42500,
    1,
    'DELIVERED',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    null,
    null,
    '2026-01-21T12:00:00Z',
    '44A1020',
    'Vikram Singhania',
    'vikram.singhania@indocap.in',
    '14 Nariman Point, Marine Drive, Mumbai 400021',
    '2026-01-21T10:30:00Z',
    JSON.stringify([
      {
        productId: 'prod-001',
        productName: 'Luxury Mechanical Watch',
        sku: 'SKU-9426009',
        price: 42500,
        quantity: 1,
        image: '/images/product_burgundy_watch.jpg'
      }
    ]),
    42500,
    0,
    42500,
    'released',
    'TM-EXP-44A1020-IND',
    'TrueMotion QC Armored Express',
    'WB-TMQC-2026-1020',
    'Direct Express to Buyer (Masked Waybill)',
    '2026-01-21T12:00:00Z',
    JSON.stringify({
      referenceId: 'PK-PROOF-2026-1020',
      timestamp: '2026-01-21T11:00:00Z',
      packageWeightKg: 1.45,
      notes: 'Calibrated micro-scale weight verified with laser hologram seal.',
      photos: ['/images/product_burgundy_watch.jpg'],
      hasVideoProof: true
    })
  );

  // Order 2: In Direct Transit
  insertOrder.run(
    'ord-44A1022',
    'prod-001',
    'Luxury Mechanical Watch',
    'seller-01',
    'Priya Sharma',
    42500,
    1,
    'IN_DIRECT_TRANSIT',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    null,
    null,
    '2026-01-27T15:00:00Z',
    '44A1022',
    'Priya Sharma',
    'priya.sharma@techsound.in',
    '18 Richmond Road, Bangalore 560025',
    '2026-01-27T14:15:00Z',
    JSON.stringify([
      {
        productId: 'prod-001',
        productName: 'Luxury Watch',
        sku: 'SKU-9426009',
        price: 42500,
        quantity: 1,
        image: '/images/product_burgundy_watch.jpg'
      }
    ]),
    42500,
    0,
    42500,
    'held',
    'TM-EXP-44A1022-BLR',
    'TrueMotion Direct Express Courier',
    'WB-TMQC-2026-1022',
    'Direct Express to Buyer (Masked Waybill)',
    '2026-01-27T15:00:00Z',
    JSON.stringify({
      referenceId: 'PK-PROOF-2026-1022',
      timestamp: '2026-01-27T14:30:00Z',
      packageWeightKg: 1.5,
      notes: 'Inspected tamper-proof seal and macro certificate enclosed.',
      photos: ['/images/product_burgundy_watch.jpg'],
      hasVideoProof: true
    })
  );

  // Order 3: Ready to Ship
  insertOrder.run(
    'ord-44A1023',
    'prod-004',
    'Leather Accessory & Satchel',
    'seller-01',
    'Rohan Kapoor',
    42500,
    1,
    'READY_TO_SHIP',
    null,
    null,
    null,
    '2026-02-01T16:45:00Z',
    '44A1023',
    'Rohan Kapoor',
    'rohan.kapoor@delhicap.in',
    '7 Golf Links, New Delhi 110003',
    '2026-02-01T16:45:00Z',
    JSON.stringify([
      {
        productId: 'prod-004',
        productName: 'Leather Accessory',
        sku: 'SKU-9426003',
        price: 42500,
        quantity: 1,
        image: '/images/product_burgundy_leather.jpg'
      }
    ]),
    42500,
    0,
    42500,
    'held',
    null,
    null,
    null,
    'Direct Express to Buyer (Masked Waybill)',
    null,
    null
  );
}

// 4. Initial Activity Logs (if empty)
const activityCount = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get().count;
if (activityCount === 0) {
  const insertActivity = db.prepare(`
    INSERT INTO activity_logs (id, action, details, entityRef, timestamp, sellerId)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertActivity.run(
    'act-01',
    'Atelier Initialized',
    'Evelyn Dubois Atelier credentials registered in TrueMotion QC network',
    'APP-2025-10492',
    '2025-08-14T09:30:00Z',
    'seller-01'
  );

  insertActivity.run(
    'act-02',
    'Penny Drop Settled',
    'Verified ₹1.00 IMPS penny drop match with HDFC Bank Ltd (HDFC0000240)',
    'PENNY-DROP-SEEDED-01',
    '2025-08-16T14:20:00Z',
    'seller-01'
  );

  insertActivity.run(
    'act-03',
    'Order Delivered & Escrow Settled',
    'Order 44A1020 passed TrueMotion QC inspection and reached collector',
    '44A1020',
    '2026-01-21T10:30:00Z',
    'seller-01'
  );
}

export { db, DB_PATH };
export default db;
