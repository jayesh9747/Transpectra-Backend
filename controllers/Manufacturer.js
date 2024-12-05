const ManufacturingUnit = require("../models/ManufacturingUnit"); 
const User = require("../models/User"); // Import User model

// Controller to fetch manufacturer details with linked manufacturing address
const getAllManufacturers = async (req, res) => {
  try {
    // Populate manufacturerId (user details) and fetch manufacturing company data
    const manufacturers = await ManufacturingUnit.find()
      .populate({
        path: "manufacturerId", // Populating the manufacturer (user) details
        select: "firstName lastName email accountType", // Include specific fields from the User schema
      })
      .select("companyName companyAddress companyArea companyDescription companyImage");
    
    if (!manufacturers || manufacturers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No manufacturers found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Manufacturers fetched successfully.",
      manufacturers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching manufacturers.",
      error: error.message,
    });
  }
};

module.exports = { getAllManufacturers };
