const available_driver = require('../models/AvailabilityStatus')
const { msgFunction } = require('../utils/msgFunction')
const distribution_center = require('../models/DistributionCenter');
const delivery = require('../models/Delivery');
const Delivery = require('../models/Delivery');
const availability_status = require('../models/AvailabilityStatus');
const RouteTracking = require('../models/routeTracking'); // Adjust path as needed
const mongoose = require('mongoose');
const axios = require('axios');
const { verifyVehiclewithVahan } = require('../UlipAPI/vahan');
const { verifyDriverwithSarthi } = require('../UlipAPI/sarathi');
const User = require('../models/User');
const ManufacturingUnit = require("../models/ManufacturingUnit");
const Product = require('../models/Products');
const AvailabilityStatus = require('../models/AvailabilityStatus');
const Warehouse = require("../models/Warehouse");
const Order = require("../models/Order");

const { CONFIG } = require('../constants/config');

// check karna bacha hai 
exports.FetchDriver = async (req, res) => {
    try {
        const { id : driverId } = req.user;

        // Validate that driverId is provided
        if (!driverId || !mongoose.Types.ObjectId.isValid(driverId)) {
            return res.status(400).json({
                success: false,
                message: "Valid Driver ID is required",
            });
        }

        // Fetch the driver details and populate necessary fields
        const driver = await User.findById(driverId)
            .populate("additionalDetails", "-__v") 
            .populate("LinkedManufacturingUnitID", "name address")

        // If the driver is not found
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        // Return the driver's details
        return res.status(200).json({
            success: true,
            data: driver,
        });
    } catch (error) {
        console.error("Error fetching driver details:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



//  check karna  bachha hai 
exports.ChooseDelivery = async (req, res) => {
    try {
        const { id: driverId, account_type: accountType } = req.user;
        const { deliveryId } = req.params;
        const { isAccepted } = req.body;

        if (!driverId) {
            return res.json(msgFunction(false, "You are not authenticated!"));
        }

        if (accountType !== CONFIG.ACCOUNT_TYPE.DRIVER) {
            return res.json(msgFunction(false, "You are not permitted!"));
        }

        if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
            return res.status(400).json(
                msgFunction(false, "Incorrect delivery ID. Please provide a valid ID.")
            );
        }

        if (isAccepted == 'false') {
            return res.json(
                msgFunction(true, "Successfully, you did not accept the delivery ride.")
            );
        }

        const deliveryUpdateResult = await delivery.findByIdAndUpdate(
            deliveryId,
            { status: "In Progress", assignedDriver: driverId },
            { new: true }
        );

        if (!deliveryUpdateResult) {
            return res.json(
                msgFunction(false, "This delivery was not found.")
            );
        }

        const driverAvailability = await availability_status.findOne({
            driver_id: driverId
        });

        if (!driverAvailability) {
            return res.json(
                msgFunction(false, "Driver availability status not found.")
            );
        }

        if (driverAvailability.status === "available") {
            await availability_status.findOneAndUpdate(
                { driver_id: driverId },
                { status: "assigned" }
            );

            return res.json({
                success: true,
                data: deliveryUpdateResult,
                message: "You have been assigned the delivery."
            });
        } else {
            return res.json(
                msgFunction(false, "You have already been assigned a delivery. Please complete it before accepting another.")
            );
        }
    } catch (error) {
        console.error("Error in ChooseDelivery:", error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while choosing the delivery.", error.message)
        );
    }
};


exports.verifyVehicle = async (req, res) => {
    try {
        const { id: driverId } = req.user;
        const { truckNumber, chassisNumber, ownerName, engineNumber } = req.body;

        // Validate input
        if (!truckNumber || !chassisNumber || !ownerName || !engineNumber) {
            return res.status(400).json(msgFunction(false, "Incomplete vehicle details provided."));
        }

        // Call the verification function
        const vahanResponse = await verifyVehiclewithVahan(truckNumber, ownerName, chassisNumber, engineNumber);

        if (!vahanResponse.success) {
            return res.status(500).json(
                msgFunction(false, "Vehicle verification failed with VAHAN API.", vahanResponse.message)
            );
        }

        if (!vahanResponse.verified) {
            return res.status(400).json(
                msgFunction(false, "Vehicle verification failed. Issues found with:", vahanResponse.failedFields)
            );
        }

        // Update the user's verifiedVahan status in the database
        const driver = await User.findOne({ _id: driverId, accountType: "Driver" });
        if (!driver) {
            return res.status(404).json(msgFunction(false, "Driver not found in the database."));
        }

        driver.verifiedVahan = true;
        await driver.save();

        return res.status(200).json({
            success: true,
            message: "Vehicle successfully verified.",
        });
    } catch (error) {
        console.error("Error during vehicle verification:", error);
        return res.status(500).json(
            msgFunction(false, "An error occurred during vehicle verification.", error.message)
        );
    }
};


exports.verifyDriver = async (req, res) => {
    try {
        const { id: driverId } = req.user;
        const { drivingLicense, dob, name } = req.body;

        // Validate input
        if (!drivingLicense || !dob || !name) {
            return res.status(400).json(
                msgFunction(false, "Driving license, date of birth, and name are required.")
            );
        }

        // Call Sarthi API to verify the driver
        const sarthiResponse = await verifyDriverwithSarthi(drivingLicense, dob, name);

        if (!sarthiResponse.success) {
            return res.status(400).json(
                msgFunction(false, "Driver verification failed with SARATHI API.", sarthiResponse.message)
            );
        }

        if (!sarthiResponse.verified) {
            return res.status(400).json(
                msgFunction(false, "Name mismatch during driver verification.", {
                    expected: name,
                    found: sarthiResponse.bioFullName,
                })
            );
        }

        // Update the user's verifiedDriver status in the database
        const driver = await User.findOne({ _id: driverId, accountType: "Driver" });
        if (!driver) {
            return res.status(404).json(msgFunction(false, "Driver not found in the database."));
        }

        driver.verifiedDriver = true;
        await driver.save();

        return res.status(200).json({
            success: true,
            message: "Driver successfully verified.",
        });
    } catch (error) {
        console.error("Error during driver verification:", error);
        return res.status(500).json(
            msgFunction(false, "An error occurred during driver verification.", error.message)
        );
    }
};


// uniqueOrderId
// deliveryId 
// warehouseId 
// driverId 
exports.VerifyQRAndCompleteDelivery = async (req, res) => {

    console.log(req.body);

    try {
        const { id: driverId } = req.user; // Extract driver ID from authenticated user
        const { uniqueOrderId, deliveryId, warehouseId } = req.body; // Extract input from the request body

        // Validate required inputs
        if (!driverId) {
            return res.status(401).json({
                success: false,
                message: "You are not authenticated!"
            });
        }

        console.log(driverId);

        if (!deliveryId || !uniqueOrderId || !warehouseId) {
            return res.status(400).json({
                success: false,
                message: "Delivery ID, Unique Order ID, and Warehouse ID are required!"
            });
        }

        // Find the delivery using the delivery ID and check assigned driver and status
        const deliveryDetails = await delivery.findOne({
            _id: deliveryId,
            // assignedDriver: { $in: [driverId] },
            status: "In Progress"
        });

        if (!deliveryDetails) {
            return res.status(404).json({
                success: false,
                message: "No matching delivery found or unauthorized driver!"
            });
        }

        // Process products in the delivery
        for (const deliveredProduct of deliveryDetails.products) {
            const { productId, quantity } = deliveredProduct;

            // Find the product in the Product model
            const product = await Product.findOne({
                _id: productId,
                warehouse: warehouseId
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${productId} not found in warehouse ${warehouseId}.`
                });
            }

            // Increment the product quantity in the Product model
            product.productQuantity += quantity; // Increment product quantity by delivered quantity
            await product.save();
        }

        // Update delivery details
        deliveryDetails.status = "Completed";
        deliveryDetails.actualDeliveryDate = new Date();
        await deliveryDetails.save();

        // Update driver's availability status
        const driverAvailability = await AvailabilityStatus.findOne({ driver_id: driverId });
        if (driverAvailability) {
            driverAvailability.status = "available"; // Set status to available
            await driverAvailability.save();
        }

        return res.status(200).json({
            success: true,
            message: "Delivery successfully completed, product quantities updated, and driver marked as available",
            data: deliveryDetails
        });
    } catch (error) {
        console.error("Error in VerifyQRAndCompleteDelivery:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while completing the delivery",
            error: error.message
        });
    }
};


// driverId
// deliveryId

exports.startDelivery = async (req, res) => {
    try {
        const { id: driverId } = req.user;
        const { deliveryId } = req.body;

        if (!driverId) {
            return res.status(401).json({
                success: false,
                message: "You are not authenticated!"
            });
        }

        if (!deliveryId) {
            return res.status(400).json({
                success: false,
                message: "Delivery ID is required!"
            });
        }

        // Find the delivery using the delivery ID
        const deliveryDetails = await delivery.findOne({
            _id: deliveryId,
        });

        if (!deliveryDetails) {
            return res.status(404).json({
                success: false,
                message: "No delivery found with the provided ID!"
            });
        }

        // Check if the status is already "In Progress"
        if (deliveryDetails.status === "In Progress") {
            return res.status(400).json({
                success: false,
                message: "This delivery is already in progress!"
            });
        }

        // Check if the status is not "Pending"
        if (deliveryDetails.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot start delivery. Current status is: ${deliveryDetails.status}`
            });
        }

        // Update the delivery status to "In Progress" and assign the driver
        deliveryDetails.status = "In Progress";
        if (!deliveryDetails.assignedDriver.includes(driverId)) {
            deliveryDetails.assignedDriver.push(driverId); // Add driver if not already assigned
        }
        await deliveryDetails.save();

        return res.status(200).json({
            success: true,
            message: "Delivery successfully started!",
            data: deliveryDetails
        });
    } catch (error) {
        console.error("Error in startDelivery:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while starting the delivery",
            error: error.message
        });
    }
};


/*
 * @url : api/v1/delivery/manufacturingUnit/:manufacturingUnitId/availableDrivers
 *
 * purpose : fetch all the available drivers 
 */
exports.getAvailableDriversDetailsByManufacturingUnit = async (req, res) => {
    try {
        const { manufacturingUnitId } = req.params;

        // Fetch the manufacturing unit to get linked driver IDs
        const manufacturingUnit = await ManufacturingUnit.findById(manufacturingUnitId);

        if (!manufacturingUnit) {
            return res.status(404).json({
                success: false,
                message: "Manufacturing unit not found.",
            });
        }

        const linkedDriverIds = manufacturingUnit.linkedDrivers; // Array of driver IDs

        if (!linkedDriverIds || linkedDriverIds.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No drivers linked to this manufacturing unit.",
            });
        }

        // Find available drivers in the AvailabilityStatus schema
        const availableDrivers = await AvailabilityStatus.find({
            driver_id: { $in: linkedDriverIds },
            status: "available", // Filter only available drivers
        });

        const availableDriverIds = availableDrivers.map((driver) => driver.driver_id);

        if (!availableDriverIds || availableDriverIds.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No available drivers found for this manufacturing unit.",
            });
        }

        // Fetch details of available drivers from the User schema
        const driverDetails = await User.find({
            _id: { $in: availableDriverIds },
            accountType: "Driver", // Ensure only drivers are fetched
        });

        if (!driverDetails || driverDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No driver details found for the available drivers.",
            });
        }

        // Return driver details
        res.status(200).json({
            success: true,
            message: "Available driver details fetched successfully.",
            data: driverDetails,
        });
    } catch (error) {
        console.error("Error fetching available drivers:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};
/*
 * @url : api/v1/delivery/assign-driver
 *
 * purpose : assign the deliver to the driver
 * 
 */
exports.assignDriverToDelivery = async (req, res) => {
    try {

        const { deliveryId, driverId } = req.body;

        // Validate request body
        if (!deliveryId || !driverId) {
            return res.status(400).json({
                success: false,
                message: "Delivery ID and Driver ID are required.",
            });
        }

        // Fetch the delivery by ID
        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found.",
            });
        }

        // Check if driver is already assigned
        if (delivery.assignedDriver.includes(driverId)) {
            return res.status(400).json({
                success: false,
                message: "Driver is already assigned to this delivery.",
            });
        }

        // Append driver ID to the assignedDriver array
        delivery.assignedDriver.push(driverId);
        await delivery.save();

        // Update driver status in the AvailabilityStatus schema
        const driverStatus = await AvailabilityStatus.findOne({ driver_id: driverId });
        if (!driverStatus) {
            return res.status(404).json({
                success: false,
                message: "Driver not found in availability status.",
            });
        }

        driverStatus.status = "assigned";
        await driverStatus.save();

        return res.status(200).json({
            success: true,
            message: "Driver assigned to delivery successfully.",
        });
    } catch (error) {
        console.error("Error assigning driver:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
/*
 * @url : api/v1/delivery/deliveries/pending-by-driver
 *
 * purpose : fetch all the pending deliveries on the driver side
 * 
 */
exports.fetchPendingDeliveriesByDriver = async (req, res) => {
    try {
        const { id: driverId } = req.user;

        // Validate driverId
        if (!driverId) {
            return res.status(400).json({
                success: false,
                message: "Driver ID is required.",
            });
        }

        // Fetch deliveries
        const deliveries = await Delivery.find({
            assignedDriver: driverId,
            status: "Pending",
        }).populate("orderId warehouseId ManufactureId assignedDriver");

        // Check if deliveries exist
        if (!deliveries || deliveries.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No pending deliveries found for the given driver ID.",
                data: []
            });
        }

        // Respond with the delivery details
        return res.status(200).json({
            success: true,
            message: "Pending deliveries fetched successfully.",
            data: deliveries,
        });
    } catch (error) {
        console.error("Error fetching pending deliveries:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};


/*
 * @url : api/v1/delivery/deliveries/completed-by-driver
 *
 * purpose : fetch all the completed deliveries(past deliveries) on the driver side
 * 
 */
exports.fetchCompletedDeliveriesByDriver = async (req, res) => {
    try {
        const { id: driverId } = req.user;

        // Validate driverId
        if (!driverId) {
            return res.status(400).json({
                success: false,
                message: "Driver ID is required.",
            });
        }

        // Fetch deliveries without populating related fields
        const deliveries = await Delivery.find({
            assignedDriver: driverId,
            status: "Completed",
        });

        // Check if deliveries exist
        if (!deliveries || deliveries.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No completed deliveries found for the given driver ID.",
                data: []
            });
        }

        // Respond with the delivery details
        return res.status(200).json({
            success: true,
            message: "Completed deliveries fetched successfully.",
            data: deliveries,
        });
    } catch (error) {
        console.error("Error fetching completed deliveries:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};
/*
 * @url : api/v1/delivery/deliveries/InProgress-by-driver
 *
 * purpose : fetch all the InProgress on the driver side
 * 
 */
exports.fetchInProgressDeliveriesByDriver = async (req, res) => {
    try {
        const { id: driverId } = req.user;

        // Validate driverId
        if (!driverId) {
            return res.status(400).json({
                success: false,
                message: "Driver ID is required.",
            });
        }

        // Fetch deliveries without populating related fields
        const deliveries = await Delivery.find({
            assignedDriver: driverId,
            status: "In Progress",
        });

        // Check if deliveries exist
        if (!deliveries || deliveries.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No InProgress deliveries found for the given driver ID.",
                data: []
            });
        }

        // Respond with the delivery details
        return res.status(200).json({
            success: true,
            message: "In Progress deliveries fetched successfully.",
            data: deliveries,
        });
    } catch (error) {
        console.error("Error fetching InProgress deliveries:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};