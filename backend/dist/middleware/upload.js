"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedExts = /\.(jpeg|jpg|png|gif|webp|heic|heif)$/i;
        const allowedMimes = /^image\//i;
        const extOk = allowedExts.test(path_1.default.extname(file.originalname));
        const mimeOk = allowedMimes.test(file.mimetype) || file.mimetype === 'application/octet-stream';
        if (extOk || mimeOk) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
exports.default = upload;
//# sourceMappingURL=upload.js.map