const express = require('express');
const router = express.Router();
const axios = require('axios');

// Route to get placement prediction from Python Microservice
// POST /api/placement/predict
router.post('/predict', async (req, res) => {
    try {
        const studentMetrics = req.body;

        // Ensure required fields are present
        const requiredFields = ['DSA_Skill', 'GP', 'Internships', 'Active_Backlogs', 'Tenth_Marks', 'Twelfth_Marks'];
        for (const field of requiredFields) {
            if (studentMetrics[field] === undefined) {
                return res.status(400).json({ message: `Missing required metric: ${field}` });
            }
        }

        // Call Native JS TensorFlow prediction engine instead of Python server
        const { predictPlacementNative } = require('../utils/predictPlacement');
        const predictionData = await predictPlacementNative(studentMetrics);

        // Return prediction to the frontend
        res.status(200).json(predictionData);

    } catch (error) {
        console.error('Error getting placement prediction natively:', error);
        res.status(500).json({ message: 'Internal Server Error while calculating placement logic natively.' });
    }
});

module.exports = router;
