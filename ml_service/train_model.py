import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pickle
import os

print("Generating synthetic data (mimicking a Kaggle dropout dataset)...")
# Note: For this production MVP, we use a synthetic dataset to represent
# public dataset training, ensuring no actual government PII is used.
np.random.seed(42)
n_samples = 1000

data = {
    'age': np.random.randint(18, 50, n_samples),
    'gender': np.random.choice(['Male', 'Female'], n_samples),
    'education_level': np.random.choice(['High School', 'Bachelor', 'Diploma'], n_samples),
    'past_experience_years': np.random.randint(0, 10, n_samples),
    'attendance_rate': np.random.uniform(40, 100, n_samples),
    'distance_to_center_km': np.random.uniform(1, 50, n_samples),
}

df = pd.DataFrame(data)

# Simulate risk of dropping out based on attendance and distance
dropout_prob = (
    (100 - df['attendance_rate']) * 0.5 + 
    (df['distance_to_center_km']) * 0.3 + 
    np.random.normal(0, 10, n_samples)
)
df['is_dropout'] = (dropout_prob > 40).astype(int)

print(f"Generated {n_samples} samples. Dropout rate: {df['is_dropout'].mean():.2f}")

# Preprocessing
le_gender = LabelEncoder()
df['gender'] = le_gender.fit_transform(df['gender'])

le_edu = LabelEncoder()
df['education_level'] = le_edu.fit_transform(df['education_level'])

X = df.drop('is_dropout', axis=1)
y = df['is_dropout']

print("Training Random Forest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

print("Saving model and encoders...")
os.makedirs('model', exist_ok=True)
with open('model/rf_model.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('model/le_gender.pkl', 'wb') as f:
    pickle.dump(le_gender, f)
with open('model/le_edu.pkl', 'wb') as f:
    pickle.dump(le_edu, f)

print("Training complete.")
