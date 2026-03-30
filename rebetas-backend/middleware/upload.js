const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "rebetas",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "jfif"],
  },
});

const upload = multer({ storage });

module.exports = upload;
