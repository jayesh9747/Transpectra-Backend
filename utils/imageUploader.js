const cloudinary = require("cloudinary").v2;

// Ensure this utility function is only responsible for uploading images
exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    if (!file || !file.path) {
        throw new Error("Invalid file input: file or file.path is missing");
    }

    const options = { folder };
    if (height) options.height = height;
    if (quality) options.quality = quality;
    options.resource_type = "auto";

    console.log("OPTIONS", options);

    try {
        const result = await cloudinary.uploader.upload(file.path, options);
        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};
