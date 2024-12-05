
const Delivery = require('../models/Delivery');
const { msgFunction } = require('../utils/msgFunction');
const { CONFIG } = require('../constants/config')
const mongoose = require('mongoose');


// only for the manager or store manager
exports.Get_products = async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.query;

        let query = {};

        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json(msgFunction(false, "Invalid product ID"));
            }
            query._id = id;
        }

        if (category) {
            query.category = category;
        }

        const products = id
            ? await Product.findOne(query) // Find a specific product by ID
            : await Product.find(query);

        if (!products || (Array.isArray(products) && products.length === 0)) {
            return res.status(404).json(msgFunction(false, "No products found"));
        }

        return res.status(200).json({
            status: true,
            data: products
        })

    } catch {
        console.error("Error in FetchProducts:", error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while fetching the Products.", error.message)
        );
    }
}


// only for the store manager
exports.Create_products = async (req, res) => {
    try {
        const { id: userId, account_type: accountType } = req.user;
        const { id: storeId } = req.store;
        const { delivery_id: deliveryId } = req.params;


        if (!userId) {
            return res.status(401).json(msgFunction(false, "You are not authenticated!"));
        }

        if (deliveryId && !mongoose.Types.ObjectId.isValid(deliveryId)) {
            return res.status(400).json(
                msgFunction(false, "Incorrect delivery ID. Please provide a valid ID.")
            );
        }

        let query = {};


        if (accountType === CONFIG.ACCOUNT_TYPE.DRIVER) {
            query.assignedDriver = userId;
        }
        else if (accountType === CONFIG.ACCOUNT_TYPE.DISTRIBUTION_CENTER || accountType === CONFIG.ACCOUNT_TYPE.STORE) {
            if (!storeId) {
                return res.status(400).json(
                    msgFunction(false, "Your Store is Not Found! Please log in again.")
                );
            }

            query = accountType === CONFIG.ACCOUNT_TYPE.DISTRIBUTION_CENTER
                ? { DistributionCenterId: storeId }
                : { storeId: storeId };
        }
        else {
            return res.status(403).json(
                msgFunction(false, "You are not permitted to fetch deliveries!")
            );
        }

        if (deliveryId) {
            query._id = deliveryId;
        }

        const deliveries = await Delivery.find(query);

        if (!deliveries || deliveries.length === 0) {
            return res.status(404).json(
                msgFunction(false, "No Delivery Items are found!")
            );
        }

        return res.json({
            success: true,
            data: deliveries
        });

    } catch (error) {
        console.error("Error in FetchDelivery:", error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while fetching the delivery.", error.message)
        );
    }
};

