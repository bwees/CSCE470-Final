# pull a subset of users with their full rating histories for faster training
import pandas as pd
import json

TARGET_RATINGS = 250000
MIN_MOVIE_RATINGS = 10
MIN_USER_RATINGS = 30
RANDOM_STATE = 42

ratings = pd.read_csv("data/movielens/ml-32m/ratings.csv")
links = pd.read_csv("data/movielens/ml-32m/links.csv", usecols=["movieId", "tmdbId"])

# resolve MovieLens movieId -> TMDB id so the model is keyed by TMDB ids end-to-end
links = links.dropna(subset=["tmdbId"])
links["tmdbId"] = links["tmdbId"].astype(int)
df = ratings.merge(links, on="movieId", how="inner")

# exclude the first 100 users to use for testing later
df = df[df["userId"] > 100]

# drop movies with too few ratings - too sparse to learn a useful latent vector
movie_counts = df.groupby("tmdbId")["rating"].transform("count")
df = df[movie_counts >= MIN_MOVIE_RATINGS]

# keep only users with enough history so each user contributes a richer signal
user_counts = df.groupby("userId")["rating"].transform("count")
df = df[user_counts >= MIN_USER_RATINGS]

# sample whole users (not individual ratings) so each selected user keeps their full history;
# shuffle users and accumulate their rating counts until we reach the target total
ratings_per_user = df.groupby("userId").size()
shuffled_users = ratings_per_user.sample(frac=1, random_state=RANDOM_STATE)
cumulative = shuffled_users.cumsum()
selected_users = shuffled_users[cumulative <= TARGET_RATINGS].index
df_subset = df[df["userId"].isin(selected_users)].copy()

# find unique userIds and tmdbIds in the subset
unique_user_ids = df_subset["userId"].unique()
unique_tmdb_ids = df_subset["tmdbId"].unique()

# reindex userIds and tmdbIds to be contiguous integers starting from 0
# this makes smaller matrices for training and inference
user_id_mapping = {int(old_id): int(new_id) for new_id, old_id in enumerate(unique_user_ids)}
movie_id_mapping = {int(old_id): int(new_id) for new_id, old_id in enumerate(unique_tmdb_ids)}
df_subset["userId"] = df_subset["userId"].map(user_id_mapping)
df_subset["movieId"] = df_subset["tmdbId"].map(movie_id_mapping)

df_subset[["userId", "movieId", "rating", "timestamp"]].to_csv(
    "data/movielens/ml-32m/ratings_subset.csv", index=False
)

# output tmdbId -> contiguous idx mapping for inference
with open("data/movielens/ml-32m/movie_id_mapping.json", "w") as f:
    json.dump(movie_id_mapping, f)