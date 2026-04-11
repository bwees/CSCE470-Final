import { command, query } from '$app/server';
import { getDB } from '$lib/server/db';
import { schema } from '$lib/server/db/schema';
import { getUser } from '$lib/server/utils';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';

export const getMovieRating = query(v.number(), async (movieId: number) => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    return null;
  }

  const rating = await db
    .select()
    .from(schema.userMovieRatings)
    .where(
      and(eq(schema.userMovieRatings.userId, user), eq(schema.userMovieRatings.movieId, movieId)),
    );

  return rating.length > 0 ? rating[0].rating : null;
});

const updateRatingDto = v.object({
  movieId: v.number(),
  rating: v.number(),
});

export const updateMovieRating = command(updateRatingDto, async (dto) => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  await db
    .insert(schema.userMovieRatings)
    .values({
      userId: user,
      movieId: dto.movieId,
      rating: dto.rating,
    })
    .onConflictDoUpdate({
      target: [schema.userMovieRatings.userId, schema.userMovieRatings.movieId],
      set: {
        rating: dto.rating,
      },
    });

  getMovieRating(dto.movieId).refresh();
});

export const getUserRatings = query(async () => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    return [];
  }

  const ratings = await db
    .select()
    .from(schema.userMovieRatings)
    .where(eq(schema.userMovieRatings.userId, user))
    .innerJoin(schema.movies, eq(schema.movies.movieId, schema.userMovieRatings.movieId));

  // join the ratings with the movie details and return an array of objects containing both the rating and the movie details
  return ratings.map((row) => ({
    rating: row.user_movie_ratings.rating,
    movie: {
      id: row.movies.movieId,
      title: row.movies.title,
      overview: row.movies.overview,
      release_date: row.movies.releaseDate,
      poster_path: row.movies.posterUrl,
    },
  }));
});
