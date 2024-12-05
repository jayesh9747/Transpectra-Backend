const axios = require("axios");
const jwt = require("jsonwebtoken");
const { CONFIG } = require("../constants/config");

// Configuration constants
const AUTH_URL = CONFIG.ULIP.url;
const USERNAME = CONFIG.ULIP.username;
const PASSWORD = CONFIG.ULIP.password;

// Global token variable
let token = null;

/**
 * Validate the token's properties based on the payload.
 * @returns {boolean} - True if the token is valid; otherwise, false.
 */
const isTokenValid = () => {
    if (!token) return false;

    try {
        const decoded = jwt.decode(token);
        if (!decoded) return false;

        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

        // Validate 'iat' (issued at) and ensure it's not in the future
        if (!decoded.iat || decoded.iat > currentTime) {
            console.error("Invalid 'iat' in token.");
            return false;
        }

        const oneDayInSeconds = 60 * 60 * 24;
        if (currentTime > decoded.iat + oneDayInSeconds) {
            console.error("Token expired: 'iat' is more than 1 day ago.");
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error decoding token:", err);
        return false;
    }
};

/**
 * Fetch a new authentication token from the API.
 * @returns {Promise<string>} - Resolves to the token or an empty string if failed.
 */
const fetchToken = async () => {
    try {
        const response = await axios.post(
            AUTH_URL,
            { username: USERNAME, password: PASSWORD },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        const newToken = response?.data?.response?.id || "";
        token = newToken; // Update the global token
        return newToken;
    } catch (error) {
        console.error("Error fetching token:", error.message);
        return ""; // Return an empty string on failure
    }
};

/**
 * Get headers for API requests.
 * @param {boolean} isTokenRequired - Whether the token is required in the headers.
 * @returns {Promise<object>} - Resolves to the headers object.
 */
const getHeaders = async (isTokenRequired = true) => {
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (isTokenRequired) {
        try {
            if (!isTokenValid()) {
                console.log("Token is invalid or expired. Attempting to fetch a new token...");
                await fetchToken(); // Fetch a new token if invalid
            }

            headers["Authorization"] = token ? `Bearer ${token}` : ""; // Add token or empty string
        } catch (error) {
            console.error("Error handling token fetch:", error.message);
            headers["Authorization"] = ""; // Ensure Authorization is an empty string if an error occurs
        }
    }

    return headers; // Return headers regardless of token fetch status
};

module.exports = {
    getHeaders,
};
