const express = require("express")
const router = express.Router();
const {auth} = require('../middleware/auth')
const {fetchInventory} = require('../controllers/inventory')



/**
 * purpose : find the inventory of particular ware house
 * 
 * 
 * api/v1/inventory/
 */

router.get('/',auth,fetchInventory);



module.exports = router;

