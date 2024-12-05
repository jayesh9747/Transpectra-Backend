const mongoose = require("mongoose")
const { CONFIG } = require('../constants/config')

const MONGODB_URL = CONFIG.DB.DB_HOST;

exports.connect = async () => {
    try {
        await mongoose.connect(MONGODB_URL)
        console.log(`DB Connection Successful`);
    } catch (err) {
        console.log(`DB Connection Failed`);
        console.log(err);
        process.exit(1);
    }
}