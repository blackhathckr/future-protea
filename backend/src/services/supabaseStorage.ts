import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';
import { UploadableFile } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.warn('Supabase credentials not found. Storage features will be disabled.');
}

const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const BUCKET_NAME = 'cricket-app';

/**
 * Upload a file to Supabase Storage
 */
async function uploadFile(file: UploadableFile | Buffer, fileName: string): Promise<string> {
  if (!supabase) {
    logger.error('Supabase is not configured');
    throw new Error('Supabase is not configured');
  }

  const fileBuffer = (file as UploadableFile).buffer || (file as Buffer);
  const mimeType = (file as UploadableFile).mimetype || 'application/octet-stream';

  let ext = 'jpg';
  if ((file as UploadableFile).originalname) {
    ext = (file as UploadableFile).originalname!.split('.').pop()!.toLowerCase();
  } else if (mimeType.startsWith('image/')) {
    ext = mimeType.split('/')[1];
  }

  const uniqueFileName = `${fileName}.${ext}`;

  logger.info(`Uploading file: ${uniqueFileName} (${mimeType})`);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueFileName, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    logger.error(`Failed to upload file: ${error.message}`);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  logger.info(`File uploaded successfully: ${publicUrlData.publicUrl}`);
  return publicUrlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 */
async function deleteFile(fileUrl: string): Promise<void> {
  if (!supabase) {
    logger.error('Supabase is not configured');
    throw new Error('Supabase is not configured');
  }

  const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
  if (urlParts.length < 2) {
    logger.error(`Invalid file URL: ${fileUrl}`);
    throw new Error('Invalid file URL');
  }
  const filePath = urlParts[1];

  logger.info(`Deleting file: ${filePath}`);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    logger.error(`Failed to delete file: ${error.message}`);
    throw new Error(`Failed to delete file: ${error.message}`);
  }

  logger.info(`File deleted successfully: ${filePath}`);
}

/**
 * Check if Supabase is configured
 */
function isConfigured(): boolean {
  return supabase !== null;
}

export default {
  uploadFile,
  deleteFile,
  isConfigured,
};
