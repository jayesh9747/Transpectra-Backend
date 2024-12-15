const RouteTracking = require("../models/routeTracking");
const Delivery = require("../models/Delivery");
const { getCoordinates, getRoute } = require('../GeolocationAPI/comman')

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


exports.realTimeTrackingOfDelivery = async (req, res) => {
    try {
        const { deliveryId } = req.body;

        const deliveryObj = await Delivery.findOne({ uniqueDeliveryId: deliveryId });

        if (!deliveryObj) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        const deliveryRoutes = deliveryObj.deliveryRoutes.map(route => ({
            step: route?.step,
            from: route?.from,
            to: route?.to,
            transportMode: route?.by,
            distance: route?.distance,
            expectedTime: route?.expectedTime,
            cost: route?.cost,
            remarks: `${route?.from} to ${route?.to} going via ${route?.by}.`,
            status: route?.status
        }));

        const ongoingRoute = deliveryRoutes.find(route => route.status === "in-progress");

        let routeDetails = {
            success: false,
            data: null,
            message: ""
        };

        if (ongoingRoute) {
            switch (ongoingRoute?.transportMode) {
                case "road":
                    const fromCoordinatesResponse = await getCoordinates(ongoingRoute.from);
                    const toCoordinatesResponse = await getCoordinates(ongoingRoute.to);

                    if (fromCoordinatesResponse.success && toCoordinatesResponse.success) {
                        routeDetails = await getRoute(fromCoordinatesResponse.data, toCoordinatesResponse.data);
                        
                    } else {
                        routeDetails['success'] = false;
                        routeDetails["message"] = "Unable to fetch coordinates for the ongoing road route."
                    }
                    break;

                case "rail":
                case "air":
                case "sea":
                default:
                    routeDetails['success'] = false;
                    routeDetails["message"] = "Invalid transport mode or transport mode not supported."
            }
        } else {
            routeDetails.success = false;
            routeDetails.message = "No ongoing route provided.";
        }

        return res.status(200).json({
            deliveryId: deliveryObj.uniqueDeliveryId,
            currentLocation: deliveryObj.currentLocation,
            status: deliveryObj.status,
            routes: deliveryRoutes,
            ongoingStep: ongoingRoute || null,
            routeDetails
        });
    } catch (error) {
        console.error("Error tracking delivery:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

