import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ahhjnszfisfyqdrcotph.supabase.co';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_secret_key_here';

export const isPlaceholderKey = !SUPABASE_SERVICE_ROLE_KEY || 
  SUPABASE_SERVICE_ROLE_KEY.includes('your_secret_key') || 
  SUPABASE_SERVICE_ROLE_KEY === 'your_secret_key_here';

if (isPlaceholderKey) {
  console.warn(
    '\n⚠️  [Supabase Warning]: SUPABASE_SERVICE_ROLE_KEY in backend/.env is currently using a placeholder ("your_secret_key_here").' +
    '\n    To persist directly to your Supabase PostgreSQL database and Storage buckets, replace it with your actual service_role secret key from:' +
    `\n    https://supabase.com/dashboard/project/${SUPABASE_URL.replace(/https:\/\/(.*?)\.supabase\.co.*/, '$1')}/settings/api\n`
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Upload a binary buffer directly to a Supabase Storage bucket
 * @param {string} bucket - 'kyc-docs' | 'product-photos' | 'packing-videos'
 * @param {string} filePath - path inside bucket, e.g. 'selfies/selfie-123.jpg'
 * @param {Buffer} buffer - file content buffer
 * @param {string} mimeType - e.g. 'image/jpeg', 'video/webm'
 * @returns {Promise<{ publicUrl: string|null, error: any }>}
 */
export async function uploadToSupabase(bucket, filePath, buffer, mimeType = 'application/octet-stream') {
  try {
    if (isPlaceholderKey) {
      console.warn(`[Supabase Storage] Skipped upload to ${bucket}/${filePath} (placeholder key).`);
      return { publicUrl: null, error: new Error('Placeholder Supabase key in use') };
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error(`[Supabase Storage] Error uploading to ${bucket}/${filePath}:`, error.message);
      return { publicUrl: null, error };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl || null;
    return { publicUrl, error: null };
  } catch (err) {
    console.error(`[Supabase Storage] Upload exception on ${bucket}/${filePath}:`, err);
    return { publicUrl: null, error: err };
  }
}

/**
 * Upload a base64 encoded string or preserve existing public URL
 * @param {string} bucket - 'kyc-docs' | 'product-photos' | 'packing-videos'
 * @param {string} folder - 'selfies' | 'macro' | 'videos'
 * @param {string} baseName - filename identifier
 * @param {string} base64OrUrl - base64 string or already hosted URL
 * @returns {Promise<string>} public URL or original string
 */
export async function uploadBase64ToSupabase(bucket, folder, baseName, base64OrUrl) {
  if (!base64OrUrl || typeof base64OrUrl !== 'string') return base64OrUrl;

  // Already a remote or relative URL
  if (base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://') || base64OrUrl.startsWith('/images/') || base64OrUrl.startsWith('/uploads/')) {
    return base64OrUrl;
  }

  // Not base64
  if (!base64OrUrl.startsWith('data:')) {
    return base64OrUrl;
  }

  try {
    const matches = base64OrUrl.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let ext = 'jpg';
    let buffer;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('webm')) ext = 'webm';
      else if (mimeType.includes('mp4')) ext = 'mp4';
      else if (mimeType.includes('pdf')) ext = 'pdf';
    } else {
      const cleanBase64 = base64OrUrl.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    }

    const filename = `${baseName}-${Date.now()}.${ext}`;
    const filePath = folder ? `${folder}/${filename}` : filename;

    const { publicUrl, error } = await uploadToSupabase(bucket, filePath, buffer, mimeType);
    if (publicUrl && !error) {
      return publicUrl;
    }
  } catch (err) {
    console.error(`[Supabase Storage] Failed to upload base64 to ${bucket}:`, err.message);
  }

  return base64OrUrl;
}

/**
 * Delete one or more files from Supabase Storage
 */
export async function deleteFromSupabase(bucket, filePaths) {
  try {
    if (isPlaceholderKey || !filePaths || filePaths.length === 0) return { error: null };
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    return await supabase.storage.from(bucket).remove(paths);
  } catch (err) {
    console.error(`[Supabase Storage] Delete error in ${bucket}:`, err.message);
    return { error: err };
  }
}

/**
 * Remove an entire directory prefix from Supabase Storage
 */
export async function deleteFolderFromSupabase(bucket, folderPrefix) {
  try {
    if (isPlaceholderKey || !folderPrefix) return { error: null };
    const { data: list, error: listErr } = await supabase.storage.from(bucket).list(folderPrefix);
    if (listErr || !list || list.length === 0) return { error: listErr };

    const filesToRemove = list.map(item => `${folderPrefix}/${item.name}`);
    return await supabase.storage.from(bucket).remove(filesToRemove);
  } catch (err) {
    console.error(`[Supabase Storage] Delete folder error in ${bucket}:`, err.message);
    return { error: err };
  }
}

/**
 * Ensure the 3 required Supabase Storage buckets exist
 */
export async function ensureBuckets() {
  if (isPlaceholderKey) return;
  const buckets = ['kyc-docs', 'product-photos', 'packing-videos'];
  for (const b of buckets) {
    try {
      await supabase.storage.createBucket(b, { public: true });
    } catch (ignore) {
      // Bucket might already exist or service key policy handles it
    }
  }
}

// Initial bucket setup attempt (non-blocking)
ensureBuckets().catch(() => {});

export default supabase;

