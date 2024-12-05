const RouteTracking = require("../models/routeTracking");
const Delivery = require("../models/Delivery");

exports.updateRouteTracking = async (req, res) => {
    const { deliveryId, driverId, fnrNumber, awbNumber, interfaceName, igmNumber, to, from, status } = req.body;

    if (!deliveryId) {
        return res.status(400).json({
            success: false,
            message: "DeliveryId is required.",
        });
    }

    try {
        // Find the record or create a new one
        let routeTracking = await RouteTracking.findOne({ deliveryId });

        if (!routeTracking) {
            routeTracking = new RouteTracking({ deliveryId });
        }

        // Check for existing fields and update incrementally
        if (driverId) {
            if (routeTracking.driver?.driverId) {
                return res.status(400).json({
                    success: false,
                    message: "Driver details already set and cannot be updated.",
                });
            }
            routeTracking.driver = { driverId, to, from, status };
        }

        if (fnrNumber) {
            if (routeTracking.train?.fnrNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Train tracking details already set and cannot be updated.",
                });
            }
            routeTracking.train = { fnrNumber, to, from, status };
        }

        if (awbNumber) {
            if (routeTracking.air?.awbNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Airway tracking details already set and cannot be updated.",
                });
            }
            routeTracking.air = { awbNumber, to, from, status };
        }

        if (interfaceName && igmNumber) {
            if (routeTracking.ship?.interfaceName || routeTracking.ship?.igmNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Ship tracking details already set and cannot be updated.",
                });
            }
            routeTracking.ship = { interfaceName, igmNumber, to, from, status };
        }

        // Save the updated RouteTracking document
        const savedRouteTracking = await routeTracking.save();

        // Update the Delivery document's routeTrackingId
        await Delivery.updateOne(
            { _id: deliveryId },
            { $set: { routeTrackingid: savedRouteTracking._id } }
        );

        return res.status(200).json({
            success: true,
            message: "Route tracking updated successfully.",
            data: routeTracking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating route tracking.",
        });
    }
};
