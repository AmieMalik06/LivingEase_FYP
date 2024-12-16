const express = require('express');
const router = express.Router();
const { addCommissionFee } = require ('../controllers/commissionController')

// Route to add a commission fee
router.post('/add', addCommissionFee);

module.exports = router;
