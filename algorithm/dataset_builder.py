# Import ../data/movielens/ml-32m/ratings.csv

# pull a subset of 100k ratings for faster training
import pandas as pd
import json

df = pd.read_csv("../data/movielens/ml-32m/ratings.csv")

# exclude the first 100 users to use for testing later
df = df[df["userId"] > 100]

df_subset = df.sample(n=100000, random_state=42)

# find unique userIds and movieIds in the subset
unique_user_ids = df_subset["userId"].unique()
unique_movie_ids = df_subset["movieId"].unique()

# reindex userIds and movieIds to be contiguous integers starting from 0
# this makes smaller matrices for training and inference
user_id_mapping = {int(old_id): int(new_id) for new_id, old_id in enumerate(unique_user_ids)}
movie_id_mapping = {int(old_id): int(new_id) for new_id, old_id in enumerate(unique_movie_ids)}
df_subset["userId"] = df_subset["userId"].map(user_id_mapping)
df_subset["movieId"] = df_subset["movieId"].map(movie_id_mapping)

df_subset.to_csv("../data/movielens/ml-32m/ratings_subset.csv", index=False)

# output movie_id_mapping for inference
with open("../data/movielens/ml-32m/movie_id_mapping.json", "w") as f:
    json.dump(movie_id_mapping, f)