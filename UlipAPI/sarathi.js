const { CONFIG } = require('../constants/config');
const axios = require('axios');
const { getHeaders } = require('./header');

/**
 * Fetch driver's license details from Sarthi.
 * @param {string} dlnumber - The driver's license number.
 * @param {string} dob - The date of birth of the driver (YYYY-MM-DD format).
 * @param {string} driverName - The name of the driver.
 * @returns {Promise<object>} - License details response.
 */
const verifyDriverwithSarthi = async (dlnumber, dob, driverName) => {
    const url = CONFIG.ULIP_API.SARTHI; 
    const data = {
        dlnumber: dlnumber.toString(),
        dob: dob,
        driverName: driverName,
    };

    try {
        const headers = await getHeaders(true);
        console.log(headers);
        const response = await axios.post(url, data, { headers });
        console.log(response);

        const responseData = response.data;
        if (responseData.responseStatus === "SUCCESS") {
            const { bioFullName } = responseData.response || {};
            return {
                success: true,
                verified: bioFullName === driverName,
                bioFullName,
            };
        } else {
            return {
                success: false,
                message: "Verification failed. Response status is not SUCCESS.",
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error.response ? error.response.data : error.message,
        };
    }
};

module.exports = {
    verifyDriverwithSarthi,
};
