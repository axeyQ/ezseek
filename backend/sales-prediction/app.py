# backend/sales-prediction/app.py
from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)

# Load the trained model
model = joblib.load('sales_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    day = data['day']
    prediction = model.predict([[day]])
    return jsonify({'prediction': prediction[0]})

if __name__ == '__main__':
    app.run(port=5000)