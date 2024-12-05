const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const { msgFunction } = require('../utils/msgFunction');
const { CONFIG } = require('../constants/config');

exports.resetPasswordToken = async (req, res) => {
    try {
        const email = req.body.email
        const user = await User.findOne({ email: email })
        if (!user) {
            return res.json(
                msgFunction(false, `This Email: ${email} is not Registered With Us Enter a Valid Email `))
        }

        if (user.email === "guest@gmail.com") {
            return res.status(400).json(
                msgFunction(false, "Please don't try to reset the password for the Guest Account 🥹")
            )
        }

        const token = crypto.randomBytes(20).toString("hex")

        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 3600000,
            },
            { new: true }
        )
        console.log("DETAILS", updatedDetails)

        const url = `${CONFIG.HOST.web}/update-password/${token}`
        //const url = `https://studynotion-edtech-project.vercel.app/update-password/${token}`

        await mailSender(
            email,
            "Password Reset",
            `Your Link for email verification is ${url}. Please click this url to reset your password.`
        );

        res.json({
            success: true,
            message:
                "Email Sent Successfully, Please Check Your Email to Continue Further",
        })
    } catch (error) {
        return res.json({
            error: error.message,
            success: false,
            message: `Some Error in Sending the Reset Message`,
        })
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body

        if (confirmPassword !== password) {
            return res.json(
                msgFunction(false, "Password and Confirm Password Does not Match")
            )
        }
        const userDetails = await User.findOne({ token: token })
        if (!userDetails) {
            return res.json(
                msgFunction(false, "Token is Invalid"))
        }

        if (userDetails.email === "guest@gmail.com") {
            return res.status(400).json(
                msgFunction(false, "Please don't try to reset the password for the Guest Account 🥹")
            )
        }

        if (!(userDetails.resetPasswordExpires > Date.now())) {
            return res.status(403).json(
                msgFunction(false, `Token is Expired, Please Regenerate Your Token`)
            )
        }
        const encryptedPassword = await bcrypt.hash(password, 10)
        await User.findOneAndUpdate(
            { token: token },
            { password: encryptedPassword },
            { new: true }
        )
        res.json({
            success: true,
            message: `Password Reset Successful`,
        })
    } catch (error) {
        return res.json({
            error: error.message,
            success: false,
            message: `Some Error in Updating the Password`,
        })
    }
}