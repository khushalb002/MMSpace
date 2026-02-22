import json
import os
import tensorflow as tf

def export_weights():
    # Load the Keras model
    model_path = 'models/placement_ann.keras'
    model = tf.keras.models.load_model(model_path)
    
    weights_dict = {}
    
    # Extract weights for Dense layers only
    # Layer 0 is Dense(16), Layer 1 is Dropout, Layer 2 is Dense(8), Layer 3 is Dropout, Layer 4 is Dense(1)
    dense_count = 1
    for layer in model.layers:
        if isinstance(layer, tf.keras.layers.Dense):
            w, b = layer.get_weights()
            weights_dict[f'W{dense_count}'] = w.tolist()
            weights_dict[f'b{dense_count}'] = b.tolist()
            dense_count += 1
            
    # Export to JSON
    out_dir = '../server/models'
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'weights.json'), 'w') as f:
        json.dump(weights_dict, f, indent=4)
        
    print(f"Successfully exported {dense_count-1} Dense layers to weights.json")

if __name__ == "__main__":
    export_weights()
