const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const warehouseController = require("../controllers/Warehouse");

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
    const allowedMimeTypes = ["image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and Excel files are allowed."));
    }
  },
});

// Define routes
router.post(
  "/addWarehouse",
  upload.fields([
    { name: "warehouseImage", maxCount: 1 },
    { name: "inventoryExcel", maxCount: 1 },
  ]),
  warehouseController.addWarehouse
);

router.get("/:managerId", warehouseController.getWarehouseDetailsByManagerId);

module.exports = router;
