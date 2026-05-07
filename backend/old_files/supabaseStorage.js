const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Storage features will be disabled.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const BUCKET_NAME = 'player-photos';

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The name for the file
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
async function uploadFile(fileBuffer, fileName, mimeType) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const ext = fileName.split('.').pop();
  const uniqueFileName = `player_${timestamp}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueFileName, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param {string} fileUrl - The public URL of the file to delete
 * @returns {Promise<void>}
 */
async function deleteFile(fileUrl) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  // Extract the file path from the URL
  const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
  if (urlParts.length < 2) {
    throw new Error('Invalid file URL');
  }
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Check if Supabase is configured
 * @returns {boolean}
 */
function isConfigured() {
  return supabase !== null;
}

module.exports = {
  uploadFile,
  deleteFile,
  isConfigured,
};
