# CSCE470-Final

This repository contains code for FilmFinder which is a movie recommedation system based on Matrix Factorization.

## Dependencies

This repository is managed with uv. To install dependencies, run `uv sync` in the root directory.

## Algorithm

1. First download the [MovieLens 32M dataset](https://files.grouplens.org/datasets/movielens/ml-32m.zip) and place the contents inside of `data/movielens/ml-32m` directory.

2. Run all of the following scripts in the `algorithm` directory.

3. Run `dataset_builder.py` to create a smaller dataset (100k rows) for training and testing. This will create a smaller dataset and normalize the IDs to be contiguous starting from 0.

4. Run `train.py` to train the matrix factorization model. This will output the item latent factor matrix `V.npy`.

5. Run `gen_user.py` to pull an example user from the dataset for use in inference.

6. Run `infer.py` to generate movie recommendations for the example user. This will output the top 10 recommended movies for the user.
