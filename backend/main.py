from fastapi import FastAPI
from sqlalchemy import text
from database import engine, Base
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Healthtech Knowledge Base API")

@app.get("/")
def read_root():
    return {"message": "Healthtech Knowledge Base API is running"}

@app.get("/db-check")
def db_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"database_connected": True, "result": result.scalar()}