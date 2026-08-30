from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import pandas as pd

app = FastAPI(title="Trainee Risk ML Service")

# Load model and encoders at startup
try:
    with open('model/rf_model.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('model/le_gender.pkl', 'rb') as f:
        le_gender = pickle.load(f)
    with open('model/le_edu.pkl', 'rb') as f:
        le_edu = pickle.load(f)
except FileNotFoundError:
    model = None

class TraineeFeatures(BaseModel):
    age: int
    gender: str
    education_level: str
    past_experience_years: int
    attendance_rate: float
    distance_to_center_km: float

@app.get("/health")
def health():
    if model is None:
        return {"status": "degraded", "message": "Model not loaded"}
    return {"status": "ok"}

@app.post("/predict")
def predict_risk(features: TraineeFeatures):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")
    
    try:
        # Preprocess
        gender_enc = le_gender.transform([features.gender])[0]
    except ValueError:
        gender_enc = 0 # default fallback
        
    try:
        edu_enc = le_edu.transform([features.education_level])[0]
    except ValueError:
        edu_enc = 0 # default fallback

    # Create DataFrame
    df = pd.DataFrame([{
        'age': features.age,
        'gender': gender_enc,
        'education_level': edu_enc,
        'past_experience_years': features.past_experience_years,
        'attendance_rate': features.attendance_rate,
        'distance_to_center_km': features.distance_to_center_km
    }])

    # Predict probability of dropout
    dropout_prob = model.predict_proba(df)[0][1] # Probability of class 1 (dropout)

    return {
        "risk_score": float(dropout_prob * 100),
        "risk_level": "High" if dropout_prob > 0.6 else "Medium" if dropout_prob > 0.3 else "Low"
    }
