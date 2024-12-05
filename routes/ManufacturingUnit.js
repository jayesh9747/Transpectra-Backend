const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const manufacturingUnitController = require("../controllers/ManufacturingUnit");

const router = express.Router();

// Ensure "uploads" directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Limit set to 20 MB
  fileFilter: (req, file, cb) => {
    // Optional: Validate file type
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

// Define routes

/***
 * 
 * Purpose : assign Manufacturer unit
 * 
 * URl : /api/v1/manufacturingUnit/create
 * 
 * 
 */
router.post(
  "/create",
  upload.fields([{ name: "companyImage", maxCount: 1 }]),
  manufacturingUnitController.addManufacturingUnit
);


/***
 * 
 * Purpose : Fetch Manufacturer unit details
 * 
 * URl : /api/v1/manufacturingUnit/:managerId
 * 
 * 
 */
router.get("/:managerId", manufacturingUnitController.getCompanyDetailsByManagerId);

module.exports = router;
