const express = require("express");
const router = express.Router();

const {
    ChooseDelivery,
    GetDelivery,
    getAvailableDriversDetailsByManufacturingUnit,
    assignDriverToDelivery,
    fetchPendingDeliveriesByDriver,
    fetchCompletedDeliveriesByDriver,
    fetchInProgressDeliveriesByDriver,
    VerifyQRAndCompleteDelivery,
    startDelivery,
    FetchDriver
} = require("../controllers/driver");
const { isDriver } = require("../middleware/auth");
const { verifyDriver, verifyVehicle } = require("../controllers/driver");
const { auth } = require("../middleware/auth");

const endpoints = {
    ACCEPT_REJECT_DELIVERY: "/delivery/:deliveryId/respond",
    TRACK_DELIVERY_POINTS: "/driver/:driverId/delivery/:deliveryId/track",
    CONFIRM_ARRIVAL_CHECKPOINT:
        "/driver/:driverId/delivery/:deliveryId/checkpoint/:pointId/arrive",
    SCAN_QR: "/driver/:drziverId/delivery/:deliveryId/checkpoint/:pointId/scan",
    VERIFY_DRIVER_TRUCK: "/driver/verify-truck",
};

router.post(endpoints.ACCEPT_REJECT_DELIVERY, isDriver, ChooseDelivery);

router.post("/verify/sarthi", auth, verifyDriver);
router.post("/verify/vahan", auth, verifyVehicle);
router.post("/complete/delivery", auth, VerifyQRAndCompleteDelivery);
router.get('/',auth,FetchDriver);


/**
 * 
 * url : api/v1/driver/delivery/start
 * 
 * input : {
        "deliveryId": "67502bce65f4a226cbd3d332"
    }
 * 
 */
router.post("/delivery/start", auth, startDelivery);

router.get(
    "/manufacturingUnit/:manufacturingUnitId/availableDrivers",
    getAvailableDriversDetailsByManufacturingUnit
);

router.post('/assign-driver', assignDriverToDelivery);

router.get("/delivery", auth, fetchPendingDeliveriesByDriver);

router.get("/delivery/completed", auth, fetchCompletedDeliveriesByDriver);

router.get("/delivery/inprogress", auth, fetchInProgressDeliveriesByDriver);



module.exports = router;
