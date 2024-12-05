const User = require("../models/User")
const { msgFunction } = require('../utils/msgFunction')
const _ = require('lodash');
const Product = require("../models/Products");
const xlsx = require('xlsx');
const Inventory = require('../models/Inventory'); // Your inventory model
const { uploadFileToCloudinary } = require("../utils/fileUploader");// Import your utility function
const { uploadImageToCloudinary } = require("../utils/imageUploader");// Import your utility function
const Warehouse = require('../models/Warehouse');
const ManufacturingCompany = require('../models/ManufacturingUnit');
const multer = require('multer');
const path = require('path');
const moment = require("moment");

exports.profile = async (req, res) => {
    try {
        const userId = req.user?.id || "";

        console.log("this is from the auth user", req.user);

        if (!userId) {
            return res.status(401).json(
                msgFunction(false, "You are not authenticated first Log In!")
            )
        }

        const UserProfile = await User.findById(userId).populate('additionalDetails');

        const userProfileObject = UserProfile.toObject();

        const updatedUserProfile = _.omit(userProfileObject, 'password');

        console.log("This is user profile", updatedUserProfile);


        return res.status(200).json({
            success: true,
            data: updatedUserProfile
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while fetching the user Profile", error.message)
        );
    }
}
/*
*
*
*
* Purpose: Delete User account
*
*
**/
exports.deleteAccount = async (req, res) => {
    try {
        const { userId } = req.body; // Get userId directly from the request body
        console.log(userId);
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: "User ID is required to delete the account." 
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Delete user account
        await user.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully.",
        });
    } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the account.",
            error: error.message,
        });
    }
};

  /*
*
*
*
* Purpose: Update profile image
*
*
**/
// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory for temporary file storage
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const isValidType = allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
                      allowedTypes.test(file.mimetype);
  if (isValidType) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, and PNG files are allowed.'));
  }
};

// Configure multer middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Controller function
exports.updateProfilePicture = async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error handling file upload.',
      });
    }

    try {
      const { userId } = req.body; // Extract userId from form data
      const file = req.file; // Extract the uploaded file
      console.log("Request file:", req.file); 
      console.log("Request body:", req.body);
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded.',
        });
      }

      // Find the user by ID
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      let updatedEntity;

      if (user.accountType === 'Warehouse_Manager') {
        // Update the warehouse image for the linked warehouse
        const warehouseId = user.LinkedWarehouseID;

        if (!warehouseId) {
          return res.status(400).json({
            success: false,
            message: 'No warehouse linked to this user.',
          });
        }

        // Upload the image to Cloudinary
        const result = await uploadImageToCloudinary(file, 'warehouse_images', 300, 80);

        // Update the warehouse record
        updatedEntity = await Warehouse.findOneAndUpdate(
          { _id: warehouseId },
          { $set: { warehouseImage: result.secure_url } },
          { new: true } // Return the updated document
        );

        if (!updatedEntity) {
          return res.status(404).json({
            success: false,
            message: 'Linked warehouse not found.',
          });
        }
      } else if (user.accountType === 'Supplier') {
        // Update the company image for the linked manufacturing company
        const manufacturingUnitId = user.LinkedManufacturingUnitID;

        if (!manufacturingUnitId) {
          return res.status(400).json({
            success: false,
            message: 'No manufacturing unit linked to this user.',
          });
        }

        // Upload the image to Cloudinary
        const result = await uploadImageToCloudinary(file, 'company_images', 300, 80);

        // Update the manufacturing company record
        updatedEntity = await ManufacturingCompany.findOneAndUpdate(
          { _id: manufacturingUnitId },
          { $set: { companyImage: result.secure_url } },
          { new: true } // Return the updated document
        );

        if (!updatedEntity) {
          return res.status(404).json({
            success: false,
            message: 'Linked manufacturing unit not found.',
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'User is not authorized to update an image.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Image updated successfully.',
        data: updatedEntity,
      });
    } catch (error) {
      console.error('Error updating image:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating the image.',
        error: error.message,
      });
    }
  });
};

