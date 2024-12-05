const cloudinary = require("cloudinary").v2; // Cloudinary is being required and version is specified
const { CONFIG } = require('../constants/config')

exports.cloudinaryConnect = () => {
    try {
        //Configuring the Cloudinary to Upload MEDIA 
        cloudinary.config({
            cloud_name: CONFIG.KEYS.CLOUDINARY.CLOUD_NAME,
            api_key: CONFIG.KEYS.CLOUDINARY.API_KEY,
            api_secret: CONFIG.KEYS.CLOUDINARY.API_SECRET,
        });
    } catch (error) {
        console.log(error);
    }
};