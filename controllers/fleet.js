const Fleet = require("../models/fleet");
const User = require("../models/User");
const { msgFunction } = require("../utils/msgFunction");
const { CONFIG } = require('../constants/config');
const { required } = require("joi");

const Warehouse = require("../models/Warehouse");
const Yard = require('../models/Yard')

/**
 *
 * Purpose : controller to add Fleet In yard
 *
 * url : api/v1/fleet/add
 *
 * default departure is false
 * 
 * test : done
 *
 */
exports.addFleetInYard = async (req, res) => {
  try {
    const {
      driverName,
      vehicleLicensePlate,
      dateOfArrival,
      purpose,
      allocatedDock,
      orderId,
      yardManagerId
    } = req.body;

    console.log(req.body);

    // Validate required fields
    if (!driverName || !vehicleLicensePlate || !dateOfArrival || !purpose || !allocatedDock || !yardManagerId) {
      return res
        .status(400)
        .json(msgFunction(false, "All required fields must be provided, including yardManagerId."));
    }

    // Find the Yard Manager in the database
    const yardManager = await User.findById(yardManagerId);

    if (!yardManager || yardManager.accountType !== CONFIG.ACCOUNT_TYPE.YARD) {
      return res
        .status(400)
        .json(msgFunction(false, "Invalid Yard Manager ID or the user is not a Yard Manager."));
    }

    // Check if the Yard Manager is linked to a Yard
    const linkedYardId = yardManager.LinkedYardID;
    if (!linkedYardId) {
      return res
        .status(400)
        .json(msgFunction(false, "Yard Manager is not linked to any Yard."));
    }

    // Check if a fleet with the same vehicleLicensePlate is already present in the yard
    const existingFleet = await Fleet.findOne({
      vehicleLicensePlate,
      yardId: linkedYardId,
      arrived: true, // Ensure the fleet is marked as arrived
    });

    if (existingFleet) {
      return res.status(400).json(msgFunction(false, `Fleet with vehicle license plate "${vehicleLicensePlate}" is already present in the yard.`));
    }

    // Get the current time for timeOfArrival
    const timeOfArrival = new Date().toISOString().split("T")[1].split(".")[0];

    // Create Fleet entry
    const newFleet = await Fleet.create({
      driverName,
      vehicleLicensePlate,
      dateOfArrival,
      timeOfArrival,
      purpose,
      allocatedDock,
      orderId: orderId || null,
      yardId: linkedYardId,
      yardManagerId,
      arrived: true,
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Fleet details added successfully.",
      fleet: newFleet,
    });
  } catch (error) {
    console.error("Error adding Fleet details:", error);
    return res
      .status(500)
      .json(msgFunction(false, "An error occurred while adding Fleet details.", error.message));
  }
};

/**
 * 
 * @param {yardId , yardManagerId} req 
 * @url : /api/v1/fleet/available 
 * @returns : available fleet in particular yard
 */
exports.availableFleetInYard = async (req, res) => {
  try {
    const { yardId, yardManagerId } = req.body;

    // Validate input: either yardId or yardManagerId must be provided
    if (!yardId && !yardManagerId) {
      return res.status(400).json({
        success: false,
        message: "Either yardId or yardManagerId must be provided to fetch fleets.",
      });
    }

    let finalYardId = yardId;

    // If yardManagerId is provided, find the associated yardId
    if (yardManagerId) {
      const yardManager = await User.findById(yardManagerId);

      // Validate Yard Manager
      if (!yardManager || yardManager.accountType !== CONFIG.ACCOUNT_TYPE.YARD) {
        return res.status(400).json({
          success: false,
          message: "Invalid Yard Manager ID or the user is not a Yard Manager.",
        });
      }

      // Fetch the linked Yard ID
      finalYardId = yardManager.LinkedYardID;
      if (!finalYardId) {
        return res.status(400).json({
          success: false,
          message: "The Yard Manager is not linked to any Yard.",
        });
      }
    }

    // Base query: Filter by yardId and arrived:true
    const query = {
      yardId: finalYardId,
      arrived: true,
    };

    // Fetch fleets based on the query
    const incomingFleets = await Fleet.find(query);

    // Return the response
    return res.status(200).json({
      success: true,
      fleets: incomingFleets,
    });
  } catch (error) {
    console.error("Error fetching incoming fleets:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching incoming fleets.",
      error: error.message,
    });
  }
};


/**
 * 
 * Purpose :Check in that trucks which are going out side from the yard
 *
 * url : api/v1/fleet/departed
 *
 * use : used in the Overview Fleet in the client side
 * 
 * test : done
 */
