const mongoose = require("mongoose");

const RouteTrackingSchema = new mongoose.Schema({
    deliveryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true, // Ensure one document per delivery
    },
    driver: {
        driverId: { type: String, unique: true },
        to: { type: String },
        from: { type: String },
        status: { type: String },
    },
    train: {
        fnrNumber: { type: String, unique: true },
        to: { type: String },
        from: { type: String },
        status: { type: String },
    },
    air: {
        awbNumber: { type: String, unique: true },
        to: { type: String },
        from: { type: String },
        status: { type: String },
    },
    ship: {
        interfaceName: { type: String, unique: true },
        igmNumber: { type: String, unique: true },
        to: { type: String },
        from: { type: String },
        status: { type: String },
    },
    linkedDelivery: {
        type: String, // Add more details based on your use case
    },
});

module.exports = mongoose.model("RouteTracking", RouteTrackingSchema);
