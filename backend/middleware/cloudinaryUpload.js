import multer from "multer";
import CloudinaryStorage from "multer-storage-cloudinary";
import { cloudinaryPkg } from "../utils/cloudinary.js";

// Factory so each upload route can namespace its files into a distinct
// Cloudinary folder (course-images, lesson-files, request-images, ...)
// while sharing the same storage/limits configuration.
const createCloudinaryUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinaryPkg,
    params: {
      folder: `smartstudent/${folder}`,
      resource_type: "auto", // let Cloudinary detect image/video/raw (PDFs, zips, etc.)
    },
  });

  return multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  });
};

export default createCloudinaryUploader;
