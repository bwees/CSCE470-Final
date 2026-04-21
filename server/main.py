from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import pandas as pd
import json
import os
import uvicorn
from contextlib import asynccontextmanager

# Global variables for model artifacts
artifacts = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    V_PATH = "artifacts/V.npy"
    MAP_PATH = "artifacts/movie_id_mapping.json"
    
    artifacts["V"] = np.load(V_PATH)
    with open(MAP_PATH, "r") as f:
        mapping = json.load(f)
        artifacts["tmdb_to_idx"] = {int(k): int(v) for k, v in mapping.items()}
        artifacts["idx_to_tmdb"] = {v: k for k, v in artifacts["tmdb_to_idx"].items()}
    
    yield
    # Shutdown
    artifacts.clear()

app = FastAPI(title="FilmFinder API", lifespan=lifespan)

class Rating(BaseModel):
    movieId: int  # TMDB id
    rating: float

@app.post("/recommend")
async def recommend(user_input: list[Rating], top_n: int = 10):
    V = artifacts["V"]
    tmdb_to_idx = artifacts["tmdb_to_idx"]

    # Filter and map Input (TMDB id -> contiguous matrix index)
    valid_indices = []
    valid_ratings = []
    for r in user_input:
        if r.movieId in tmdb_to_idx:
            valid_indices.append(tmdb_to_idx[r.movieId])
            valid_ratings.append(r.rating)

    if not valid_indices:
        return {"message": "No recognized movies provided."}

    # Compute user vector
    v_known = V[valid_indices]
    reg = 0.1
    d = V.shape[1]
    A = np.matmul(v_known.T, v_known) + reg * np.eye(d)
    b = np.matmul(v_known.T, valid_ratings)
    u_new = np.linalg.solve(A, b)

    # Score and Filter
    scores = np.matmul(V, u_new)
    scores[valid_indices] = -1e9  # Don't recommend what they just rated

    top_idx = np.argsort(scores)[::-1][:top_n]

    # Return results (movieId is a TMDB id)
    return [
        {
            "movieId": artifacts["idx_to_tmdb"][idx],
            "score": round(float(scores[idx]), 4)
        }
        for idx in top_idx
    ]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)