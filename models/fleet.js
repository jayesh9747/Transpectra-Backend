const mongoose = require("mongoose");

const FleetSchema = new mongoose.Schema(
  {
    driverName: {
      type: String,
      required: true,
    },
    vehicleLicensePlate: {
      type: String,
      required: true,
    },
    dateOfArrival: {
      type: Date,
      required: true,
    },
    timeOfArrival: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["loading", "unloading"],
      required: true,
    },
    allocatedDock: {
      type: String,
      required: true,
    },
    orderId: {
      type: String, // Optional field
    },
    yardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Yard",
      required: true,
    },
    yardManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    arrived: { type: Boolean, default: false },
    departed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const fleet = mongoose.model("fleet", FleetSchema);
module.exports = fleet;
