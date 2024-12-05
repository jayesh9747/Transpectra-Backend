const mongoose = require("mongoose");
const { CONFIG } = require('../constants/config');

const profileSchema = new mongoose.Schema({
    gender: {
        type: String,
    },
    dateOfBirth: {
        type: String,
    },
    about: {
        type: String,
        trim: true,
    },
    contactNumber: {
        type: Number,
        trim: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    address: {
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        postalCode: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
    },
    experienceYears: {
        type: Number,
    },
    dlnumber: {
        type: String,
        trim: true,
    },
    chasisnumber: {
        type: String,
        trim: true,
    },
    enginenumber: {
        type: String,
        trim: true,
    },
});

module.exports = mongoose.model("Profile", profileSchema);