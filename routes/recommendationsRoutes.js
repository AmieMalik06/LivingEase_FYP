// routes/recommendations.js
const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationsController');

// Route to get recommendations for a user
router.post('/recommendations', async (req, res) => {
  const userInput = req.body;  // Get user input from the request body

  // Call the getRecommendations function to interact with Python API
  const recommendations = await getRecommendations(userInput);

  // Return the recommendations in the response
  if (recommendations) {
    res.status(200).json({ recommendations });
  } else {
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
});

module.exports = router;
