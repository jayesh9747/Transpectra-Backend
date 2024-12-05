const bcrypt = require("bcrypt")
const OTP = require("../models/OTP")
const jwt = require("jsonwebtoken")
const otpGenerator = require("otp-generator")
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const User = require("../models/User")
const Profile = require("../models/Profile")
const AvailabilityStatus = require('../models/AvailabilityStatus');
const Store = require('../models/Store');
const DistributionCenter = require('../models/DistributionCenter')
const { msgFunction } = require('../utils/msgFunction')
require("dotenv").config();
const { CONFIG } = require('../constants/config')
const ManufacturingUnit = require("../models/ManufacturingUnit");


// Signup Controller for Registering USers
exports.signup = async (req, res) => {
    try {

        // Destructure fields from the request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
            platform,
            uniqueUnitCode,
            dateOfBirth
        } = req.body;

        console.log(req.body);

        // Check if All Details are there or not
        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !confirmPassword ||
            !otp ||
            !platform ||
            !accountType
        ) {
            return res.status(403).json(
                msgFunction(false, "All Fields are required")
            )
        }
        // Check if password and confirm password match
        if (password !== confirmPassword) {
            return res.status(400).json(
                msgFunction(false, "Password and Confirm Password do not match. Please try again.")
            )
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json(
                msgFunction(false, "User already exists. Please sign in to continue."))
        }

        // Find the most recent OTP for the email
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)
        console.log(response)
        if (response.length === 0) {
            // OTP not found for the email
            return res.status(400).json(
                msgFunction(false, "The OTP is not valid"))
        } else if (otp !== response[0].otp) {
            // Invalid OTP
            return res.status(400).json(
                msgFunction(false, "The OTP is not valid"))
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create the user
        let approved = ""
        approved === "Store_managers" ? (approved = false) : (approved = true)

        // Create the Additional Profile For User
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: contactNumber,
        })
        const user = await User.create({
            firstName,
            lastName,
            email,
            platform,
            password: hashedPassword,
            accountType: accountType,
            approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        if (accountType === CONFIG.ACCOUNT_TYPE.DRIVER) {

            const driverId = user._id;

            if (!uniqueUnitCode) {
                return res.status(403).json(
                    msgFunction(false, "uniqueUnitCode is required")
                )
            }

            const manufacturingUnit = await ManufacturingUnit.findOne({ uniqueUnitCode });

            if (manufacturingUnit.linkedDrivers.includes(driverId)) {
                return res.status(400).json({
                    success: false,
                    message: "Driver is already linked to this manufacturing unit.",
                });
            }

            if (!manufacturingUnit) {
                return res.status(404).json({
                    success: false,
                    message: "Manufacturing unit not found.",
                });
            }

            manufacturingUnit.linkedDrivers.push(driverId);
            await manufacturingUnit.save();

            const availability_status = await AvailabilityStatus.create({
                driver_id: user._id,
                ManufacturingUnitID: manufacturingUnit._id
            })

        }

        let store;
        if (accountType === "Store_managers") {
            store = await Store.create({
                managerName: firstName + " " + lastName,
                managerId: user._id
            })
        }

        if (accountType === CONFIG.ACCOUNT_TYPE.DISTRIBUTION_CENTER) {
            store = await DistributionCenter.create({
                contactInfo: {
                    managerName: firstName + " " + lastName,
                    managerId: user._id,
                    email: email
                }
            })
        }

        return res.status(200).json({
            success: true,
            user,
            store,
            message: "User registered successfully",
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json(
            msgFunction(false, "User cannot be registered. Please try again."))
    }
}

// Login controller for authenticating users
exports.login = async (req, res) => {
    try {
        // Get email and password from request body
        const { email, password, platform } = req.body

        // Check if email or password is missing
        if (!email || !password || !platform) {
            // Return 400 Bad Request status code with error message
            return res.status(400).json(
                msgFunction(false, "Please Fill up All the Required Fields")
            )
        }

        // Find user with provided email
        const user = await User.findOne({ email }).populate("additionalDetails");


        let storeToken = null;
        if (user.accountType === 'Store_managers') {
            const store = await Store.findOne({ managerId: user._id });
            if (store) {
                storeToken = jwt.sign(
                    { id: store._id, type: "Store" },
                    process.env.JWT_SECRET,
                    { expiresIn: "48h" }
                );
            }
        }

        if (user.accountType === CONFIG.ACCOUNT_TYPE.DISTRIBUTION_CENTER) {
            const dis_center = await DistributionCenter.findOne({ 'contactInfo.managerId': user._id });
            if (dis_center) {
                storeToken = jwt.sign(
                    { id: dis_center._id, type: "Distribution Center" },
                    process.env.JWT_SECRET,
                    { expiresIn: "48h" }
                );
            }

        }

        // If user not found with provided email
        if (!user) {
            // Return 401 Unauthorized status code with error message
            return res.status(401).json(
                msgFunction(false, "User is not Registered with Us Please SignUp to Continue"))
        }

        // Generate JWT token and Compare Password
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { email: user.email, id: user._id, account_type: user.accountType, platform: user.platform },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h",
                }
            )

            // Save token to user document in database
            user.token = token
            user.password = undefined
            // Set cookie for token and return success response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: false,
                sameSite: 'None',
            }

            res.cookie("token", token, options);

            if (storeToken) {
                res.cookie("storeToken", storeToken, options);
            }

            res.status(200).json({
                success: true,
                token,
                storeToken,
                user,
                message: `User Login Success`,
            })
            console.log("User Login Success")
        } else {
            return res.status(401).json(
                msgFunction(false, `Password is incorrect`)
            )
        }
    } catch (error) {
        console.error(error)
        // Return 500 Internal Server Error status code with error message
        return res.status(500).json(
            msgFunction(false, `Login Failure Please Try Again`)
        )
    }
}


// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
    try {
        console.log(req.body)
        const { email } = req.body;

        // Check if user is already present
        // Find user with provided email
        const checkUserPresent = await User.findOne({ email });
        // to be used in case of signup

        // If user found with provided email
        if (checkUserPresent) {
            // Return 401 Unauthorized status code with error message
            return res.status(401).json(
                msgFunction(false, `User is Already Registered`)
            );
        }

        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        })
        const result = await OTP.findOne({ otp: otp })
        console.log("Result is Generate OTP Func")
        console.log("OTP", otp)
        console.log("Result", result)
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
            });
            result = await OTP.findOne({ otp: otp });
        }
        const otpPayload = { email, otp };
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP Body", otpBody)
        res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
        })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, error: error.message })
    }
}

// Controller for Changing Password
exports.changePassword = async (req, res) => {
    try {
        // Get user data from req.user
        const userDetails = await User.findById(req.user.id)

        if (userDetails.email === "guest@gmail.com") {
            return res.status(400).json(
                msgFunction(false, "Please don't try to change the password for the Guest Account 🥹")
            )
        }

        // Get old password, new password, and confirm new password from req.body
        const { oldPassword, newPassword } = req.body

        // Validate old password
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        )
        if (!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            return res
                .status(401)
                .json(
                    msgFunction(false, "The password is incorrect")
                )
        }

        // Update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
        )

        // Send notification email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password for your account has been updated",
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            )
            console.log("Email sent successfully:", emailResponse.response)
        } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error)
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            })
        }

        // Return success response
        return res
            .status(200)
            .json({ success: true, message: "Password updated successfully" })
    } catch (error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while updating password:", error)
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        })
    }
}

