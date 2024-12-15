const express = require("express");
const router = express.Router();
const { updateRouteTracking, realTimeTrackingOfDelivery } = require("../controllers/routeTracking");

// POST route to handle incremental updates
router.post("/route-tracking", updateRouteTracking);

router.post('/real', realTimeTrackingOfDelivery)

module.exports = router;
