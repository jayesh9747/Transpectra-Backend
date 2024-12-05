const mongoose = require("mongoose");
const generateUniqueId = require("generate-unique-id");


const OrderSchema = new mongoose.Schema(
  {
    uniqueOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    selectedProducts: [
      {
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        specifications: { type: String, required: true },
        productId : {type : mongoose.Schema.Types.ObjectId,  required : true , ref : "Product"}
      },
    ],
    manufacturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManufacturingUnit",
      required: true,
    },
    manufacturerName: {
      type: String,
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    estimatedDeliveryDate: {
      type: Date,
      required: true,
    },
    actualDeliveryDate: {
      type: Date,
      default: null, // This will be set later
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "fulfilled"],
      default: "pending",
    },
    deliveries: {
      type: [String], // Array to store delivery information
      default: [],
    },
    qrCodeImageUrl: {
      type: String, // URL to the uploaded QR code image
      default: null,
    },
    orderCreatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
