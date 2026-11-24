import { Product, Order, Dispute, SellerProfile, NotificationItem, ActivityLog } from '../types';

export const INITIAL_SELLERS: SellerProfile[] = [
  {
    id: 'seller-01',
    sellerName: 'Evelyn Dubois Atelier',
    email: 'evelyn@atelier-dubois.com',
    password: 'atelier-vault-2026',
    phone: '+1 (555) 382-9014',
    fullName: 'Evelyn Claire Dubois',
    businessAddress: '450 Rue Saint-Honoré, Suite 4B, Paris / New York',
    taxId: 'FR-948201948',
    avatarUrl: '/images/seller_avatar_portrait_1794326164878.jpg',
    accountStatus: 'approved',
    verificationStatus: 'APPROVED',
    kycStatus: 'APPROVED',
    applicationRefNumber: 'APP-2025-10492',
    submittedAt: '2025-08-14T09:30:00Z',
    approvedAt: '2025-08-16T14:22:00Z',
    twoFactorEnabled: true,
    memberSince: 'August 2025',
    bankInstitution: 'HDFC Bank Ltd',
    bankAccountMasked: '••••••••4819',
    routingOrSortCode: 'HDFC0000240 / CHASUS33',
    verificationLevel: 'Level 3 Enterprise Verified',
    verificationScope: 'Optical AI & Physical Dispute Authorized',
    trustScore: 4.95,
    authenticPassRate: '100% Authentic Pass Rate',
    lifetimeDisbursed: 13584.05,
    escrowFeeTier: '5% TrueMotion QC Escrow Fee Net'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'SKU-9426009',
    name: 'Luxury Mechanical Watch',
    category: 'Watches',
    price: 42500,
    stock: 5,
    lowStockThreshold: 2,
    description: 'Rose-gold mechanical dress chronograph featuring deep burgundy sunburst dial, hand-stitched alligator strap, and exhibition sapphire caseback.',
    status: 'active',
    verificationStatus: 'approved',
    images: ['/images/product_burgundy_watch.jpg'],
    specs: {
      brand: 'Atelier Dubois Horlogerie',
      model: 'Chronomètre Bordeaux 40mm',
      watchType: 'Mechanical Automatic',
      movement: 'Calibre TM-3235 Perpetual',
      caseMaterial: '18k Rose Gold',
      dialColor: 'Deep Bordeaux Sunburst',
      condition: 'Brand New In Box'
    },
    createdAt: '2026-09-10T14:00:00Z',
    updatedAt: '2026-10-15T11:20:00Z',
    reviewerNotes: 'Physical TMQC inspection passed. Timegrapher variance +0.8s/day. Complete dossier and presentation box verified.',
    sellerId: 'seller-01',
    anglePhotos: {
      dial: '/images/product_burgundy_watch.jpg',
      case: '/images/hero_burgundy_horology.jpg',
      crown: '/images/product_burgundy_watch.jpg',
      back: '/images/hero_burgundy_horology.jpg',
      clasp: '/images/product_burgundy_watch.jpg',
      serial: '/images/hero_burgundy_horology.jpg'
    },
    packingVideo: {
      fileName: 'TM-QC-SEAL-9426009.mp4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      uploadedAt: '2026-09-10T14:15:00Z'
    }
  },
  {
    id: 'prod-003',
    sku: 'SKU-9325005',
    name: 'Tailored Cashmere Overcoat',
    category: 'Apparel',
    price: 42500,
    stock: 4,
    lowStockThreshold: 2,
    description: 'Double-faced pure Italian cashmere single-breasted overcoat in signature deep oxblood burgundy with horn buttons and silk cupro lining.',
    status: 'active',
    verificationStatus: 'approved',
    images: ['/images/product_burgundy_apparel.jpg'],
    specs: {
      brand: 'Atelier Dubois Tailoring',
      model: 'Sartorial Bordeaux 2026',
      size: 'EU 50 (US 40R)',
      color: 'Deep Burgundy Oxblood',
      material: '100% Loro Piana Pure Cashmere',
      condition: 'Brand New with Garment Bag'
    },
    createdAt: '2026-09-20T16:45:00Z',
    updatedAt: '2026-10-22T12:00:00Z',
    reviewerNotes: 'TMQC fabric weave, horn hardware, and sartorial seam inspection passed.',
    sellerId: 'seller-01'
  },
  {
    id: 'prod-004',
    sku: 'SKU-9426003',
    name: 'Heritage Leather Satchel',
    category: 'Accessories',
    price: 42500,
    stock: 6,
    lowStockThreshold: 2,
    description: 'Handcrafted full-grain pebbled calfskin briefcase satchel in deep burgundy with solid brushed brass clasp and hand-burnished edges.',
    status: 'active',
    verificationStatus: 'approved',
    images: ['/images/product_burgundy_leather.jpg'],
    specs: {
      brand: 'Atelier Dubois Maroquinerie',
      model: 'Diplomate Satchel 40cm',
      material: 'Full-Grain Vegetable-Tanned Calfskin',
      color: 'Burgundy & Brushed Brass',
      condition: 'Brand New with Dust Bag'
    },
    createdAt: '2026-09-28T13:20:00Z',
    updatedAt: '2026-11-01T08:10:00Z',
    reviewerNotes: 'TMQC leather grain stamp, brass lock alignment, and edge-paint verified.',
    sellerId: 'seller-01'
  },
  {
    id: 'prod-002',
    sku: 'SKU-9426012',
    name: 'Sony WH-1000XM6 Studio Monitor',
    category: 'Electronics',
    price: 34900,
    stock: 14,
    lowStockThreshold: 5,
    description: 'Next-generation wireless noise-canceling studio headphones with dual processors, carbon fiber composite drivers, and 40h battery.',
    status: 'active',
    verificationStatus: 'approved',
    images: ['/images/product_studio_headphones_1794326162702.jpg'],
    specs: {
      brand: 'Sony',
      model: 'WH-1000XM6 Pro',
      deviceType: 'Over-Ear Wireless Studio Monitor',
      technicalSpecs: 'HD Noise Canceling Processor QN2, 30mm Carbon Drivers, LDAC',
      warrantyPeriod: '24 Months International Atelier Warranty',
      condition: 'Factory Sealed'
    },
    createdAt: '2026-09-15T10:15:00Z',
    updatedAt: '2026-10-18T09:40:00Z',
    reviewerNotes: 'Acoustic seal and serial number authenticated with manufacturer database.',
    sellerId: 'seller-01'
  },
  {
    id: 'prod-005',
    sku: 'WTC-DIVER-300',
    name: 'Seabound Submersible 300M Diver Watch',
    category: 'Watches',
    price: 2800,
    stock: 0,
    lowStockThreshold: 2,
    description: 'Professional grade diver with unidirectional ceramic bezel, helium release valve, and Super-LumiNova BGW9 indices.',
    status: 'active',
    verificationStatus: 'approved',
    images: ['/images/product_chronograph_watch_1794326161832.jpg'],
    specs: {
      brand: 'Seabound',
      model: 'Submersible 300',
      watchType: 'Automatic Diver',
      movement: 'Swiss ETA 2824-2 Elaboré',
      caseMaterial: 'Titanium Grade 5',
      condition: 'Brand New'
    },
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-11-05T14:30:00Z',
    reviewerNotes: 'Pressure tank tested to 30 ATM in QC chamber.',
    sellerId: 'seller-01'
  },
  {
    id: 'prod-006',
    sku: 'ACC-WALLET-08',
    name: 'Royal Saffiano Leather Bifold Wallet',
    category: 'Accessories',
    price: 320,
    stock: 12,
    lowStockThreshold: 4,
    description: 'Compact scratch-resistant cross-grain Saffiano leather wallet with eight card slots and RFID shielding lining.',
    status: 'archived',
    verificationStatus: 'approved',
    images: ['/images/product_leather_bag_1794326164222.jpg'],
    specs: {
      brand: 'Aurora Firenze',
      material: 'Saffiano Calf Leather',
      color: 'Royal Navy',
      condition: 'Brand New'
    },
    createdAt: '2026-08-20T11:00:00Z',
    updatedAt: '2026-10-30T10:00:00Z',
    sellerId: 'seller-01'
  },
  {
    id: 'prod-007',
    sku: 'WTC-SKEL-408',
    name: 'Chronometre Royale Openworked Skeleton 40mm',
    category: 'Watches',
    price: 4150,
    stock: 1,
    lowStockThreshold: 1,
    description: 'Hand-skeletonized rose-gold dress watch submitted for vault authentication and physical caliber inspection.',
    status: 'draft',
    verificationStatus: 'rejected',
    images: ['/images/watch_vintage_green_silk_1794332442691.jpg'],
    specs: {
      brand: 'Chronometre Royale',
      model: 'Atelier Skeleton 40',
      watchType: 'Manual Wind Skeleton',
      movement: 'Caliber CR-190 Openworked',
      caseMaterial: '18k Rose Gold',
      dialColor: 'Skeletonized Champagne',
      condition: 'Pre-Owned Mint'
    },
    createdAt: '2026-11-02T10:20:00Z',
    updatedAt: '2026-11-08T17:45:00Z',
    reviewerNotes: 'QC Failed: Macro Serial Number mismatch against atelier registry and Liveness check failed during secondary seal verification.',
    qcRejectionReasons: [
      '06 Macro Serial engraving mismatch between caseback engraving (#CR-40891) and submitted warranty dossier (#CR-40819).',
      'Tamper-seal video clip lacked continuous timestamp visibility during secondary seal verification.',
      'Crown guard chamfer finish variance flagged by Master Horology Specialist.'
    ],
    failedAngleIndex: 5,
    failedAngleLabel: '06 · Macro Serial',
    returnTracking: {
      trackingNumber: 'TM-RET-2026-4089',
      carrier: 'TrueMotion QC Armored Return Courier',
      estimatedDelivery: 'Nov 12, 2026',
      steps: [
        {
          label: 'QC Audit Flagged & Logged',
          timestamp: 'Nov 08, 10:15 AM',
          detail: 'Digital QC audit flagged discrepancy; lot withheld from live marketplace without physical hub transit.',
          status: 'completed'
        },
        {
          label: 'Tamper-Sealed for Return',
          timestamp: 'Nov 08, 04:40 PM',
          detail: 'Timepiece secured in insured return crate #RET-4089 with full unboxing audit log.',
          status: 'completed'
        },
        {
          label: 'In Return Transit to Atelier',
          timestamp: 'Active Courier Leg',
          detail: 'En route back to Evelyn Dubois Atelier via insured armored transit.',
          status: 'active'
        },
        {
          label: 'Delivered to Seller Atelier',
          timestamp: 'Est. Nov 12, 2026',
          detail: 'Signature confirmation required upon atelier handoff.',
          status: 'pending'
        }
      ]
    },
    anglePhotos: {
      dial: '/images/watch_vintage_green_silk_1794332442691.jpg',
      case: '/images/product_chronograph_watch_1794326161832.jpg',
      crown: '/images/watch_vintage_green_silk_1794332442691.jpg',
      back: '/images/product_chronograph_watch_1794326161832.jpg',
      clasp: '/images/watch_vintage_green_silk_1794332442691.jpg',
      serial: '/images/product_chronograph_watch_1794326161832.jpg'
    },
    sellerId: 'seller-01'
  },
  {
    id: 'prod-008',
    sku: 'WTC-ATELIER-512',
    name: 'Geneve Perpetual Moonphase 39mm Rose Gold',
    category: 'Watches',
    price: 54000,
    stock: 2,
    lowStockThreshold: 1,
    description: '18k rose gold perpetual calendar moonphase timepiece with guilloché ivory dial, sapphire exhibition caseback, and full manufacturer archive extract.',
    status: 'draft',
    verificationStatus: 'submitted',
    images: ['/images/product_burgundy_watch.jpg'],
    specs: {
      brand: 'Geneve Horlogerie',
      model: 'Perpetual Moonphase 39',
      watchType: 'Mechanical Automatic',
      movement: 'Calibre GH-512 Perpetual',
      caseMaterial: '18k Rose Gold',
      dialColor: 'Bordeaux Guilloché',
      condition: 'Brand New In Box'
    },
    createdAt: '2026-11-18T09:15:00Z',
    updatedAt: '2026-11-18T09:15:00Z',
    reviewerNotes: 'Stage 01 / 04: Digital QC dossier submitted. Awaiting AI optical check.',
    anglePhotos: {
      dial: '/images/product_burgundy_watch.jpg',
      case: '/images/hero_burgundy_horology.jpg',
      crown: '/images/watch_macro_dial_crown_1794924992900.jpg',
      back: '/images/hero_burgundy_horology.jpg',
      clasp: '/images/product_burgundy_watch.jpg',
      serial: '/images/watch_macro_dial_crown_1794924992900.jpg'
    },
    packingVideo: {
      fileName: 'TM-QC-SEAL-512.mp4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      uploadedAt: '2026-11-18T09:18:00Z'
    },
    sellerId: 'seller-01'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-44A1020',
    orderNumber: '44A1020',
    customerName: 'Arjun Mehta',
    customerEmail: 'arjun.mehta@mumbai-vault.in',
    shippingAddress: '42 Marine Drive, Suite 12B, Mumbai 400020',
    orderDate: '2026-01-21T10:30:00Z',
    status: 'delivered',
    items: [
      {
        productId: 'prod-001',
        productName: 'Luxury Mechanical',
        sku: 'SKU-9426009',
        price: 42500,
        quantity: 1,
        image: '/images/product_burgundy_watch.jpg'
      }
    ],
    subtotal: 42500,
    shippingFee: 0,
    totalAmount: 42500,
    escrowStatus: 'released',
    trackingNumber: 'TM-EXP-44A1020-IND',
    carrier: 'TrueMotion QC Armored Express',
    sellerId: 'seller-01'
  },
  {
    id: 'ord-44A1022',
    orderNumber: '44A1022',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@techsound.in',
    shippingAddress: '18 Richmond Road, Bangalore 560025',
    orderDate: '2026-01-27T14:15:00Z',
    status: 'shipping',
    items: [
      {
        productId: 'prod-001',
        productName: 'Luxury Watch',
        sku: 'SKU-9426009',
        price: 42500,
        quantity: 1,
        image: '/images/product_burgundy_watch.jpg'
      }
    ],
    subtotal: 42500,
    shippingFee: 0,
    totalAmount: 42500,
    escrowStatus: 'held',
    trackingNumber: 'TM-BLD-44A1022-BLR',
    carrier: 'TrueMotion QC Insured Courier',
    sellerId: 'seller-01'
  },
  {
    id: 'ord-44A1023',
    orderNumber: '44A1023',
    customerName: 'Rohan Kapoor',
    customerEmail: 'rohan.kapoor@delhicap.in',
    shippingAddress: '7 Golf Links, New Delhi 110003',
    orderDate: '2026-02-01T16:45:00Z',
    status: 'packing',
    items: [
      {
        productId: 'prod-004',
        productName: 'Leather Accessory',
        sku: 'SKU-9426003',
        price: 42500,
        quantity: 1,
        image: '/images/product_burgundy_leather.jpg'
      }
    ],
    subtotal: 42500,
    shippingFee: 0,
    totalAmount: 42500,
    escrowStatus: 'held',
    sellerId: 'seller-01'
  },
  {
    id: 'ord-8801',
    orderNumber: 'TM-ORD-2026-8801',
    customerName: 'Buyer #TM-8801 (Blind Escrow)',
    customerEmail: 'blind-escrow@truemotion-qc-vault.internal',
    shippingAddress: 'Direct Buyer Delivery · Privacy-Masked Address',
    orderDate: '2026-11-09T14:10:00Z',
    status: 'packing',
    items: [
      {
        productId: 'prod-001',
        productName: 'Geneve Heritage Chronograph Automatic 41mm',
        sku: 'WTC-CHRONO-901',
        price: 3450,
        quantity: 1,
        image: '/images/product_chronograph_watch_1794326161832.jpg'
      }
    ],
    subtotal: 3450,
    shippingFee: 50,
    totalAmount: 3500,
    escrowStatus: 'held',
    blindDestination: 'Direct Express to Buyer (Masked Waybill)',
    sellerId: 'seller-01'
  },
  {
    id: 'ord-8794',
    orderNumber: 'TM-ORD-2026-8794',
    customerName: 'Buyer #TM-8794 (Blind Escrow)',
    customerEmail: 'blind-escrow@truemotion-qc-vault.internal',
    shippingAddress: 'Direct Buyer Delivery · Privacy-Masked Address',
    orderDate: '2026-11-08T09:45:00Z',
    status: 'IN_DIRECT_TRANSIT',
    items: [
      {
        productId: 'prod-003',
        productName: 'Tailored Royal Navy Cashmere Overcoat',
        sku: 'APP-COAT-112',
        price: 1850,
        quantity: 1,
        image: '/images/product_designer_coat_1794326163228.jpg'
      }
    ],
    subtotal: 1850,
    shippingFee: 40,
    totalAmount: 1890,
    escrowStatus: 'held',
    trackingNumber: 'TM-EXP-9928174410',
    carrier: 'TrueMotion Direct Express Courier',
    blindWaybillId: 'WB-TM-2026-8794',
    blindDestination: 'Direct Express to Buyer (Masked Waybill)',
    dispatchedAt: '2026-11-08T14:30:00Z',
    packingEvidence: {
      referenceId: 'PK-PROOF-2026-8794-A',
      timestamp: '2026-11-08T14:30:00Z',
      packageWeightKg: 2.35,
      notes: 'Packaged in waterproof climate seal, magnetic atelier box, and double-corrugated tamper-evident security carton.',
      photos: ['/images/product_designer_coat_1794326163228.jpg'],
      hasVideoProof: true
    },
    sellerId: 'seller-01'
  },
  {
    id: 'ord-8760',
    orderNumber: 'TM-ORD-2026-8760',
    customerName: 'Kenzo Takahashi',
    customerEmail: 'kenzo.takahashi@ginza-audio.jp',
    shippingAddress: 'Ginza 6-10-1, Chuo-ku, Tokyo 104-0061, Japan',
    orderDate: '2026-11-05T03:20:00Z',
    status: 'delivered',
    items: [
      {
        productId: 'prod-002',
        productName: 'AudioPhile Studio Pro Wireless Headphones',
        sku: 'ELC-AUDIO-440',
        price: 680,
        quantity: 2,
        image: '/images/product_studio_headphones_1794326162702.jpg'
      }
    ],
    subtotal: 1360,
    shippingFee: 65,
    totalAmount: 1425,
    escrowStatus: 'released',
    trackingNumber: 'FEDEX-PRIO-8402917721',
    carrier: 'FedEx International Priority',
    packingEvidence: {
      referenceId: 'PK-PROOF-2026-8760-B',
      timestamp: '2026-11-05T08:15:00Z',
      packageWeightKg: 3.10,
      notes: 'Serial #PH-99201 and #PH-99202 scanned and filmed during packaging box insertion.',
      photos: ['/images/product_studio_headphones_1794326162702.jpg'],
      hasVideoProof: true
    },
    sellerId: 'seller-01'
  },
  {
    id: 'ord-8722',
    orderNumber: 'TM-ORD-2026-8722',
    customerName: 'Dmitri Voronin',
    customerEmail: 'd.voronin@monaco-invest.mc',
    shippingAddress: 'Avenue Princesse Grace, 98000 Monaco',
    orderDate: '2026-10-31T17:50:00Z',
    status: 'disputed',
    items: [
      {
        productId: 'prod-004',
        productName: 'Aurora Full-Grain Leather Weekender Duffel',
        sku: 'ACC-BAG-770',
        price: 920,
        quantity: 1,
        image: '/images/product_leather_bag_1794326164222.jpg'
      }
    ],
    subtotal: 920,
    shippingFee: 45,
    totalAmount: 965,
    escrowStatus: 'held',
    trackingNumber: 'UPS-EXPRESS-1Z992A0184',
    carrier: 'UPS Worldwide Saver',
    packingEvidence: {
      referenceId: 'PK-PROOF-2026-8722-C',
      timestamp: '2026-11-01T09:12:00Z',
      packageWeightKg: 2.80,
      notes: 'High-res closeups of leather surface before wrapping. Tamper seal #TS-88410 applied.',
      photos: ['/images/product_leather_bag_1794326164222.jpg'],
      hasVideoProof: true
    },
    sellerId: 'seller-01'
  },
  {
    id: 'ord-8690',
    orderNumber: 'TM-ORD-2026-8690',
    customerName: 'Victoria Belmont',
    customerEmail: 'v.belmont@manhattan-arts.org',
    shippingAddress: '740 Park Avenue, Apt 14D, New York, NY 10021, USA',
    orderDate: '2026-10-25T11:15:00Z',
    status: 'delivered',
    items: [
      {
        productId: 'prod-001',
        productName: 'Geneve Heritage Chronograph Automatic 41mm',
        sku: 'WTC-CHRONO-901',
        price: 3450,
        quantity: 1,
        image: '/images/product_chronograph_watch_1794326161832.jpg'
      }
    ],
    subtotal: 3450,
    shippingFee: 50,
    totalAmount: 3500,
    escrowStatus: 'released',
    trackingNumber: 'DHL-EXPRESS-7718293012',
    carrier: 'DHL Express',
    sellerId: 'seller-01'
  }
];

