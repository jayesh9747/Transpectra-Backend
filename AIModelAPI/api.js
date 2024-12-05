const axios = require("axios");
const { CONFIG } = require("../constants/config");

/**
 * Fetch stock forecast data from the Django API.
 * @param {object} inputData - The request payload for the forecast.
 * @returns {Promise<object>} - The response data from the Django API.
 */
const getStockForecast = async (inputData) => {
  const url = `${CONFIG.DJANGO_URL}/forecast/`;
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, inputData, { headers });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data || error.message,
    };
  }
};

/**
 * Fetch optimized routes from the Django API.
 * @param {object} inputData - The request payload for route optimization.
 * @returns {Promise<object>} - The response data from the Django API.
 */
const getOptimizedRoutes = async (inputData) => {
  const url = `${CONFIG.DJANGO_URL}/routes/`;
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, inputData, { headers });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data || error.message,
    };
  }
};

// Export both functions as part of a single object
module.exports = {
  getStockForecast,
  getOptimizedRoutes,
};
