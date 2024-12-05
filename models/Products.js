// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  productQuantity: {
    type: Number,
    required: true
  },
  productCategory: {
    type: String,
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  month: {
    type: String,
    required: true
  },
  productExpiry: {
    type: Date,
    required: true
  },
  productThreshold: {
    type: Number,
    required: true
  },
  backorderRate: {
    type: Number
  },
  productType: {
    type: String
  },
  supplierReliability: {
    type: Number
  },
  productCost: {
    type: Number,
    required: true
  },
  productDiscount: {
    type: Number
  },
  seasonality: {
    type: String
  },
  marketChanges: {
    type: String
  },
  profitGained: {
    type: Number
  },
  bulkOrderRequest: {
    type: String
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
