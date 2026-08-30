import os
import pickle
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Trainee Risk ML Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and encoders relative to this script directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'model')

model = None
le_gender = None
le_edu = None

try:
    with open(os.path.join(MODEL_DIR, 'rf_model.pkl'), 'rb') as f:
        model = pickle.load(f)
    with open(os.path.join(MODEL_DIR, 'le_gender.pkl'), 'rb') as f:
        le_gender = pickle.load(f)
    with open(os.path.join(MODEL_DIR, 'le_edu.pkl'), 'rb') as f:
        le_edu = pickle.load(f)
    print("[ML Service] Trained Random Forest models and encoders loaded successfully.")
except Exception as e:
    print(f"[ML Service] Warning: Model loading failed: {e}")
    model = None

class TraineeFeatures(BaseModel):
    age: int
    gender: str
    education_level: str
    past_experience_years: int
    attendance_rate: float
    distance_to_center_km: float

@app.get("/")
def root():
    return {
        "service": "MahaSkills AI Trainee Risk Prediction Service",
        "status": "online",
        "model_loaded": model is not None
    }

@app.get("/health")
def health():
    if model is None:
        return {"status": "degraded", "message": "Model not loaded"}
    return {"status": "ok", "service": "trainee-risk-ml"}

@app.post("/predict")
def predict_risk(features: TraineeFeatures):
    if model is None:
        raise HTTPException(status_code=503, detail="ML Model is not currently loaded on the server")
    
    try:
        gender_enc = le_gender.transform([features.gender])[0]
    except Exception:
        gender_enc = 0  # default fallback
        
    try:
        edu_enc = le_edu.transform([features.education_level])[0]
    except Exception:
        edu_enc = 0  # default fallback

    # Create DataFrame
    df = pd.DataFrame([{
        'age': features.age,
        'gender': gender_enc,
        'education_level': edu_enc,
        'past_experience_years': features.past_experience_years,
        'attendance_rate': features.attendance_rate,
        'distance_to_center_km': features.distance_to_center_km
    }])

    # Predict probability of dropout (class 1)
    dropout_prob = float(model.predict_proba(df)[0][1])

    return {
        "risk_score": float(dropout_prob * 100),
        "risk_level": "High" if dropout_prob > 0.6 else "Medium" if dropout_prob > 0.3 else "Low"
    }
