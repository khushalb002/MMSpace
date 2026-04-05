const express = require('express');
const router = express.Router();

const withHttpScheme = (serviceUrl) => {
    if (!serviceUrl) return null;
    const trimmedUrl = serviceUrl.trim().replace(/\/+$/, '');
    if (!trimmedUrl) return null;

    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
    }

    return `http://${trimmedUrl}`;
};

const getPythonServiceUrl = () => {
    const directServiceUrl = withHttpScheme(process.env.ML_SERVICE_URL);
    if (directServiceUrl) return directServiceUrl;

    const internalServiceHostPort = withHttpScheme(process.env.ML_SERVICE_HOSTPORT);
    if (internalServiceHostPort) return internalServiceHostPort;

    return 'http://localhost:8000';
};

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

        // Call Python microservice.
        // ML_SERVICE_URL can be a full URL (https://...)
        // ML_SERVICE_HOSTPORT can be an internal Render host:port pair.
        const pythonServiceUrl = getPythonServiceUrl();

        const response = await fetch(`${pythonServiceUrl}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentMetrics),
        });

        let responseData;
        try {
            responseData = await response.json();
        } catch (parseError) {
            responseData = { message: 'Invalid response from ML service' };
        }

        if (!response.ok) {
            return res.status(response.status).json(responseData);
        }

        // Return prediction to the frontend
        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error getting placement prediction:', error.message);
        res.status(500).json({ message: 'Internal Server Error while connecting to ML service' });
    }
});

module.exports = router;
