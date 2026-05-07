"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = __importDefault(require("../utils/logger"));
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
    logger_1.default.warn('Supabase credentials not found. Storage features will be disabled.');
}
const supabase = supabaseUrl && supabaseKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey)
    : null;
const BUCKET_NAME = 'cricket-app';
/**
 * Upload a file to Supabase Storage
 */
async function uploadFile(file, fileName) {
    if (!supabase) {
        logger_1.default.error('Supabase is not configured');
        throw new Error('Supabase is not configured');
    }
    const fileBuffer = file.buffer || file;
    const mimeType = file.mimetype || 'application/octet-stream';
    let ext = 'jpg';
    if (file.originalname) {
        ext = file.originalname.split('.').pop().toLowerCase();
    }
    else if (mimeType.startsWith('image/')) {
        ext = mimeType.split('/')[1];
    }
    const uniqueFileName = `${fileName}.${ext}`;
    logger_1.default.info(`Uploading file: ${uniqueFileName} (${mimeType})`);
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueFileName, fileBuffer, {
        contentType: mimeType,
        upsert: true,
    });
    if (error) {
        logger_1.default.error(`Failed to upload file: ${error.message}`);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);
    logger_1.default.info(`File uploaded successfully: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
}
/**
 * Delete a file from Supabase Storage
 */
async function deleteFile(fileUrl) {
    if (!supabase) {
        logger_1.default.error('Supabase is not configured');
        throw new Error('Supabase is not configured');
    }
    const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
        logger_1.default.error(`Invalid file URL: ${fileUrl}`);
        throw new Error('Invalid file URL');
    }
    const filePath = urlParts[1];
    logger_1.default.info(`Deleting file: ${filePath}`);
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
    if (error) {
        logger_1.default.error(`Failed to delete file: ${error.message}`);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
    logger_1.default.info(`File deleted successfully: ${filePath}`);
}
/**
 * Check if Supabase is configured
 */
function isConfigured() {
    return supabase !== null;
}
exports.default = {
    uploadFile,
    deleteFile,
    isConfigured,
};
//# sourceMappingURL=supabaseStorage.js.map