exports.getFleetDeparted = async (req, res) => {
  try {
    const id = req.user.id;
    const warehouseManagerId = req.body.managerId || id;

    // Step 1: Find the warehouse managed by the warehouseManagerId
    const warehouse = await Warehouse.findOne({ managerId: warehouseManagerId });
    if (!warehouse) {
      return res
        .status(404)
        .json(msgFunction(false, "Warehouse not found for this manager."));
    }

    const warehouseId = warehouse._id;

    // Step 2: Find all yards associated with this warehouseId
    const yards = await Yard.find({ warehouseId });
    if (!yards.length) {
      return res
        .status(200)
        .json(msgFunction(false, "No yards found for this warehouse.", []));
    }

    const yardIds = yards.map((yard) => yard._id);

    // Step 3: Fetch fleets where `arrived` and `departed` are true for these yardIds
    const fleets = await Fleet.find({
      yardId: { $in: yardIds },
      arrived: true,
      departed: true,
    })
      .populate({ path: "yardManagerId", select: "name email" }); // Populate yard manager details

    if (!fleets.length) {
      return res
        .status(404)
        .json(msgFunction(false, "No fleets found with both arrived and departed status."));
    }

    // Step 4: Format the data
    const formattedFleetData = fleets.map((fleet) => ({
      licenseNumber: fleet.vehicleLicensePlate,
      driver: fleet.driverName,
      arrivalTime: `${fleet.dateOfArrival.toISOString().split("T")[0]} ${fleet.timeOfArrival}`,
      departureTime: fleet.updatedAt.toISOString(), // Use updatedAt for departure time
      purpose: fleet.purpose.charAt(0).toUpperCase() + fleet.purpose.slice(1), // Capitalize
      productsLink: `/products/${fleet.orderId || "unknown"}`, // Example for Show Products link
      yard: fleet.yardId ? { name: fleet.yardId.name, location: fleet.yardId.location } : "N/A",
      yardManager: fleet.yardManagerId
        ? { name: fleet.yardManagerId.name, email: fleet.yardManagerId.email }
        : "N/A",
    }));

    // Step 5: Send the response
    return res
      .status(200)
      .json(msgFunction(true, "Fleet data fetched successfully.", formattedFleetData));
  } catch (error) {
    console.error("Error fetching fleet data:", error);
    return res.status(500).json(msgFunction(false, error.message));
  }
};





/**
 * 
 * purpose : Mark truck as departed
 * 
 * /api/v1/fleet/trucks/departed/:fleetId  
 *  
 * test : 
 */
exports.markTruckAsDeparted = async (req, res) => {
  try {
    const { fleetId } = req.params;

    // Fetch the truck by ID
    const truck = await Fleet.findById(fleetId);
    if (!truck) {
      return res.status(404).json(msgFunction(false, "Truck not found."));
    }

    if (truck.departed) {
      return res.status(400).json(msgFunction(false, "Truck has already been marked as departed."));
    }

    // Mark the truck as departed
    truck.departed = true;
    await truck.save();
    const { orderId } = truck;

    // If an orderId exists, update the warehouse inventory based on this order
    if (orderId) {
      await updateInventory(orderId);  // Call the separate function to update inventory
    }

    return res.status(200).json({
      success: true,
      message: "Truck marked as departed successfully, and warehouse inventory updated.",
      truck,
    });
  } catch (error) {
    console.error("Error marking truck as departed:", error);
    return res.status(500).json(msgFunction(false, error.message));
  }
};


// Function to update warehouse inventory based on the orderId
const updateInventory = async (orderId) => {
  try {
    // Fetch the order details (products and their quantities)
    const order = await Order.findById(orderId);  // Assuming you have an Order model

    if (!order) {
      throw new Error("Order not found.");
    }

    // Loop through the order items and update warehouse inventory
    for (let item of order.selectedProducts) { // Assuming the order has a list of items
      const { productId, quantity } = item; // productId and quantity in the order

      // Update the warehouse inventory for each product
      const warehouseItem = await Warehouse.findOne({ productId });
      if (!warehouseItem) {
        throw new Error(`Product with ID ${productId} not found in warehouse.`);
      }

      // Increase the quantity of the product in the warehouse
      warehouseItem.quantity += quantity; // Increase by the quantity in the order
      await warehouseItem.save();

      console.log(`Updated inventory for product ID ${productId}. New quantity: ${warehouseItem.quantity}`);
    }
  } catch (error) {
    console.error("Error updating inventory:", error);
    throw new Error("Failed to update warehouse inventory.");
  }
};
