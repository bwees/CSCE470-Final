import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
});

export const userMovieRatings = sqliteTable(
  'user_movie_ratings',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    movieId: integer('movie_id').notNull(),
    rating: integer('rating').notNull(),
  },
  (table) => [
    uniqueIndex('user_movie_ratings_user_id_movie_id_unique').on(table.userId, table.movieId),
  ],
);

export const watchlists = sqliteTable('watchlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export const watchlistMovies = sqliteTable(
  'watchlist_movies',
  {
    watchlistId: integer('watchlist_id')
      .notNull()
      .references(() => watchlists.id, { onDelete: 'cascade' }),
    movieId: integer('movie_id').notNull(),
  },
  (table) => [
    uniqueIndex('watchlist_movies_watchlist_id_movie_id_unique').on(
      table.watchlistId,
      table.movieId,
    ),
  ],
);

export const schema = {
  users,
  userMovieRatings,
  watchlists,
  watchlistMovies,
};
