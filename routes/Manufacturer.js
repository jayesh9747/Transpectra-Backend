const express = require("express");
const router = express.Router();
const { getAllManufacturers } = require("../controllers/Manufacturer");

/**
 * 
 * Purpose : fetch manufacturers with linked details
 * 
 * URL : /api/v1/manufacturer/
 * 
 *  
 */
router.get("/", getAllManufacturers);

module.exports = router;
