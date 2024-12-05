const express = require("express");
const router = express.Router();
const { createOrder } = require("../controllers/Order");
const { getManufacturerDetails } = require("../controllers/Order");



/**
 * 
 * Purpose : creating Order By the Ware House manager
 * 
 * URL : /api/v1/order/create
 * 
 * Testing : Done
 * */ 
router.post("/create", createOrder);

/**
 * 
 * Purpose :  Route to fetch manufacturer details with linked warehouses and orders
 * 
 * URL : /api/v1/order/manufacturer/:manufacturerId/details
 *  
 * */ 

router.get("/manufacturer/:manufacturerId/details", getManufacturerDetails);


module.exports = router;
