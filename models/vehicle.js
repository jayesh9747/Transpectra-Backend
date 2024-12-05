const mongoose = require("mongoose");

const vehicleDetailsSchema = new mongoose.Schema({
    make: {
        type: String,
        trim: true,
    },
    model: {
        type: String,
        trim: true,
    },
    capacity: {
        type: Number,
    },
    licenseNumber: {
        type: String,
        trim: true,
    },
    ownerId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true,
    },
});

module.exports = mongoose.model("VehicleDetails", vehicleDetailsSchema);
