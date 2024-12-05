const mongoose = require("mongoose");

const YardSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "warehouse",
      required: true,
    },
    yardManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

const Yard = mongoose.model("yard", YardSchema);

module.exports = Yard;
