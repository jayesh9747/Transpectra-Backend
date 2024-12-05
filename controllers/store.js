const Store = require('../models/Store');
const DistributionCenter = require('../models/DistributionCenter')
const { msgFunction } = require('../utils/msgFunction');
const mongoose = require('mongoose');


//  fetching from the distribution store 
exports.fetch_stores = async (req, res) => {
    try {
        const dis_centerId = req.store.id;
        const storeId = req.params.storeId;

        if (!dis_centerId) {
            return res.status(400).json(
                msgFunction(false, "You are not Authenticated")
            );
        }

        if (storeId && !mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json(
                msgFunction(false, "Incorrect storeId ID. Please provide a valid ID.")
            );
        }

        const distributionCenter = await DistributionCenter.findById(dis_centerId)
            .populate({
                path: 'storeIds',
                match: storeId ? { _id: storeId } : {}
            });

        if (!distributionCenter) {
            return res.status(404).json(
                msgFunction(false, "Distribution Center not found")
            );
        }

        const stores = storeId ? distributionCenter.storeIds : distributionCenter.storeIds;

        return res.status(200).json({
            success: true,
            data: stores
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while fetching stores", error.message)
        );
    }
}




// fetch own store Details 
exports.store_details = async (req, res) => {
    try {

        const StoreId = req.store.id;

        if (!StoreId) {
            return res.status(400).json(
                msgFunction(false, "You are not Authenticated")
            );
        }

        const storeCenter = await Store.findById(StoreId);

        if (!storeCenter) {
            return res.status(404).json(
                msgFunction(false, " Store not found!")
            );
        }

        return res.status(200).json({
            success: true,
            data: storeCenter
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while fetching stores", error.message)
        );
    }
}

// for the distribution-center
exports.Add_store = async (req, res) => {
    try {
        const dis_centerId = req.store.id;

        if (!dis_centerId) {
            return res.status(400).json(
                msgFunction(false, "You are not Authenticated")
            );
        }

        const { store_id } = req.body;

        if (!store_id) {
            res.status(400).json(
                msgFunction(false, "StoreId must be required")
            )
        }

        const query = {
            _id: store_id
        }

        const result = await Store.findOne(query);

        if (!result) {
            res.status(400).json(
                msgFunction(false, "Sorry ,Store is Unavailable to add")
            )
        }

        const updatedDistributionCenter = await DistributionCenter.findOneAndUpdate(
            { _id: dis_centerId },
            { $addToSet: { storeIds: store_id } },
            { new: true }
        );

        if (!updatedDistributionCenter) {
            return res.status(400).json(
                msgFunction(false, "Failed to update distribution center")
            );
        }

        return res.status(200).json({
            success: true,
            message: "Store successfully added to the distribution center",
            data: updatedDistributionCenter
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while adding the store", error.message)
        );
    }
}

// fetch the inventory of perticular store  for both distribution center or store
exports.Inventories = async (req, res) => {

    const { id: dis_center } = req.store;

}


// for store manager only
exports.UpdateStore = async (req, res) => {
    try {
        const { id: userID } = req.user;
        const { id: storeId } = req.store;

        const {
            name,
            location,
            squareFeet,
            openingDate,
            type,
            areaPopulation,
            dailyVisitors
        } = req.body;

        if (!userID) {
            return res.status(400).json(
                msgFunction(false, "You are not Authenticated")
            );
        }

        if (!storeId) {
            return res.status(400).json(
                msgFunction(false, "You are not Authenticated , pls Login Again")
            );
        }

        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                name,
                location,
                squareFeet,
                openingDate,
                type,
                areaPopulation,
                dailyVisitors
            },
            { new: true, runValidators: true }
        );

        if (!updatedStore) {
            return res.status(400).json(
                msgFunction(false, "Failed to update Store")
            );
        }

        return res.status(200).json({
            success: true,
            message: "Store successfully updated!",
            data: updatedStore
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while updating the store", error.message)
        );
    }
}
