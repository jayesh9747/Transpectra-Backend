const mongoose = require('mongoose');
const { Schema } = mongoose;

const StoreSchema = new Schema({
    name: { type: String },
    location: { type: String },
    squareFeet: { type: Number },
    managerName: { type: String, required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    openingDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    type: {
        type: String,
        enum: ['Store', 'FC'],
        default: 'Store'
    },
    areaPopulation: { type: Number },
    dailyVisitors: [{
        date: { type: Date },
        count: { type: Number }
    }]
});

const Store = mongoose.model('Store', StoreSchema);

module.exports = Store;
