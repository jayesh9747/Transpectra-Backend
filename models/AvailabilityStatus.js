const mongoose = require('mongoose');

const availabilityStatusSchema = new mongoose.Schema({
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    status: {
        type: String,
        enum: ['assigned', 'onDelivery', 'available'],
        default: "available"
    },
    ManufacturingUnitID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "manufacturingUnit"
    }
});

const availabilityStatus = mongoose.model('availability_status', availabilityStatusSchema);

module.exports = availabilityStatus;
