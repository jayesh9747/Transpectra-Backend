const { getOptimizedRoutes } = require("/server/AIModelAPI/api");

/**
 * Handles the route optimization request.
 * @param {object} req - The request object from the client.
 * @param {object} res - The response object to the client.
 */
exports.getRoutes = async (req, res) => {
  try {
    const inputData = req.body; // Retrieve data from the request body

    // Call the service to fetch optimized routes
    const result = await getOptimizedRoutes(inputData);

    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to process the route optimization request",
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error in Route Optimization Controller:", error.message);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};
