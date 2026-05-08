import { Request } from 'express';

export interface JwtPayload {
  id: string;
  role: string;
  name: string;
  iat?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  file?: Express.Multer.File;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadableFile {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
}
