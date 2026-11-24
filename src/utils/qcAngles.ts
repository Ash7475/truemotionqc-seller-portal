import { Product, ProductCategory } from '../types';

export interface QcAngleSlot {
  id: string;
  label: string;
}

export const CATEGORY_QC_ANGLES: Record<string, QcAngleSlot[]> = {
  watches: [
    { id: 'dial', label: 'Dial & Hands' },
    { id: 'case', label: 'Case Profile' },
    { id: 'crown', label: 'Crown / Pushers' },
    { id: 'back', label: 'Case Back' },
    { id: 'clasp', label: 'Clasp' },
    { id: 'serial', label: 'Macro Serial' }
  ],
  timepieces: [
    { id: 'dial', label: 'Dial & Hands' },
    { id: 'case', label: 'Case Profile' },
    { id: 'crown', label: 'Crown / Pushers' },
    { id: 'back', label: 'Case Back' },
    { id: 'clasp', label: 'Clasp' },
    { id: 'serial', label: 'Macro Serial' }
  ],
  apparel: [
    { id: 'front', label: 'Full Front' },
    { id: 'back', label: 'Full Back' },
    { id: 'label', label: 'Brand Label' },
    { id: 'wash', label: 'Wash Tags' },
    { id: 'stitching', label: 'Macro Stitching' },
    { id: 'hardware', label: 'Hardware/Buttons' }
  ],
  accessories: [
    { id: 'front', label: 'Front Profile' },
    { id: 'back', label: 'Back & Base' },
    { id: 'interior', label: 'Interior Lining' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'strap', label: 'Strap/Handles' },
    { id: 'stamp', label: 'Brand Stamp' }
  ],
  leather_goods: [
    { id: 'front', label: 'Front Profile' },
    { id: 'back', label: 'Back & Base' },
    { id: 'interior', label: 'Interior Lining' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'strap', label: 'Strap/Handles' },
    { id: 'stamp', label: 'Brand Stamp' }
  ],
  electronics: [
    { id: 'front', label: 'Front Display / Face' },
    { id: 'back', label: 'Back Panel' },
    { id: 'ports', label: 'Ports & Connectors' },
    { id: 'accessories', label: 'Cables / Accessories' },
    { id: 'power', label: 'Powered On Status' },
    { id: 'serial', label: 'Macro Serial Number' }
  ],
  default: [
    { id: 'front', label: 'Front View' },
    { id: 'back', label: 'Back View' },
    { id: 'top', label: 'Top / Profile' },
    { id: 'bottom', label: 'Bottom / Base' },
    { id: 'detail', label: 'Material Detail' },
    { id: 'proof', label: 'Authenticity Proof' }
  ]
};

const ANGLE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  watches: {
    dial: 'Front face macro shot: dial markers, crystal, logo, and handset',
    case: 'Side profile: lug symmetry, brushed/polished bevels, and flank',
    crown: 'Winding crown knurling, pushers, and water-resistance seals',
    back: 'Rear caseback, exhibition sapphire, and movement bridge finishing',
    clasp: 'Folding clasp, deployment buckle hallmarks, and bracelet link pins',
    serial: 'Laser-etched serial reference, model stamp, and provenance hallmarks'
  },
  apparel: {
    front: 'Full garment front drape, lapel symmetry, and overall silhouette',
    back: 'Full rear garment construction, shoulder yoke, and vent alignment',
    label: 'Woven neck label, atelier brand crest, and collar stitching',
    wash: 'Interior composition tag, care symbols, and origin batch label',
    stitching: 'Macro close-up of hand-finished seams, lining joinery, and weave',
    hardware: 'Horn buttons, engraved zipper pulls, and tailored closures'
  },
  accessories: {
    front: 'Structured front elevation showing leather grain and piping symmetry',
    back: 'Rear panel, bottom studs, and edge-paint integrity along base',
    interior: 'Full interior lining, stitched pockets, and serial pocket tab',
    hardware: 'Solid brass/palladium clasps, D-rings, and engraved lockplate',
    strap: 'Rolled leather handles, anchor stitching, and shoulder strap clips',
    stamp: 'Heat-embossed atelier brand stamp and foil/blind date code'
  },
  electronics: {
    front: 'Primary front grille, transducer housing, or display chassis',
    back: 'Rear housing, acoustic vents, and anodized aluminum finish',
    ports: 'USB-C / balanced audio ports, pin alignment, and hinge joints',
    accessories: 'Original braided cables, flight adapters, and calibration case',
    power: 'LED power/pairing indicator illuminated during active self-test',
    serial: 'Macro capture of laser-etched chassis serial and regulatory markings'
  },
  default: {
    front: 'Primary front elevation under diffused atelier studio lighting',
    back: 'Full rear perspective confirming structural finish and alignment',
    top: 'Overhead profile showing contours, edges, and upper trim',
    bottom: 'Underside base, protective feet, and workshop markings',
    detail: 'Macro texture capture of primary material grain and craftsmanship',
    proof: 'Authentic hallmark, embossed stamp, or accompanying provenance card'
  }
};

