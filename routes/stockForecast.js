const express = require("express");
const { getForecast } = require("../controllers/stockForecast");

const router = express.Router();

// Define the route for stock forecasting
/**
 * 
 * 
 */

router.post("/inventory", getForecast);

module.exports = router;