export const INITIAL_DISPUTES: Dispute[] = [
  {
    id: 'disp-001',
    orderId: 'ord-8722',
    orderNumber: 'TM-ORD-2026-8722',
    customerName: 'Dmitri Voronin',
    reason: 'Buyer claims zipper pull showed minor brass oxidation upon unboxing.',
    claimAmount: 965,
    status: 'evidence_submitted',
    createdAt: '2026-11-04T12:00:00Z',
    updatedAt: '2026-11-05T09:30:00Z',
    evidenceRefId: 'PK-PROOF-2026-8722-C',
    resolutionNotes: 'Seller packing video and high-res macro photos submitted to TrueMotion QC Seller Protection Arbitration. Under evaluation.',
    sellerId: 'seller-01'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    title: 'New Order Received',
    message: 'Order TM-ORD-2026-8801 for Geneve Heritage Chronograph received from Lord Sterling Cavendish. Ready for packing.',
    category: 'orders',
    timestamp: '2026-11-09T14:10:00Z',
    read: false,
    sellerId: 'seller-01'
  },
  {
    id: 'notif-02',
    title: 'Low Stock Alert',
    message: 'Aurora Full-Grain Leather Weekender Duffel stock is down to 2 units (Threshold: 3). Consider replenishing atelier inventory.',
    category: 'alerts',
    timestamp: '2026-11-08T18:00:00Z',
    read: false,
    sellerId: 'seller-01'
  },
  {
    id: 'notif-03',
    title: 'Escrow Funds Released',
    message: '₹1,425.00 has been released from escrow to your available payout balance for delivered order TM-ORD-2026-8760.',
    category: 'payments',
    timestamp: '2026-11-07T10:00:00Z',
    read: true,
    sellerId: 'seller-01'
  },
  {
    id: 'notif-04',
    title: 'QC Verification Approved',
    message: 'Geneve Heritage Chronograph Automatic 41mm passed human QC inspection and is marked Verified on the marketplace.',
    category: 'products',
    timestamp: '2026-10-15T11:20:00Z',
    read: true,
    sellerId: 'seller-01'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-01',
    action: 'Order Received',
    details: 'New order #TM-ORD-2026-8801 placed by Lord Sterling Cavendish (₹3,500)',
    entityRef: 'TM-ORD-2026-8801',
    timestamp: '2026-11-09T14:10:00Z',
    sellerId: 'seller-01'
  },
  {
    id: 'act-02',
    action: 'Packing Proof Submitted',
    details: 'Uploaded photo & video packing evidence for order #TM-ORD-2026-8794',
    entityRef: 'PK-PROOF-2026-8794-A',
    timestamp: '2026-11-08T14:30:00Z',
    sellerId: 'seller-01'
  },
  {
    id: 'act-03',
    action: 'Inventory Depleted',
    details: 'Seabound Submersible 300M Diver Watch reached 0 available units',
    entityRef: 'WTC-DIVER-300',
    timestamp: '2026-11-05T14:30:00Z',
    sellerId: 'seller-01'
  },
  {
    id: 'act-04',
    action: 'Security Sign-in',
    details: 'Authenticated from Paris, France (Safari on macOS · IP 194.214.88.12)',
    entityRef: 'SEC-SESSION',
    timestamp: '2026-11-09T08:14:00Z',
    sellerId: 'seller-01'
  }
];
