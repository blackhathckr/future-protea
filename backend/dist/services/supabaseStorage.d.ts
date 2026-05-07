import { UploadableFile } from '../types';
/**
 * Upload a file to Supabase Storage
 */
declare function uploadFile(file: UploadableFile | Buffer, fileName: string): Promise<string>;
/**
 * Delete a file from Supabase Storage
 */
declare function deleteFile(fileUrl: string): Promise<void>;
/**
 * Check if Supabase is configured
 */
declare function isConfigured(): boolean;
declare const _default: {
    uploadFile: typeof uploadFile;
    deleteFile: typeof deleteFile;
    isConfigured: typeof isConfigured;
};
export default _default;
//# sourceMappingURL=supabaseStorage.d.ts.map