import numpy as np
import pandas as pd
from tqdm import tqdm

def train_mf(df, d=20, epochs=10):
    user_ids = df["userId"].to_numpy(dtype=np.int32)
    item_ids = df["movieId"].to_numpy(dtype=np.int32)
    ratings  = df["rating"].to_numpy(dtype=np.float64)

    num_users = max(user_ids) + 1
    num_items = max(item_ids) + 1

    # Initialize latent factors with random values, d is the number of latent dimensions.
    U = np.random.rand(num_users, d).astype(np.float64)
    V = np.random.rand(num_items, d).astype(np.float64)

    # Training loop iterates for a specified number of epochs
    for e in range(epochs):
        # Shuffle data before each epoch
        idx = np.random.permutation(len(ratings))
        sq_error_sum = 0.0

        # stochastic gradient descent
        for row in tqdm(idx, desc=f"Epoch {e+1}/{epochs}", leave=False):
            u = user_ids[row]
            v = item_ids[row]
            rating = ratings[row]

            # Get current prediction vectors.
            u_pred = U[u].copy()
            v_pred = V[v].copy()

            # Objective (observed-only): A_ij - <U_i, V_j>)^2
            prediction = u_pred.dot(v_pred)
            err = rating - prediction

            # Track total error for RMSE calculation
            sq_error_sum += err * err

            # SGD optimize
            learning_rate = 0.01
            du = learning_rate * err * v_pred
            dv = learning_rate * err * u_pred

            # Apply the updates to the user and item vectors
            U[u] = u_pred + du
            V[v] = v_pred + dv

        # Compute RMSE for the epoch and print it
        rmse = np.sqrt(sq_error_sum / len(ratings))
        tqdm.write(f"Epoch {e+1}/{epochs} | RMSE: {rmse:.6f}")

    return V

df = pd.read_csv("../data/movielens/ml-32m/ratings_subset.csv")

V = train_mf(df, epochs=200, d=25)
np.save("V.npy", V)