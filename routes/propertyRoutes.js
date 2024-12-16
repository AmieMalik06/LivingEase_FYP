const express = require('express');
const router = express.Router();
const { addProperty, addPropertyController,updateProperty,setRentedByController,getRentedPropertyByTenantIdController,updatePropertyController,changePropertyStatusToRentedController,searchProperties,getPropertiesByOwnerController,getPropertyByIdController ,deletePropertyController,getPropertiesByUserController,searchPropertiesByIds} = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
//Route to search properties
router.get('/search', searchProperties);
//Add Property
router.post('/', protect, addProperty, addPropertyController);
//Update Property
router.put('/:propertyId', protect,updateProperty, updatePropertyController);
//Delete Property
router.delete('/:propertyId', protect, deletePropertyController);
// Get properties of current user
router.get('/owner', protect, getPropertiesByUserController);
// Route to get properties by owner's ID
router.get('/properties/owner/:ownerId', getPropertiesByOwnerController);
// Route to get property by ID
router.get('/:propertyId', getPropertyByIdController);
// Route to change property status to 'rented'
router.put("/:propertyId/status/rented", protect,changePropertyStatusToRentedController);
// Route to associate a tenant with a property
router.post("/setRentedBy", protect,setRentedByController);
// Route to get rented property by tenant ID
router.get("/:tenantId/rented-property", getRentedPropertyByTenantIdController);
// Define route to search properties by their IDs
router.post('/search/properties', searchPropertiesByIds); // Use POST for passing an array in the body
module.exports = router;
