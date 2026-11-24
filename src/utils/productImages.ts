import React from 'react';

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

function isValidCandidateUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'p1' || trimmed.startsWith('RIFF') || trimmed.includes('/uploads/dead')) {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('data:image/')
  );
}

/**
 * Safely extracts the first valid product image URL across all schema shapes:
 * - product.macro_photos (array or JSON string)
 * - product.macroPhotos
 * - product.macro_photo_urls
 * - product.images (array or string)
 * - product.image_url
 * - product.image
 * - product.anglePhotos (object)
 *
 * If none or invalid, returns FALLBACK_PRODUCT_IMAGE.
 */
export function getProductImage(product?: any): string {
  if (!product) return FALLBACK_PRODUCT_IMAGE;

  // 1. Check macro_photos / macroPhotos
  const rawMacro = product.macro_photos || product.macroPhotos;
  if (rawMacro) {
    if (Array.isArray(rawMacro) && rawMacro.length > 0) {
      const match = rawMacro.find(isValidCandidateUrl);
      if (match) return match.trim();
    } else if (typeof rawMacro === 'string') {
      try {
        const parsed = JSON.parse(rawMacro);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const match = parsed.find(isValidCandidateUrl);
          if (match) return match.trim();
        }
      } catch {
        if (isValidCandidateUrl(rawMacro)) return rawMacro.trim();
      }
    }
  }

  // 2. Check macro_photo_urls
  if (Array.isArray(product.macro_photo_urls) && product.macro_photo_urls.length > 0) {
    const match = product.macro_photo_urls.find(isValidCandidateUrl);
    if (match) return match.trim();
  }

  // 3. Check images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const match = product.images.find(isValidCandidateUrl);
    if (match) return match.trim();
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const match = parsed.find(isValidCandidateUrl);
        if (match) return match.trim();
      }
    } catch {
      if (isValidCandidateUrl(product.images)) return product.images.trim();
    }
  }

  // 4. Check image_url
  if (isValidCandidateUrl(product.image_url)) {
    return product.image_url.trim();
  }

  // 5. Check image
  if (isValidCandidateUrl(product.image)) {
    return product.image.trim();
  }

  // 6. Check anglePhotos object
  if (product.anglePhotos && typeof product.anglePhotos === 'object') {
    const firstVal = Object.values(product.anglePhotos).find(isValidCandidateUrl);
    if (firstVal && typeof firstVal === 'string') return firstVal.trim();
  }

  return FALLBACK_PRODUCT_IMAGE;
}

/**
 * Standard synthetic image error handler: swaps to high-res luxury fallback
 * if image fails to load or returns 404.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  if (e.currentTarget.src !== FALLBACK_PRODUCT_IMAGE) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
  }
};

