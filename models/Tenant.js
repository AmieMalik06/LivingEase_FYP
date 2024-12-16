const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  fav: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property', 
    }
  ]
});

module.exports = mongoose.model('Tenant', TenantSchema);