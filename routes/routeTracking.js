const express = require("express");
const router = express.Router();
const { updateRouteTracking } = require("../controllers/routeTracking");

// POST route to handle incremental updates
router.post("/route-tracking", updateRouteTracking);

module.exports = router;
