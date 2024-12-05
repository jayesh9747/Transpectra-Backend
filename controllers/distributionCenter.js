const store = require('../models/Store');
const DistributionCenter = require('../models/DistributionCenter')
const Delivery = require('../models/Delivery');
const { msgFunction } = require('../utils/msgFunction');


exports.AssignDelivery = async (req, res) => {
    try {
        const dis_centerId = req.store.id;

        const { deliveryId } = req.params;

        if (!dis_centerId) {
            return res.json(msgFunction(false, "Distribution Center field is required"));
        }

        if (!deliveryId) {
            return res.json(msgFunction(false, "This delivery is not available"));
        }


        const DC = await distribution_center.findOne({ dsId });

        if (!DC) {
            return res.json(msgFunction(false, "Distribution Center Not found"));
        }

    } catch (error) {
        return res.json(
            msgFunction(false, `Some Error in Assign Delivery`, error.message)
        )
    }

}

exports.Deliveries = async (req, res) => {
    try {
        const dis_centerId = req.store.id;
        const { deliveryId } = req.params;
        const { status } = req.query;

        if (!dis_centerId) {
            return res.status(400).json(
                msgFunction(false, "You are not Authenticated!")
            );
        }

        const query = {
            DistributionCenterId: dis_centerId
        };

        if (deliveryId) {
            query._id = deliveryId;
        }

        if (status) {
            query.status = status
        }

        const deliveries = await Delivery.find(query);

        if (deliveryId && deliveries.length === 0) {
            return res.status(404).json(
                msgFunction(false, "Delivery not found")
            );
        }

        return res.json({
            status: true,
            data: deliveries
        })

    } catch (error) {
        return res.status(500).json(
            msgFunction(false, `Some Error in fetch Delivery`, error.message)
        )
    }
}

exports.GetDistributionCenter = async (req, res) => {
    try {

        const dis_CenterId = req.store.id;

        if (!dis_CenterId) {
            return res.status(400).json(
                msgFunction(false, "You are not Authenticated")
            );
        }

        const DisCenter = await DisCenter.findById(dis_centerId);

        if (!DisCenter) {
            return res.status(404).json(
                msgFunction(false, "Distribution not found!")
            );
        }

        return res.status(200).json({
            success: true,
            data: DisCenter
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json(
            msgFunction(false, "An error occurred while fetching Distribution Center", error.message)
        );
    }
}


exports.UpdatedDistributionCenter = async (req, res) => {
    try {


        const storeId = req.store.id;

        if (!storeId) {
            return res.status(404).json(msgFunction(false, "Store is not found!"))
        }

        const { name, address, about, storageCapacity } = req.body;







    } catch (error) {

    }



}