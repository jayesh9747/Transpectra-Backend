const Delivery = require("../models/Delivery");
const { msgFunction } = require("../utils/msgFunction");
const { CONFIG } = require("../constants/config");
const mongoose = require("mongoose");
const ManufacturingUnit = require("../models/ManufacturingUnit");
const Warehouse = require("../models/Warehouse");
const Order = require("../models/Order");
const { uploadPdfToCloudinary } = require("../utils/pdfUploader");
const User = require("../models/User");
const Profile = require("../models/Profile");
const RouteTracking = require("../models/routeTracking");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { DistanceBWAddress } = require("../GeolocationAPI/api");
const { getCarbonEmissionDetails, getCarbonEmission } = require("../UlipAPI/carbonEmissionapi");
const { getOptimizedRoutes } = require('../AIModelAPI/api')

exports.generateRoutesForDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Step 1: Input Validation
    if (!orderId) {
      return res
        .status(400)
        .json(msgFunction(false, "Please provide the orderId"));
    }

    // Step 2: Fetch Order Details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json(msgFunction(false, "Order not found."));
    }

    // Extract manufacturerId and warehouseId
    const { manufacturerId, warehouseId } = order;

    // Step 3: Retrieve Manufacturing Unit and Warehouse Details
    const manufacturingUnit = await ManufacturingUnit.findById(manufacturerId);
    if (!manufacturingUnit) {
      return res
        .status(404)
        .json(msgFunction(false, "Manufacturing unit not found."));
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json(msgFunction(false, "Warehouse not found."));
    }

    // Step 4: Extract Pickup and Dropoff Locations
    const pickupLocation = {
      name: manufacturingUnit.companyName,
      address: manufacturingUnit.companyAddress,
      contactPerson: manufacturingUnit.contactPerson,
      contactNumber: manufacturingUnit.contactNumber,
    };

    const dropoffLocation = {
      name: warehouse.warehouseName,
      address: warehouse.warehouseAddress,
      contactPerson: warehouse.contactPerson,
      contactNumber: warehouse.contactNumber,
    };

    console.log(pickupLocation, dropoffLocation);

    // Step 5: Calculate Distance and Time
    const result = await DistanceBWAddress(
      pickupLocation.address,
      dropoffLocation.address
    );

    console.log("this is distance b/w address******", result);

    const distance = `${result.distance} ${result.distance_units}`;
    const time = `${result.time}`;

    // Step 6: Get Carbon Emission Details
    const carbonEmissionObject = await getCarbonEmission(distance, weight, 1);

    const inputData = {
      source: pickupLocation.address,
      destination: dropoffLocation.address
    }

    const routes = await getOptimizedRoutes(inputData);
    

    // Step 7: Construct Response Object
    const responseObj = {
      expectedDeliveryDate: order.estimatedDeliveryDate,
      sourceAddress: pickupLocation,
      destinationAddress: dropoffLocation,
      distance,
      time,
      carbonEmission
    };

    // Step 8: Send Response
    return res.status(200).json({
      success: true,
      data: responseObj,
    });
  } catch (error) {
    console.error("Error in generateRoutesForDelivery:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating routes.",
      error: error.message,
    });
  }
}


exports.FetchDelivery = async (req, res) => {
  try {
    const { id: userId, account_type: accountType } = req.user;
    const { id: storeId } = req.store;
    const { delivery_id: deliveryId } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json(msgFunction(false, "You are not authenticated!"));
    }

    if (deliveryId && !mongoose.Types.ObjectId.isValid(deliveryId)) {
      return res
        .status(400)
        .json(
          msgFunction(
            false,
            "Incorrect delivery ID. Please provide a valid ID."
          )
        );
    }

    let query = {};

    if (accountType === CONFIG.ACCOUNT_TYPE.DRIVER) {
      query.assignedDriver = userId;
    } else if (
      accountType === CONFIG.ACCOUNT_TYPE.DISTRIBUTION_CENTER ||
      accountType === CONFIG.ACCOUNT_TYPE.STORE
    ) {
      if (!storeId) {
        return res
          .status(400)
          .json(
            msgFunction(false, "Your Store is Not Found! Please log in again.")
          );
      }

      query =
        accountType === CONFIG.ACCOUNT_TYPE.DISTRIBUTION_CENTER
          ? { DistributionCenterId: storeId }
          : { storeId: storeId };
    } else {
      return res
        .status(403)
        .json(msgFunction(false, "You are not permitted to fetch deliveries!"));
    }

    if (deliveryId) {
      query._id = deliveryId;
    }

    const deliveries = await Delivery.find(query);

    if (!deliveries || deliveries.length === 0) {
      return res
        .status(404)
        .json(msgFunction(false, "No Delivery Items are found!"));
    }

    return res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error("Error in FetchDelivery:", error);
    return res
      .status(500)
      .json(
        msgFunction(
          false,
          "An error occurred while fetching the delivery.",
          error.message
        )
      );
  }
};