/*
*
*
*
* Purpose: Update inventory excel file
*
*
**/
exports.updateInventorySheet = async (req, res) => {
  try {
    const { userId } = req.body; // Extract user ID from the request body
    const file = req.file; // Uploaded Excel file via `multer`

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    // Step 1: Validate user and role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.accountType !== "Warehouse_Manager") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only warehouse managers can update the inventory sheet.",
      });
    }

    // Step 2: Find the warehouse linked to the manager
    const warehouse = await Warehouse.findOne({ managerId: userId });
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "No warehouse found for this manager.",
      });
    }

    // Step 3: Delete existing products linked to the warehouse
    await Product.deleteMany({ warehouse: warehouse._id });

    // Step 4: Upload the Excel file to Cloudinary
    const uploadResult = await uploadFileToCloudinary(file, "inventory_sheets");

    // Step 5: Parse the new Excel file
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Step 6: Validate and map the Excel data
    const products = data.map((item, index) => {
      if (!item["Product Name"] || !item["Product Quantity"] || !item["Product Cost"] || !item["Product Category"]) {
        throw new Error(`Missing required fields in row ${index + 2}.`);
      }

      return {
        productName: item["Product Name"]?.trim(),
        productQuantity: Number(item["Product Quantity"]),
        productCategory: item["Product Category"]?.trim(),
        supplierName: item["Supplier Name"]?.trim(),
        month: item["Month"]?.trim(),
        productExpiry: item["Product Expiry"] ? parseExcelDate(item["Product Expiry"]) : null,
        productThreshold: Number(item["Product Threshold"]),
        backorderRate: Number(item["Backorder Rate"]),
        productType: item["Product Type"]?.trim(),
        supplierReliability: Number(item["Supplier Reliability"]),
        productCost: Number(item["Product Cost"]),
        productDiscount: Number(item["Product Discount"]),
        seasonality: item["Seasonality"]?.trim(),
        marketChanges: item["Market Changes"]?.trim(),
        profitGained: Number(item["Profit Gained"]),
        bulkOrderRequest: item["Bulk Order Request"]?.trim(),
        warehouse: warehouse._id, // Link the product to the warehouse
      };
    });

    // Step 7: Insert the new products into the database
    const createdProducts = await Product.insertMany(products);

    // Step 8: Link the new products to the warehouse
    warehouse.inventory = createdProducts.map((product) => product._id);
    await warehouse.save();

    // Step 9: Respond with success
    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully.",
      cloudinaryUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Error updating inventory sheet:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the inventory sheet.",
      error: error.message,
    });
  }
};

// Utility function to parse Excel dates
const parseExcelDate = (excelDate) => {
  if (typeof excelDate === "number") {
    return moment("1899-12-30").add(excelDate, "days").toDate();
  } else if (typeof excelDate === "string") {
    const formats = ["DD/MM/YYYY", "YYYY-MM-DD"];
    const parsedDate = moment(excelDate, formats, true);
    if (!parsedDate.isValid()) {
      throw new Error(`Invalid date format: "${excelDate}"`);
    }
    return parsedDate.toDate();
  }
  throw new Error(`Unsupported date format: ${excelDate}`);
};

  /*
*
*
*
* Purpose: Update details(for manufacturingUnit and warehouse)
*
*
**/
exports.updateDetails = async (req, res) => {
    try {
      const { userId, address, area } = req.body;
  
      if (!userId || !address || !area) {
        return res.status(400).json({
          success: false,
          message: "User ID, address, and area are required.",
        });
      }
  
      // Find the user based on the provided userId
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
  
      let updatedEntity;
      if (user.accountType === 'Warehouse_Manager') {
        // Fetch the linked warehouse ID
        const warehouseId = user.LinkedWarehouseID;
  
        if (!warehouseId) {
          return res.status(400).json({
            success: false,
            message: "No warehouse linked to this user.",
          });
        }
  
        // Find and update the warehouse details
        updatedEntity = await Warehouse.findOneAndUpdate(
          { _id: warehouseId }, // Ensure it matches the linked warehouse
          { $set: { warehouseAddress: address, warehouseArea: area } },
          { new: true } // Return the updated document
        );
  
        if (!updatedEntity) {
          return res.status(404).json({
            success: false,
            message: "Linked warehouse not found.",
          });
        }
  
      } else if (user.accountType === 'Supplier') {
        // Fetch the linked manufacturing unit ID
        const manufacturingUnitId = user.LinkedManufacturingUnitID;
  
        if (!manufacturingUnitId) {
          return res.status(400).json({
            success: false,
            message: "No manufacturing unit linked to this user.",
          });
        }
  
        // Find and update the manufacturing company details
        updatedEntity = await ManufacturingCompany.findOneAndUpdate(
          { _id: manufacturingUnitId }, // Ensure it matches the linked manufacturing unit
          { $set: { companyAddress: address, companyArea: area } },
          { new: true } // Return the updated document
        );
  
        if (!updatedEntity) {
          return res.status(404).json({
            success: false,
            message: "Linked manufacturing unit not found.",
          });
        }
  
      } else {
        return res.status(403).json({
          success: false,
          message: "User is not authorized to update details.",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Details updated successfully.",
        data: updatedEntity,
      });
    } catch (error) {
      console.error("Error updating details:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating details.",
        error: error.message,
      });
    }
  };