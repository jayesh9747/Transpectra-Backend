// controllers/warehouseController.js
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Products");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { uploadFileToCloudinary } = require("../utils/fileUploader");
const xlsx = require("xlsx");
const { msgFunction } = require("../utils/msgFunction");
const moment = require("moment");
const User = require("../models/User")

exports.addWarehouse = async (req, res) => {
  try {
    console.log("Received request to add a warehouse");

    // Destructure fields from request body
    const { warehouseName, warehouseAddress, warehouseArea, warehouseDescription, managerId } = req.body;

    // Log the incoming request
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    // **1. Upload the warehouse image to Cloudinary**
    const warehouseImage = await uploadImageToCloudinary(
      req.files.warehouseImage[0], // Access the first file in warehouseImage array
      "warehouse_images"
    );

    // **2. Upload and process the Excel file**
    const inventoryFile = req.files.inventoryExcel[0]; // Access the first file in inventoryExcel array
    const uploadedFileUrl = await uploadFileToCloudinary(inventoryFile, "warehouse_files");

    // Parse the Excel file using xlsx
    const workbook = xlsx.readFile(inventoryFile.path); // Use the correct file path
    const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Use the first sheet
    const parsedData = xlsx.utils.sheet_to_json(sheet); // Convert the sheet data to JSON
    console.log("Parsed Inventory Data:", parsedData);

    // **3. Map Excel Headers to Schema Fields**
    const mappedData = parsedData.map((item, index) => {
      const mappedItem = {
        productName: item['Product Name']?.trim(),
        productQuantity: Number(item['Product Quantity']),
        productCategory: item['Product Category']?.trim(),
        supplierName: item['Supplier Name']?.trim(),
        month: item['Month']?.trim(),
        productExpiry: item['Product Expiry'] ? parseExcelDate(item['Product Expiry']) : null,
        productThreshold: Number(item['Product Threshold']),
        backorderRate: Number(item['Backorder Rate']),
        productType: item['Product Type']?.trim(),
        supplierReliability: Number(item['Supplier Reliability']),
        productCost: Number(item['Product Cost']),
        productDiscount: Number(item['Product Discount']),
        seasonality: item['Seasonality']?.trim(),
        marketChanges: item['Market Changes']?.trim(),
        profitGained: Number(item['Profit Gained']),
        bulkOrderRequest: item['Bulk Order Request']?.trim()
      };
      // Validate Required Fields
      const requiredFields = ['productName', 'productQuantity', 'productCategory', 'supplierName', 'month', 'productExpiry', 'productThreshold', 'productCost'];
      for (const field of requiredFields) {
        if (!mappedItem[field] && mappedItem[field] !== 0) {
          throw new Error(`Missing required field "${field}" in product at row ${index + 2}`);
        }
      }
    
      return mappedItem;
    });
    
    console.log("Mapped Inventory Data:", mappedData);

    // **5. Save warehouse details in the database**
    const warehouse = await Warehouse.create({
      warehouseName,
      warehouseAddress,
      warehouseArea,
      warehouseDescription,
      warehouseImage: warehouseImage.secure_url, // Save only the secure URL of the uploaded image
      managerId,
    });

    // **6. Save products from the inventory**
    const productPromises = mappedData.map(productData => {
      return Product.create({
        ...productData, // Spread mapped product data
        warehouse: warehouse._id, // Link the product to the warehouse
      }).then(product => {
        warehouse.inventory.push(product._id); // Add product ID to warehouse inventory
      });
    });

    await Promise.all(productPromises); // Execute all product creations concurrently

    // Save the updated warehouse document
    await warehouse.save();
    const manager = await User.findById(managerId);
    if (!manager) {
      throw new Error("Warehouse Manager not found");
    }

    manager.LinkedWarehouseID = warehouse._id; // Assign the created warehouse ID
    await manager.save();
    console.log("done with Adding and appending")

    // **7. Respond with success**
    return res.status(201).json({
      success: true,
      message: "Warehouse and inventory added successfully.",
      warehouse,
    });

  } catch (error) {
    // **Handle and log errors**
    console.error("Error while adding warehouse:", error);
    return res.status(500).json(
      msgFunction(false, "An error occurred while adding warehouse and inventory.", error.message)
    );
  }
};

const parseExcelDate = (excelDate) => {
  if (typeof excelDate === 'number') {
    // Excel serial date
    return moment('1899-12-30').add(excelDate, 'days').toDate();
  } else if (typeof excelDate === 'string') {
    // Handle both 'DD/MM/YYYY' and 'YYYY-MM-DD' formats
    const formats = ['DD/MM/YYYY', 'YYYY-MM-DD'];
    const parsedDate = moment(excelDate, formats, true);
    if (!parsedDate.isValid()) {
      throw new Error(`Invalid date format: "${excelDate}"`);
    }
    return parsedDate.toDate();
  } else if (excelDate instanceof Date) {
    // Already a Date object
    return excelDate;
  } else {
    throw new Error(`Unsupported date format: ${excelDate}`);
  }
};

exports.getWarehouseDetailsByManagerId = async (req, res) => {
  const { managerId } = req.params;
  console.log("In warehouse Details retreiving function")
  console.log(managerId)
  try {
    // Step 1: Find the user by managerId
    const user = await User.findById(managerId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Step 2: Extract linkedWarehouseID
    const warehouseId = user.LinkedWarehouseID;
    if (!warehouseId) {
      return res.status(404).json({ error: "No linked warehouse found for this user." });
    }

    // Step 3: Fetch warehouse details and populate fields
    const warehouse = await Warehouse.findById(warehouseId)
      .populate("inventory") // Populate inventory
      .populate("yards"); // Populate yards

    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found." });
    }

    // Step 4: Return the warehouse details
    res.status(200).json({ warehouse });
  } catch (error) {
    console.error("Error fetching warehouse details:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};