/**
 * @url : api/v1/delivery/create
 *
 * purpose : create delivery for particular order
 */
// Configure multer for file uploads
// Ensure uploads directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".pdf") {
      return cb(new Error("Only PDF files are allowed."), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("invoicePdf");

exports.CreateDelivery = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer Error:", err.message);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        message: "Invalid file input: Please upload a PDF.",
      });
    }

    try {
      const {
        orderId,
        uniqueOrderId,
        warehouseId,
        ManufactureId,
        selectedProducts,
        estimatedDeliveryTime,
        deliveryRoutes // Accept deliveryRoutes from the request body
      } = req.body;

      if (
        !orderId ||
        !uniqueOrderId ||
        !warehouseId ||
        !ManufactureId ||
        !selectedProducts ||
        !estimatedDeliveryTime ||
        !deliveryRoutes // Ensure deliveryRoutes is also present
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields.",
        });
      }

      // Parse and validate selectedProducts
      let parsedProducts;
      try {
        parsedProducts = JSON.parse(selectedProducts);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format for selectedProducts.",
        });
      }

      if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected products must be a non-empty array.",
        });
      }

      const updatedProducts = parsedProducts.map(product => {
        const { _id, ...rest } = product; // Destructure to exclude _id
        return { ...rest, productId: _id }; // Add productId
      });



      const convertedProducts = updatedProducts.map((product) => ({
        ...product,
        _id: new mongoose.Types.ObjectId(product._id),
      }));

      // Parse and validate deliveryRoutes
      let parsedRoutes;
      try {
        parsedRoutes = JSON.parse(deliveryRoutes);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format for deliveryRoutes.",
        });
      }

      if (!Array.isArray(parsedRoutes) || parsedRoutes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Delivery routes must be a non-empty array.",
        });
      }


      // Fetch manufacturing unit

      const manufacturingUnit = await ManufacturingUnit.findById(ManufactureId);
      if (!manufacturingUnit) {
        return res.status(404).json({
          success: false,
          message: "Manufacturing unit not found.",
        });
      }

      // Fetch warehouse
      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: "Warehouse not found.",
        });
      }

      // Fetch manager and manufacturer contact details
      const manufacturerUser = await User.findById(manufacturingUnit.manufacturerId).populate('additionalDetails');
      const warehouseManager = await User.findById(warehouse.managerId).populate('additionalDetails');

      if (!manufacturerUser || !manufacturerUser.additionalDetails) {
        return res.status(404).json({
          success: false,
          message: "Manufacturer's profile not found.",
        });
      }

      if (!warehouseManager || !warehouseManager.additionalDetails) {
        return res.status(404).json({
          success: false,
          message: "Warehouse manager's profile not found.",
        });
      }

      const manufacturerProfile = await Profile.findById(manufacturerUser.additionalDetails._id);
      const warehouseProfile = await Profile.findById(warehouseManager.additionalDetails._id);

      if (!manufacturerProfile || !warehouseProfile) {
        return res.status(404).json({
          success: false,
          message: "Profile details for manager or manufacturer not found.",
        });
      }

      // Construct pickup and drop-off locations
      const pickupLocation = {
        address: manufacturingUnit.companyAddress,
        contactPerson: `${manufacturerUser.firstName} ${manufacturerUser.lastName}`,
        contactNumber: manufacturerProfile.contactNumber,
      };

      const dropoffLocation = {
        address: warehouse.warehouseAddress,
        contactPerson: `${warehouseManager.firstName} ${warehouseManager.lastName}`,
        contactNumber: warehouseProfile.contactNumber,
      };

      if (!pickupLocation.address || !dropoffLocation.address) {
        return res.status(400).json({
          success: false,
          message: "Manufacturing unit or warehouse does not have an address.",
        });
      }

      const filePath = req.file.path.replace(/\\/g, "/");
      const uploadedPdf = await uploadPdfToCloudinary(filePath, "invoices");

      if (!uploadedPdf || !uploadedPdf.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload PDF to Cloudinary.",
        });
      }

      const newDelivery = new Delivery({
        orderId,
        uniqueOrderId,
        warehouseId,
        ManufactureId,
        pickupLocation,
        dropoffLocation,
        products: convertedProducts,
        deliveryRoutes: parsedRoutes, // Save delivery routes
        packageDetails: {
          weight: `${parsedProducts.length * 10}kg`,
          dimensions: "Varied",
          fragile: false,
          description: "Delivery of selected products",
        },
        invoicePdf: uploadedPdf.secure_url,
        estimatedDeliveryTime,
        createdAt: new Date(),
        status: "Pending",
        assignedDrivers: [],
        routeTrackingid: null,
      });

      const savedDelivery = await newDelivery.save();

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { $push: { deliveries: savedDelivery._id }, orderStatus: "Processing" },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found. Could not associate delivery.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Delivery created successfully.",
        data: savedDelivery,
      });
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  });
};