export function resolveCategoryQcKey(category?: string): keyof typeof CATEGORY_QC_ANGLES {
  const normalized = (category || '').trim().toLowerCase();
  if (normalized === 'watches' || normalized === 'timepieces' || normalized === 'watch') {
    return 'watches';
  }
  if (normalized === 'apparel' || normalized === 'clothing' || normalized === 'fashion') {
    return 'apparel';
  }
  if (
    normalized === 'accessories' ||
    normalized === 'leather_goods' ||
    normalized === 'leather goods' ||
    normalized === 'bags'
  ) {
    return 'accessories';
  }
  if (normalized === 'electronics' || normalized === 'audio' || normalized === 'tech') {
    return 'electronics';
  }
  return 'default';
}

export function getCategoryQcAngles(category?: string): QcAngleSlot[] {
  const key = resolveCategoryQcKey(category);
  return CATEGORY_QC_ANGLES[key] || CATEGORY_QC_ANGLES.default;
}

export function getAngleDescription(category: string | undefined, angleId: string): string {
  const key = resolveCategoryQcKey(category);
  return (
    ANGLE_DESCRIPTIONS[key]?.[angleId] ||
    ANGLE_DESCRIPTIONS.default[angleId] ||
    'High-resolution macro authentication capture for TrueMotion QC inspection.'
  );
}

export function getCategoryFallbackImage(category?: string): string {
  const key = resolveCategoryQcKey(category);
  switch (key) {
    case 'watches':
    case 'timepieces':
      return '/images/product_chronograph_watch_1794326161832.jpg';
    case 'apparel':
      return '/images/product_designer_coat_1794326163228.jpg';
    case 'accessories':
    case 'leather_goods':
      return '/images/product_leather_bag_1794326164222.jpg';
    case 'electronics':
      return '/images/product_studio_headphones_1794326162702.jpg';
    default:
      return '/images/product_chronograph_watch_1794326161832.jpg';
  }
}

export function getEmptyAnglePhotosForCategory(category?: string, prefillFirstSlot = false): Record<string, string> {
  const slots = getCategoryQcAngles(category);
  const firstImg = getCategoryFallbackImage(category);
  const result: Record<string, string> = {};
  slots.forEach((slot, idx) => {
    result[slot.id] = prefillFirstSlot && idx === 0 ? firstImg : '';
  });
  return result;
}

export function getSampleAnglePhotosForCategory(category?: ProductCategory | string): Record<string, string> {
  const slots = getCategoryQcAngles(category);
  const key = resolveCategoryQcKey(category);
  const primary = getCategoryFallbackImage(category);
  const secondary =
    key === 'watches' || key === 'timepieces'
      ? '/images/watch_vintage_green_silk_1794332442691.jpg'
      : primary;

  const result: Record<string, string> = {};
  slots.forEach((slot, idx) => {
    result[slot.id] = idx % 2 === 0 ? primary : secondary;
  });
  return result;
}

export function getProductAngleImage(
  product: Pick<Product, 'category' | 'anglePhotos' | 'images'>,
  angleId: string,
  angleIndex: number
): string {
  if (product.anglePhotos && product.anglePhotos[angleId]) {
    return product.anglePhotos[angleId];
  }
  const fallbackImg = product.images[angleIndex % Math.max(1, product.images.length)];
  return fallbackImg || getCategoryFallbackImage(product.category);
}
