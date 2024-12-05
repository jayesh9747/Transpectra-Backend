const express = require("express");
const multer = require("multer");
const { addYard, getWarehouseDetailsForManager } = require("../controllers/YardManage");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Multer configuration to handle form-data without files
const upload = multer().none();

/**
 * @route POST /addYard
 * @description Add a new yard with details from form-data
 */
router.post("/addYard", upload, addYard);

/**
 * @route GET /:yardManagerId
 * @description Get warehouse details for a yard manager
 */
router.get("/:yardManagerId",auth, getWarehouseDetailsForManager);


module.exports = router;
