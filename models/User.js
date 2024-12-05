const { required } = require('joi');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        accountType: {
            type: String,
            enum: ["Supplier", "Warehouse_Manager", "Driver", "Yard_managers"],
            required: true,
        },
        active: {
            type: Boolean,
            default: true,
        },
        approved: {
            type: Boolean,
            default: true,
        },
        additionalDetails: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Profile",
        },
        LinkedWarehouseID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
        },
        LinkedManufacturingUnitID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ManufacturingUnit",
        },
        LinkedYardID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Yard",
        },
        token: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        image: {
            type: String,
        },
        platform: {
            type: String,
            enum: ["web", "android", "ios"],
            required: true
        },
        verifiedDriver: {
            type: Boolean,
            default: false, // Default to false for all new driver accounts
            required: function () {
                return this.accountType === "Driver";
            },
        },
        verifiedVahan: {
            type: Boolean,
            default: false, // Default to false for all new driver accounts
            required: function () {
                return this.accountType === "Driver";
            },
        },
    },
    { timestamps: true }
)
const User = mongoose.model('user', UserSchema);

module.exports = User;