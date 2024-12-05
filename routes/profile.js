const express = require("express")
const router = express.Router();
const Joi = require('joi');
const validateWith = require('../middleware/validation')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {auth} = require('../middleware/auth')
const { 
    profile, 
    deleteAccount, 
    updateProfilePicture, 
    updateInventorySheet,
    updateDetails 
} = require('../controllers/profile');

endpoint = {
    PROFILE: "/details"
}
/**
 * 
 * Purpose : delete account
 * 
 * URL : /api/v1/profile/delete
 * 
 * Testing : Done
 * */ 
router.delete('/delete',deleteAccount);

/**
 * 
 * Purpose : update profile image
 * 
 * URL : /api/v1/profile/update-picture
 * 
 * Testing : Done
 * */ 
router.post('/update-picture', updateProfilePicture);


/**
 * 
 * Purpose : update inventory excel sheet
 * 
 * URL : /api/v1/profile/update-inventory
 * 
 * Testing : Done
 * */ 
router.post('/update-inventory', upload.single('file'),updateInventorySheet);

/**
 * 
 * Purpose : update details(manufacturingUnit and warehouse)
 * 
 * URL : /api/v1/profile/update-details
 * 
 * Testing : Done
 * */ 
router.post('/update-details', updateDetails);

// Route for the fetching the profile
router.get(endpoint.PROFILE,auth, profile);


// Export the router for use in the main application
module.exports = router