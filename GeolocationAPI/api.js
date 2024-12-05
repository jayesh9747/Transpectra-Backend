const axios = require("axios");
const { getCoordinates, getRoute } = require('./comman');

const DistanceBWAddress = async (startAddress, endAddress) => {

    const startCoordinates = await getCoordinates(startAddress);
    
    if (!startCoordinates.success) {
        console.error("Error fetching start address coordinates:", startCoordinates.message);
        return;
    }

    const endCoordinates = await getCoordinates(endAddress);
    if (!endCoordinates.success) {
        console.error("Error fetching end address coordinates:", endCoordinates.message);
        return;
    }

    const result = await getRoute(
        `${startCoordinates.data.lat},${startCoordinates.data.lon}`,
        `${endCoordinates.data.lat},${endCoordinates.data.lon}`
    );

    if (result.success) {
        return result.data;
    } else {
        return null;
    }
}


module.exports = {
    DistanceBWAddress
}