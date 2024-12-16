// routes/bidRoutes.js
const express = require('express');
const { placeBid ,getBidsForRequest} = require('../controllers/bidController');
const router = express.Router();

// Route to place a bid
router.post('/place-bid', placeBid);
// Route to get all bids for a specific maintenance request
router.get('/bids/:maintenanceRequestId', getBidsForRequest);
module.exports = router;
