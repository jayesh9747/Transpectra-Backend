const { getStockForecast } = require("../AIModelAPI/api");

/**
 * Handles the stock forecast request.
 * @param {object} req - The request object from the client.
 * @param {object} res - The response object to the client.
 */
exports.getForecast = async (req, res) => {
  try {
    const inputData = req.body; // Data from the request body

    // Call the service to fetch the stock forecast data
    const result = await getStockForecast(inputData);

    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to process the stock forecast request",
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error in Stock Forecast Controller:", error.message);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};
