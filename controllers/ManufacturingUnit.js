const ManufacturingUnit = require("../models/ManufacturingUnit");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const User = require("../models/User");
const { msgFunction } = require("../utils/msgFunction");

exports.addManufacturingUnit = async (req, res) => {
  try {
    console.log("Received request to add a manufacturing company");
    
    // Destructure fields from request body
    const { companyName, companyAddress, companyArea, companyDescription, manufacturerId } = req.body;

    // Log the incoming request
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    // **1. Upload the company image to Cloudinary**
    if (!req.files || !req.files.companyImage) {
      throw new Error("Company image is required");
    }
    const companyImage = await uploadImageToCloudinary(
      req.files.companyImage[0], // Access the first file in companyImage array
      "company_images"
    );

    // **2. Save manufacturing company details in the database**
    const manufacturingUnit = await ManufacturingUnit.create({
      companyName,
      companyAddress,
      companyArea,
      companyDescription,
      companyImage: companyImage.secure_url, // Save only the secure URL of the uploaded image
      manufacturerId,
    });

    // **3. Link the manufacturing company to the manufacturer (User)**
    const manufacturer = await User.findById(manufacturerId);
    console.log(manufacturer)
    if (!manufacturer) {
      throw new Error("Manufacturer (User) not found");
    }

    manufacturer.LinkedManufacturingUnitID = manufacturingUnit._id; // Assign the created manufacturing company ID
    await manufacturer.save();

    console.log("Manufacturing company added and linked to manufacturer");

    // **4. Respond with success**
    return res.status(201).json({
      success: true,
      message: "Manufacturing company added successfully and linked to manufacturer.",
      manufacturingUnit: manufacturingUnit,
    });

  } catch (error) {
    // **Handle and log errors**
    console.error("Error while adding manufacturing company:", error);
    return res.status(500).json(
      msgFunction(false, "An error occurred while adding the manufacturing company.", error.message)
    );
  }
};


exports.getCompanyDetailsByManagerId = async (req, res) => {
  const { managerId } = req.params;
  console.log(managerId)
  try {
    //Step 1: Find the user by managerId
    const user = await User.findById(managerId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    console.log(user)
    // Step 2: Extract linkedManufacturingUnitID
    const companyId = user.LinkedManufacturingUnitID;
    if (!companyId) {
      return res.status(404).json({ error: "No linked Company found for this user" });
    }
    console.log("Company for Manufacturer:",companyId)
    // Step 3: Fetch company details and populate fields
    const company = await ManufacturingUnit.findById(companyId)

    if (!company) {
      return res.status(404).json({ error: "Company not found." });
    }

    // Step 4: Return the company details
    res.status(200).json({ company });
  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};