from fastapi import FastAPI
from app.supabase import sign_up

app = FastAPI(title="Backend")

@app.get("/")
def home():
    return {"status": "hello world"}

#need some sort of validation for role so only patient or doctor can sign up
@app.post("/signup")
def read_root(email: str, password: str, full_name: str, role: str):
    sign_up(email, password, full_name, role)

@app.get("/health")
def health_check():
    return {"status": "ok"}
