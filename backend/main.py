from fastapi import FastAPI
from app.supabase import sign_up

app = FastAPI(title="Backend")

@app.get("/")
def home():
    return {"status": "hello world"}

@app.get("/signup")
def read_root(email: str, password: str):
    sign_up(email, password)

@app.get("/health")
def health_check():
    return {"status": "ok"}
