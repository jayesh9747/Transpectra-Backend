const { CONFIG } = require('../constants/config');
const axios = require('axios');
const { getHeaders } = require('./header')

/**
 * Fetch vehicle registration details from Vahan.
 * @param {string} vehiclenumber - The vehicle number (registration number).
 * @param {string} ownername - The name of the vehicle owner.
 * @param {string} chasisnumber - The vehicle's chassis number.
 * @param {string} enginenumber - The vehicle's engine number.
 * @returns {Promise<object>} - Vehicle registration details response.
 */
const verifyVehiclewithVahan = async (vehiclenumber, ownername, chasisnumber, enginenumber) => {
    const url = CONFIG.ULIP_API.VAHAN; 
    const data = {
        vehiclenumber: vehiclenumber.toString(),
        ownername: ownername,
        chasisnumber: chasisnumber,
        enginenumber: enginenumber,
    };

    try {
        const headers = await getHeaders(true);
        const response = await axios.post(url, data, { headers });

        const responseData = response.data;
        if (responseData.code === "200" && responseData.error === "false" && responseData.responseStatus === "SUCCESS") {
            const verificationResult = responseData.response[0].response;
            const failedFields = [];

            if (verificationResult.enginenumber !== "Verified") {
                failedFields.push("enginenumber");
            }
            if (verificationResult.chasisnumber !== "Verified") {
                failedFields.push("chasisnumber");
            }
            if (verificationResult.ownername !== "Verified") {
                failedFields.push("ownername");
            }

            if (failedFields.length === 0) {
                return { success: true, verified: true };
            } else {
                return {
                    success: true,
                    verified: false,
                    failedFields,
                };
            }
        } else {
            return {
                success: false,
                message: responseData.message || "Unknown error occurred",
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error.response ? error.response.data : error.message,
        };
    }
};

module.exports = { verifyVehiclewithVahan };
