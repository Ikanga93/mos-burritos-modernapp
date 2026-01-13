from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/health")
@app.get("/api/health")
async def health():
    return JSONResponse(content={
        "status": "healthy",
        "message": "Minimal FastAPI works on Vercel!",
        "service": "Mo's Burritos API - Minimal Test"
    })

@app.get("/")
async def root():
    return JSONResponse(content={
        "message": "API Root - Minimal Test",
        "endpoints": ["/health", "/api/health"]
    })

handler = app
