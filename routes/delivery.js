const express = require("express")
const router = express.Router();
const Joi = require('joi');
const validateWith = require('../middleware/validation')

const { FetchDelivery, CreateDelivery, getWarehouseDetails, generateRoutesForDelivery , getManufacturingUnitOrdersWithDeliveries} = require('../controllers/delivery')



const endpoints = {
    AVAILABLE_DELIVERIES: '/deliveries/available',
    GET_DELIVERIES: '/:delivery_id?',
    CREATE_DELIVERIES: '/create',
    GET_OPTIMIZED_ROUTE: '/route/generate'
}


/**
 * @url : api/v1/delivery/create
 * 
 * purpose : create delivery for perticular order 
 */

router.post(endpoints.CREATE_DELIVERIES, CreateDelivery)


router.post(endpoints.GET_DELIVERIES, FetchDelivery)


router.get("/warehouse/:warehouseId/details", getWarehouseDetails);

router.get("/manufacturing-unit/:manufacturingUnitId/orders-with-deliveries", getManufacturingUnitOrdersWithDeliveries);


/***
 * 
 * @url : api/v1/delivery/route/generate
 * 
 * purpose :  Generate the Delivery Route 
 * 
 */

router.get(endpoints.GET_OPTIMIZED_ROUTE, generateRoutesForDelivery)


module.exports = router