const fs = require('fs');
const path = require('path');

let weights = null;
let scaler = null;

const loadAssets = async () => {
    try {
        if (!weights) {
            const weightsPath = path.join(__dirname, '../models/weights.json');
            weights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
            console.log('Neural Network weights loaded successfully.');
        }

        if (!scaler) {
            const scalerPath = path.join(__dirname, '../models/scaler.json');
            scaler = JSON.parse(fs.readFileSync(scalerPath, 'utf8'));
            console.log('Scaler metadata loaded successfully.');
        }
    } catch (error) {
        console.error('Error loading AI assets:', error);
    }
};

/** Math Utility: Dot Product for 1D inputs and 2D weights with Biases */
const denseLayer = (inputs, W, b, activation) => {
    const outputs = b.map((bias, i) => {
        let sum = bias;
        for (let j = 0; j < inputs.length; j++) {
            sum += inputs[j] * W[j][i];
        }
        return sum;
    });

    if (activation === 'relu') {
        return outputs.map(val => Math.max(0, val));
    }
    if (activation === 'sigmoid') {
        return outputs.map(val => 1 / (1 + Math.exp(-val)));
    }
    return outputs;
};

/**
 * Predicts placement probability using pure JavaScript matrix math natively inside Node.js
 * @param {Object} metrics - The student metrics object
 * @returns {Object} - The prediction and probability
 */
const predictPlacementNative = async (metrics) => {
    // Ensure assets are loaded
    if (!weights || !scaler) {
        await loadAssets();
    }

    if (!weights || !scaler) {
        throw new Error('AI assets could not be loaded in Node.js');
    }

    // 1. Extract values in the exact order the scaler expects
    const { features, mean, scale } = scaler;

    // Default to 0 if missing
    const inputDataArray = features.map(feature => metrics[feature] || 0);

    // 2. Scale the data (StandardScaler logic: (x - mean) / scale)
    const scaledDataArray = inputDataArray.map((val, index) => {
        // Prevent division by zero
        if (scale[index] === 0) return 0;
        return (val - mean[index]) / scale[index];
    });

    // 3. ANN Forward Pass
    // Layer 1: Dense 16, ReLU
    const a1 = denseLayer(scaledDataArray, weights.W1, weights.b1, 'relu');

    // Layer 2: Dense 8, ReLU
    const a2 = denseLayer(a1, weights.W2, weights.b2, 'relu');

    // Layer 3: Dense 1, Sigmoid
    const a3 = denseLayer(a2, weights.W3, weights.b3, 'sigmoid');

    // 4. Extract Final Probability
    const probability = a3[0];
    const placed = probability > 0.5;

    return {
        prediction: placed ? 'Placed' : 'Not Placed',
        probability: probability,
        features_used: features
    };
};

module.exports = {
    loadAssets,
    predictPlacementNative
};
