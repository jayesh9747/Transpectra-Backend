const cloudinary = require("cloudinary").v2;

// Utility function for uploading PDFs to Cloudinary
exports.uploadPdfToCloudinary = async (filePath, folder) => {
    if (!filePath) {
        throw new Error("Invalid file input: file or file.path is missing");
    }

    const options = {
        folder,
        resource_type: "raw", // Use 'raw' for non-image files like PDFs
    };

    try {
        const result = await cloudinary.uploader.upload(filePath, options);
        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Failed to upload PDF to Cloudinary.");
    }
};