/**
 * @url : api/v1/delivery/warehouse/:warehouseId/details
 *
 * purpose : fetch all the delivery details on the warehouse side 
 */
exports.getWarehouseDetails = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    // Find the warehouse by ID and ensure it exists
    const warehouse = await Warehouse.findById(warehouseId).populate("linkedOrders");
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found.",
      });
    }

    // Extract linked orders
    const linkedOrders = warehouse.linkedOrders;
    if (!linkedOrders || linkedOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No linked orders found for this warehouse.",
        data: []
      });
    }

    // Fetch all order details along with their deliveries
    const ordersWithDetails = await Promise.all(
      linkedOrders.map(async (orderId) => {
        const order = await Order.findById(orderId).populate("deliveries");
        if (!order) {
          return null;
        }

        // Fetch delivery details for each order
        const deliveriesDetails = await Promise.all(
          order.deliveries.map(async (deliveryId) => {
            const delivery = await Delivery.findById(deliveryId);
            return delivery;
          })
        );

        return {
          ...order.toObject(),
          deliveriesDetails,
        };
      })
    );

    // Remove any null records from the results
    const populatedOrders = ordersWithDetails.filter((order) => order !== null);

    // Exclude `linkedOrders` from the warehouse object to avoid duplication
    const warehouseDetails = warehouse.toObject();
    delete warehouseDetails.linkedOrders;

    res.status(200).json({
      success: true,
      message: "Warehouse details fetched successfully.",
      data: {
        warehouseDetails,
        linkedOrders: populatedOrders, // Include only the populated orders
      },
    });
  } catch (error) {
    console.error("Error fetching warehouse details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};



/**
 * @url : api/v1/delivery/warehouse/:warehouseId/details
 *
 * purpose : fetch all the delivery details on the manufacturer side 
 */
exports.getManufacturingUnitOrdersWithDeliveries = async (req, res) => {
  try {
    const { manufacturingUnitId } = req.params;

    // Fetch all orders for the given manufacturing unit ID
    const orders = await Order.find({ manufacturerId: manufacturingUnitId }).populate({
      path: "deliveries", // Populate the deliveries field
      model: "Delivery", // Specify the Delivery schema
      populate: {
        path: "routeTrackingid", // Populate the routeTrackingId inside the Delivery schema
        model: "RouteTracking", // Specify the RouteTracking schema
      },
    });

    // If no orders are found
    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found for this manufacturing unit.",
        data: []
      });
    }

    // Return the orders with their populated deliveries and routeTracking details
    res.status(200).json({
      success: true,
      message: "Orders, deliveries, and route tracking details fetched successfully.",
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders and deliveries:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
