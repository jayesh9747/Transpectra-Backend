const express = require("express");
const router = express.Router();
const routeOptimization = require("../AIModelAPI/RouteOptimization")

router.post("/optimize-route", routeOptimization.getRoutes);
module.exports = router;
