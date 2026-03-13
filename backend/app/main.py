from fastapi import FastAPI

app = FastAPI(title="Copylight Agent API")

@app.get("/")
async def root():
    return {"message": "Copylight Agent Backend API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
