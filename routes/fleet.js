const express = require("express");
const router = express.Router();
const {
  addFleetInYard,
  getFleetDeparted,
  registerIncomingFleet,
  availableFleetInYard,
  markTruckAsDeparted,
} = require("../controllers/fleet");

const { auth } = require('../middleware/auth')

/**
 *
 * Purpose : Route to add Fleet in the yard
 *
 * url : api/v1/fleet/add
 *
 *
 */
router.post("/add", addFleetInYard);

/**
 *
 * Purpose : Route to get available Fleet  In yard
 *
 * url : api/v1/fleet/available
 *
 *
 */
router.post("/available", availableFleetInYard);

/** 
 * 
 * purpose : Check in that trucks which are going out side from the yard
 * 
 * @method : GET
 * 
 *
 * url : api/v1/fleet/departed 
 * 
 * use : used in the Overview Fleet in the client side
 * 
*/
router.get("/departed",auth, getFleetDeparted);


router.post("/trucks/departed/:fleetId", markTruckAsDeparted);


module.exports = router;

