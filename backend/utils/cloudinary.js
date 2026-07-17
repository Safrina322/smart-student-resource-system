import dotenv from "dotenv";
import cloudinaryPkg from "cloudinary";

// ES module imports are hoisted, so this module's top-level code can run
// before an importer's own dotenv.config() call - load it here directly
// (same self-contained pattern db.js uses) rather than relying on import
// order elsewhere to have populated process.env first.
dotenv.config();

const cloudinary = cloudinaryPkg.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Default export: the configured v2 SDK, for direct calls like
// cloudinary.uploader.upload(...).
export default cloudinary;

// multer-storage-cloudinary's CloudinaryStorage expects the raw package
// (the object with a `.v2` property), not the v2 instance itself - both
// reference the same configured client under the hood.
export { cloudinaryPkg };
