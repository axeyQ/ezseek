from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Load the trained model
model = joblib.load('sales_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        day = data['day']
        
        # Make prediction
        prediction = model.predict([[day]])
        
        # Add some randomness for demo if needed
        prediction = float(prediction[0])
        
        return jsonify({
            'prediction': prediction,
            'success': True
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

if __name__ == '__main__':
    app.run(port=5000)