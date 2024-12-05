const { required } = require("joi");
const mongoose = require("mongoose");

const DistributionCenterSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String }
    },
    about: {
        type: String
    },
    storageCapacity: {
        type: Number,
    },
    operatingHours: {
        openingTime: { type: String },
        closingTime: { type: String }
    },
    contactInfo: {
        managerName: { type: String },
        managerId: { type: mongoose.Schema.Types.ObjectId },
        phone: { type: String },
        email: { type: String }
    },
    managedProducts: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        stock: { type: Number }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    storeIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store'
        }
    ]
});


module.exports = mongoose.model("DistributionCenter", DistributionCenterSchema)