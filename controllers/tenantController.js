const Tenant = require("../models/Tenant");
const Property = require("../models/Property");
// Get tenant details by userId
exports.getTenantByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const tenant = await Tenant.findOne({ user: userId }).populate('user'); // Populate the user field
    console.log('getTenantByUserId function called');
    console.log('Request params:', req.params);
    console.log('Request query:', req.query)
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json(tenant); // Return the populated tenant document
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to add a property to tenant's favorites
exports.addFavoriteProperty = async (req, res) => {
  try {
    const tenantId = req.user.id; // Get authenticated tenant's ID from the request
    const { propertyId } = req.body; // Get the property ID from request body

    // Check if the property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Find the tenant's document
    const tenant = await Tenant.findOne({ user: tenantId });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Check if the property is already in the tenant's favorites
    if (tenant.fav.includes(propertyId)) {
      return res.status(400).json({ message: "Property already in favorites" });
    }

    // Add property to tenant's favorites
    tenant.fav.push(propertyId);
    await tenant.save();

    res.status(200).json({
      message: "Property added to favorites successfully",
      favorites: tenant.fav,
    });
  } catch (error) {
    console.error("Error adding favorite property:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to get all favorite properties of the tenant
exports.getFavoriteProperties = async (req, res) => {
  try {
    const tenantId = req.user.id; // Get authenticated tenant's ID from the request

    // Find the tenant's document and populate the favorite properties
    const tenant = await Tenant.findOne({ user: tenantId }).populate("fav");
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.status(200).json({
      message: "Favorites fetched successfully",
      favorites: tenant.fav, // Array of favorite properties
    });
  } catch (error) {
    console.error("Error fetching favorite properties:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to remove a property from tenant's favorites
exports.removeFavoriteProperty = async (req, res) => {
  try {
    const tenantId = req.user.id; // Get authenticated tenant's ID from the request
    const { propertyId } = req.body; // Get the property ID from request body

    // Find the tenant's document
    const tenant = await Tenant.findOne({ user: tenantId });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Check if the property exists in favorites
    const index = tenant.fav.indexOf(propertyId);
    if (index === -1) {
      return res.status(400).json({ message: "Property not in favorites" });
    }

    // Remove the property from favorites
    tenant.fav.splice(index, 1);
    await tenant.save();

    res.status(200).json({
      message: "Property removed from favorites successfully",
      favorites: tenant.fav,
    });
  } catch (error) {
    console.error("Error removing favorite property:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
// Controller to check if a specific property is a favorite
exports.isFavoriteProperty = async (req, res) => {
  try {
    const tenantId = req.user.id; // Get authenticated tenant's ID from the request
    const { propertyId } = req.params; // Get the property ID from request parameters

    // Find the tenant's document
    const tenant = await Tenant.findOne({ user: tenantId });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Check if the property is in the tenant's favorites
    const isFavorited = tenant.fav.includes(propertyId);

    res.status(200).json({
      message: "Favorite status fetched successfully",
      isFavorited,
    });
  } catch (error) {
    console.error("Error checking favorite status:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
