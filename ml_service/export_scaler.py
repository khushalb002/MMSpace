import os
import pickle
import json

def export_scaler():
    # Load pickle
    metadata_path = 'models/scaler.pkl'
    try:
        with open(metadata_path, 'rb') as f:
            metadata = pickle.load(f)
            scaler = metadata['scaler']
            features = metadata['features']
            
            # The StandardScaler has mean_ and scale_ 
            # We can extract them as standard python lists
            scaler_json = {
                "features": features,
                "mean": scaler.mean_.tolist(),
                "scale": scaler.scale_.tolist()
            }
            
            # Export to the Node server
            os.makedirs('../server/models', exist_ok=True)
            with open('../server/models/scaler.json', 'w') as out_f:
                json.dump(scaler_json, out_f, indent=4)
                
            print("Successfully exported scaler metadata to ../server/models/scaler.json")
    except Exception as e:
        print(f"Error exporting scaler: {e}")

if __name__ == "__main__":
    export_scaler()
