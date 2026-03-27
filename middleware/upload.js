const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 🔥 ensure folder exists (VERY IMPORTANT)
const uploadPath = path.join(__dirname, "..", "uploads", "logos");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s/g, "");

    const uniqueName = `${Date.now()}-${name}${ext}`;

    cb(null, uniqueName);
  },
});

// file filter (only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
