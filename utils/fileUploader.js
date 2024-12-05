const cloudinary = require("cloudinary").v2;

exports.uploadFileToCloudinary = async (file, folder) => {
  try {
    if (!file || !file.path) {
      throw new Error("Invalid file input: file or file.path is missing");
    }

    const options = {
      folder,
      resource_type: "raw", // Keep resource type as "raw" for non-image files
      type: "authenticated", // Mark the file as private
    };

    console.log("Uploading file with options:", options);

    const result = await cloudinary.uploader.upload(file.path, options);
    console.log("Upload Successful:", result);

    // Return the public_id for signed URL generation
    return { public_id: result.public_id };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};
