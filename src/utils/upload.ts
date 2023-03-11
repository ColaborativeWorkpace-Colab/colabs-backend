import multer from "multer";
import path from "path";
import fs from "fs";
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from "cloudinary";

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const uploadPath = "uploads/";
    !fs.existsSync(uploadPath) && fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename(_req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

/**
 * Check if a file type matches one of the expected extensions (images only)
 * @param file
 * @param cb
 */
function checkFileType(
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(Error("Images only!"));
  }
}

const uploadMulter = multer({
  storage,
  fileFilter: function (_req, file, cb) {
    checkFileType(file, cb);
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (path: string, folder: string) => {
  return new Promise<UploadApiResponse | UploadApiErrorResponse>((resolve) => {
    resolve(cloudinary.uploader.upload(path, { folder: folder }));
  });
};
export { uploadMulter, uploadCloudinary };
