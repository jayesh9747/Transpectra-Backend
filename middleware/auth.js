// Importing required modules
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { CONFIG } = require('../constants/config');
const Store = require('../models/Store');
const DistributionCenter = require('../models/DistributionCenter')


// This function is used as middleware to authenticate user requests
exports.auth = async (req, res, next) => {
    try {
        // Extracting JWT from request cookies, body or header

        const token =
            req.cookies.token ||
            req.body.token ||
            req.header("Authorization").replace("Bearer ", "");

        // const storeToken =
        //     req.cookies.storeToken ||
        //     req.body.storeToken ||
        //     req.header("Store-X-token").replace("Bearer ", "");

        //     console.log("this is cookie",req.cookies)
             

        // If JWT is missing, return 401 Unauthorized response
        if (!token) {
            return res.status(401).json({ success: false, message: `Token Missing` });
        }


        try {
            // Verifying the JWT using the secret key stored in environment variables
            const decode = await jwt.verify(token, CONFIG.JWT.TOKEN);
            // const storedecode = await jwt.verify(storeToken, CONFIG.JWT.TOKEN);

            // Storing the decoded JWT payload in the request object for further use
            req.user = decode;
            // req.store = storedecode;
        } catch (error) {
            // If JWT verification fails, return 401 Unauthorized response
            return res
                .status(401)
                .json({ success: false, message: "token is invalid" });
        }

        // If JWT is valid, move on to the next middleware or request handler
        next();
    } catch (error) {
        // If there is an error during the authentication process, return 401 Unauthorized response
        return res.status(401).json({
            success: false,
            message: `Something Went Wrong While Validating the Token`,
        });
    }
};

exports.isDriver = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email });

        if (userDetails.accountType !== CONFIG.ACCOUNT_TYPE.DRIVER) {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for Drivers",
            });
        }
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: `User Role Can't be Verified` });
    }
};

exports.isStoreManager = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email });

        if (userDetails.accountType !== CONFIG.ACCOUNT_TYPE.STORE) {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for StoreManger",
            });
        }
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: `User Role Can't be Verified` });
    }
};

exports.isDistributionCenterManager = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email });
        console.log(userDetails);

        console.log(userDetails.accountType);

        if (userDetails.accountType !== CONFIG.ACCOUNT_TYPE.DISTRIBUTION_CENTER) {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for Distribution Center Manager",
            });
        }
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: `User Role Can't be Verified` });
    }
};

exports.isStore = async (req, res, next) => {
    try {
        const StoreDetails = await Store.findById(req.store.id);

        if (StoreDetails.type !== CONFIG.ACCOUNT_TYPE.DRIVER) {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for Drivers",
            });
        }
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: `User Role Can't be Verified` });
    }
};

exports.isDistributionCenter = async (req, res, next) => {
    try {
        const userDetails = await DistributionCenter.findOne({ email: req.user.email });

        if (userDetails.accountType !== CONFIG.ACCOUNT_TYPE.DRIVER) {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for Drivers",
            });
        }
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: `User Role Can't be Verified` });
    }
};