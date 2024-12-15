const mongoose = require('mongoose');
const generateUniqueId = require('generate-unique-id');

const DeliverySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Order"
    },
    uniqueOrderId: {
        type: String,
        sparse: true,
    },
    uniqueDeliveryId: {
        type: String,
        sparse: true,
    },
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "warehouse"
    },
    ManufactureId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "manufacturingUnit"
    },
    pickupLocation: {
        address: { type: String, required: true, trim: true },
        contactPerson: { type: String },
        contactNumber: { type: String }
    },
    dropoffLocation: {
        address: { type: String, required: true, trim: true },
        contactPerson: { type: String },
        contactNumber: { type: String }
    },
    products: [
        {
            productName: { type: String, required: true },
            quantity: { type: Number, required: true },
            specifications: { type: String, required: true },
            unitCost: { type: Number, required: true },
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }
        }
    ],
    packageDetails: {
        weight: { type: String, required: true },
        dimensions: { type: String, required: true },
        fragile: { type: Boolean, default: false },
        description: { type: String }
    },
    deliveryRoutes: [
        {
            step: { type: Number, required: true }, // Step number in the route
            from: { type: String, required: true, trim: true }, // Starting point
            to: { type: String, required: true, trim: true }, // Destination point
            by: { type: String, required: true, enum: ['rail', 'road', 'air', 'sea'] }, // Mode of transport
            distance: { type: Number, required: true }, // Distance in kilometers
            expectedTime: { type: String, required: true }, // Expected time in hours
            cost: { type: Number, required: true },
            remarks: { type: String },
            status : {
                type : String,
                enum : ['pending', 'in-progress', 'completed', 'delayed'],
                default : "pending",
                required: true
            }
        }
    ],
    overallTripCost: { type: Number, default: 0 }, // Total cost of the trip
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    assignedDriver: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: [],
        }
    ],
    routeTrackingid:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'routeTracking',
        default: null,
    },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryDate: { type: Date },
    invoicePdf: { type: String }, // Stores the Cloudinary URL of the uploaded PDF
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook for generating a unique delivery ID and calculating overall trip cost
DeliverySchema.pre('save', async function (next) {
    // Generate unique delivery ID
    if (!this.uniqueDeliveryId) {
        this.uniqueDeliveryId = generateUniqueId({ length: 8 });
    }

    // Calculate overall trip cost
    if (this.deliveryRoutes && this.deliveryRoutes.length > 0) {
        this.overallTripCost = this.deliveryRoutes.reduce((total, route) => total + route.cost, 0);
    }

    next();
});

const Delivery = mongoose.model('Delivery', DeliverySchema);

module.exports = Delivery;
