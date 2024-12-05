const mongoose = require("mongoose");


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    image_url: {
        type: String,
        trim: true,
    },
    slugs: {
        type: String,
        trim: true
    },
    category_code: {
        type: String,
        trim: true
    }
});


module.exports = mongoose.model("category", categorySchema)