import pandas as pd

OUTPUT_PATH = "test.csv"
USER_ID = 25
N = 50

ratings = pd.read_csv("../data/movielens/ml-32m/ratings.csv")
allMovies = pd.read_csv("../data/movielens/ml-32m/movies.csv")

user_rows = ratings[ratings["userId"] == USER_ID].copy()

sample_size = min(N, len(user_rows))
watchlist = user_rows.sample(n=sample_size, random_state=42)
watchlist = watchlist.merge(allMovies, on="movieId", how="left")
watchlist.to_csv(OUTPUT_PATH, index=False)


