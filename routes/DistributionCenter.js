const express = require('express');
const router = express.Router();

// admin panel 

const {
    FetchDriver
} = require('../controllers/driver');

const {
    AssignDelivery,
    Deliveries
} = require('../controllers/distributionCenter');

const { isStoreManager, isDistributionCenter, isDistributionCenterManager } = require('../middleware/auth');
const { fetch_stores } = require('../controllers/store');

const endpoints = {
    FetchDriver: '/drivers',
    ASSIGN_DELIVERY: '/delivery/:deliveryId/assign',
    GET_DELIVERY_DETAILS: '/delivery/:deliveryId',  // sort : on going,completed
    FETCH_STORES : '/store/:storeId?'
};



router.post(endpoints.FetchDriver,isDistributionCenterManager, FetchDriver);

router.post(endpoints.ASSIGN_DELIVERY, AssignDelivery);

router.post(endpoints.GET_DELIVERY_DETAILS, Deliveries);

router.post(endpoints.FETCH_STORES,isDistributionCenterManager,fetch_stores)

module.exports = router;
