from fastapi import FastAPI

app = FastAPI(title="Healthtech Knowledge Base API")

@app.get("/")
def read_root():
    return {"message": "Healthtech Knowledge Base API is running"}