const axios = require('axios');
const { CONFIG } = require('../constants/config');

const API_KEY = CONFIG.GEOAPIFY.API_KEY
const URL = CONFIG.GEOAPIFY.BASE_URL


const getCoordinates = async (address) => {

    const url = `${URL}/v1/geocode/search`;

    const params = {
        apiKey: API_KEY,
        text: address,
    };

    try {
        const response = await axios.get(url, { params });

        if (response.data.features && response.data.features.length > 0) {
            const { lon, lat } = response.data.features[0].properties;

            return {
                success: true,
                data: { lat, lon }
            };
        } else {
            return {
                success: false,
                message: "No coordinates found for the provided address."
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error.response ? error.response.data : error.message
        };
    }
};


const getRoute = async (startAddress, endAddress) => {    
    const { lat: startlat, lon: startlon } = startAddress;
    const { lat: endlat, lon: endlon } = endAddress;
    const url = `${CONFIG.GEOAPIFY.BASE_URL}/v1/routing`;

    const params = {
        apiKey: CONFIG.GEOAPIFY.API_KEY,
        waypoints: `${startlat},${startlon}|${endlat},${endlon}`, // waypoints format: "lat1,lon1|lat2,lon2"
        mode: 'truck',
        units: 'imperial',
    };

    try {
        const response = await axios.get(url, { params });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            message: error.response ? error.response.data : error.message
        };
    }
};



module.exports = {
    getCoordinates,
    getRoute
}