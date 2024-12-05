const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    storageCapacity: {
        type: Number,
        required: true
    },
    salesQuantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    supplier: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['In Stock', 'Out of Stock', 'Discontinued', 'Overstocked'],
        default: 'In Stock'
    },
    dailySales: [{
        date: { type: Date, required: true },
        quantitySold: { type: Number, required: true }
    }],
    monthlySales: [{
        month: { type: String, required: true },
        year: { type: Number, required: true },
        quantitySold: { type: Number, required: true },
        profit: { type: Number, required: true }
    }],
    avgMonthlyProfit: {
        type: Number,
        required: false,
        default: 0
    }
}, {
    timestamps: true
});

inventorySchema.methods.calculateAvgMonthlyProfit = function() {
    if (this.monthlySales.length === 0) return 0;
    const totalProfit = this.monthlySales.reduce((acc, sale) => acc + sale.profit, 0);
    return totalProfit / this.monthlySales.length;
};

inventorySchema.methods.updateStatus = function() {
    if (this.quantity <= 0) {
        this.status = 'Out of Stock';
    } else if (this.quantity > this.storageCapacity) {
        this.status = 'Overstocked';
    } else {
        this.status = 'In Stock';
    }
};

inventorySchema.pre('save', function(next) {
    this.updateStatus();
    next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
