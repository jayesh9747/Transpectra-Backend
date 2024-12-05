const Warehouse = require('../models/Warehouse');
const User = require('../models/User')
const { msgFunction } = require('../utils/msgFunction');

exports.fetchInventory = async (req, res) => {
    try {
        const userId  = req.user?.id;

        // Assuming `User` is a Mongoose model and `Warehouse` is another model
        const user = await User.findById(userId);


        if (!user) {
            return res.status(404).json(msgFunction(false, "User not found", null));
        }

        const linkedWarehouseId = user.LinkedWarehouseID;

        if (!linkedWarehouseId) {
            return res.status(404).json(msgFunction(false, "No linked warehouse found for this user", null));
        }

        // Find the warehouse by the LinkedWarehouseID
        const warehouse = await Warehouse.findById(linkedWarehouseId).populate('inventory');

        if (!warehouse) {
            return res.status(404).json(msgFunction(false, "Warehouse not found", null));
        }

        // Get the inventory array
        const inventory = warehouse.inventory;

        if (!inventory || inventory.length === 0) {
            return res.status(200).json(msgFunction(true, "There is no inventory in the current warehouse", []));
        }

        // Respond with the inventory details
        return res.status(200).json(msgFunction(true, "Inventory fetched successfully", inventory));
    } catch (error) {
        console.log(error);
        return res.status(500).json(msgFunction(false, "An error occurred while fetching the inventory", error));
    }
};
