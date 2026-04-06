import numpy as np
import pandas as pd
import json

# Use model data and user ratings to create a profile vector for the unseen user
def create_user_vector(V, user, reg=0.1):
    d = V.shape[1]
    A = np.matmul(np.transpose(V), V) + reg * np.eye(d)
    b = np.matmul(np.transpose(V), user)
    return np.linalg.solve(A, b)

def recommend_for_new_user(top_n):
    # Load the data
    user_watchlist = pd.read_csv("test.csv")
    movies_reference = pd.read_csv("data/movielens/ml-32m/movies.csv")
    V = np.load("V.npy")

    id_to_index = json.load(open("data/movielens/ml-32m/movie_id_mapping.json"))
    id_to_index = {int(k): int(v) for k, v in id_to_index.items()}
    index_to_id = {v: k for k, v in id_to_index.items()}

	# convert user movieIds to indices in the V matrix and get their ratings
    known_indices = user_watchlist["movieId"].map(id_to_index)
    known_ratings = user_watchlist["rating"]

    # Calculate new user's profile vector
    v_known = V[known_indices]
    u_new = create_user_vector(v_known, known_ratings)

    # Predict scores for all movies
    scores = np.matmul(V, u_new)
    
    # If a user has seen a movie, don't recommend it
    scores[known_indices] = 0

    # Get top N highest-scoring movies
    top_idx = np.argsort(scores)[::-1][:top_n]
    
    # Output with movie titles and predicted ratings
    rec_df = pd.DataFrame({
        "movieId": [index_to_id[top] for top in top_idx],
        "predicted_rating": scores[top_idx]
    })
    
    rec_df = rec_df.merge(movies_reference, on="movieId", how="left")
    
    return rec_df[["movieId", "title", "predicted_rating", "genres"]]


def main():
    rec_df = recommend_for_new_user(top_n=10)

    print("Top recommendations:")
    print(rec_df.to_string(index=False))

    rec_df.to_csv("recommendations.csv", index=False)
    print("Saved recommendations to recommendations.csv")


if __name__ == "__main__":
    main()