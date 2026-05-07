import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedExts = /\.(jpeg|jpg|png|gif|webp|heic|heif)$/i;
    const allowedMimes = /^image\//i;
    const extOk = allowedExts.test(path.extname(file.originalname));
    const mimeOk = allowedMimes.test(file.mimetype) || file.mimetype === 'application/octet-stream';
    if (extOk || mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export default upload;
