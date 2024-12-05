// Import the required modules
const express = require("express")
const router = express.Router();
const Joi = require('joi');
const validateWith = require('../middleware/validation')

// Import the required controllers and middleware functions
const {
    login,
    signup,
    sendotp,
    changePassword,
    profile
} = require("../controllers/Auth")
const {
    resetPasswordToken,
    resetPassword,
} = require("../controllers/resetPassword")

const { auth } = require("../middleware/auth")

endpoint = {
    LOG_IN: "/login",
    SIGN_UP: "/signup",
    SEND_OTP: "/sendotp",
    CHANGE_PASSWORD: "/changepassword",
    RESET_PASSWORD_TOKEN: "/reset-password-token",
    RESET_PASSWORD: "/reset-password",
}


// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************


// Route for user login
router.post(endpoint.LOG_IN, login)

router.post(endpoint.SIGN_UP, signup);

// Route for sending OTP to the user's email
router.post(endpoint.SEND_OTP, sendotp);



// Route for Changing the password
router.post(endpoint.CHANGE_PASSWORD, auth, changePassword);

// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************

// Route for generating a reset password token
router.post(endpoint.RESET_PASSWORD_TOKEN, resetPasswordToken)

// Route for resetting user's password after verification
router.post(endpoint.RESET_PASSWORD, resetPassword)

// Export the router for use in the main application
module.exports = router