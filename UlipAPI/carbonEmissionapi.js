const axios = require('axios');
const { getHeaders } = require('./header');
const { CONFIG } = require('../constants/config');

/**
 * Fetch carbon emission details for a specific configuration.
 * 
 * @param {number} distance - Distance traveled.
 * @param {string} vehicleType - Type of vehicle.
 * @param {string} fuelType - Type of fuel.
 * @param {number} noOfTrips - Number of trips.
 * @returns {Promise<object>} - Resolves to emission details or error message.
 */
const getCarbonEmission = async (distance, weight = 100, noOfTrips=1) => {
    const url = CONFIG.ULIP_API.CARBON_EMISSION;

    const data = {
        distance: distance.toString(),
        noOfTrips: noOfTrips.toString(),
        weight: weight.toString()
    };

    try {
        const headers = await getHeaders(true);

        const response = await axios.post(url, data, { headers });

        return {
            success: true,
            carbonEmissionFactor: response.data?.response?.[0]?.response?.["Carbon Emission Factor"]
        };
    } catch (error) {
        return {
            success: false,
            message: error.response ? error.response.data : error.message
        };
    }
};

/**
 * Fetch carbon emission details for all permutations of vehicle types and fuel types.
 * 
 * @param {number} distance - Fixed distance traveled.
 * @returns {Promise<Array>} - Resolves to an array of all emission details.
 */
const getCarbonEmissionDetails = async (distance, weight) => {
    const noOfTrips = 1;
    const vehicleTypes = [
        "Small Commercial Vehicles",
        "Light Commercial Vehicles",
    ];
    const fuelTypes = ["Diesel", "Petrol"];

    const promises = vehicleTypes.flatMap(vehicleType =>
        fuelTypes.map(fuelType =>
            getCarbonEmission(distance, vehicleType, fuelType, noOfTrips, weight)
        )
    );


    const results = await Promise.all(promises);




    return results;
};

module.exports = {
    getCarbonEmission,
    getCarbonEmissionDetails
};
