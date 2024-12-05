const axios = require('axios');
const { getHeaders } = require('./header'); 
const { CONFIG } = require('../constants/config');

/**
 * Fetch details of an e-way bill.
 * @param {string} ewbNo - The e-way bill number.
 * @returns {Promise<object>} - Resolves to the response containing e-way bill details.
 */
const getEwayBillDetails = async (ewbNo) => {
    const url = CONFIG.ULIP_API.EWAY_BILL; 
    
    const data = {
        ewbNo: ewbNo.toString(),
    };

    try {
        const headers = await getHeaders(true); // Get headers with token
        const response = await axios.post(url, data, { headers });

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
    getEwayBillDetails
};
