const mongoose = require("mongoose");
const generateUniqueId = require("generate-unique-id");

const ManufacturingUnitSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    companyAddress: { type: String, required: true },
    companyArea: { type: String, required: true },
    companyDescription: { type: String },
    companyImage: { type: String, required: true },
    manufacturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    linkedWarehouses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "warehouse",
      },
    ],
    linkedOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    linkedDrivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver", 
      },
    ],
    uniqueUnitCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to generate a 6-digit unique code
ManufacturingUnitSchema.pre("save", async function (next) {
  if (!this.uniqueUnitCode) {
    this.uniqueUnitCode = generateUniqueId({
      length: 6,
    });
  }
  next();
});

const ManufacturingUnit = mongoose.model("manufacturingUnit", ManufacturingUnitSchema);

module.exports = ManufacturingUnit;