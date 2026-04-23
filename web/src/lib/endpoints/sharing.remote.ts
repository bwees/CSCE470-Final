import { command, query } from '$app/server';
import { getDB } from '$lib/server/db';
import { schema } from '$lib/server/db/schema';
import { fetchRecommendations } from '$lib/server/recommendations';
import { getUser } from '$lib/server/utils';
import type { TMDBMovie } from '$lib/types';
import { and, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

const createSharedListDto = v.object({
  baseWatchlistId: v.number(),
  codes: v.array(v.string()),
});

function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;

  let sum = 0;
  for (const r of ratings) {
    sum += r;
  }

  return sum / ratings.length;
}

export const createSharedList = command(createSharedListDto, async (dto) => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const uppercaseCodes = dto.codes.map((c) => c.toUpperCase());

  const baseRows = await db
    .select({ id: schema.watchlists.id, name: schema.watchlists.name })
    .from(schema.watchlists)
    .where(and(eq(schema.watchlists.id, dto.baseWatchlistId), eq(schema.watchlists.userId, user)));

  const resolved = await db
    .select({
      id: schema.watchlists.id,
      name: schema.watchlists.name,
      shareCode: schema.watchlists.shareCode,
    })
    .from(schema.watchlists)
    .where(inArray(schema.watchlists.shareCode, uppercaseCodes));

  if (baseRows.length === 0) {
    throw new Error('Base watchlist not found');
  }

  if (resolved.length !== uppercaseCodes.length) {
    throw new Error('One or more share codes do not exist');
  }

  const memberWatchlistIds = new Set<number>([dto.baseWatchlistId, ...resolved.map((r) => r.id)]);

  const watchlistByShareCode = new Map(resolved.map((r) => [r.shareCode, r]));
  const orderedNames = uppercaseCodes.map((code) => watchlistByShareCode.get(code)!.name);
  const name = `${baseRows[0].name} + ${orderedNames.join(', ')}`;

  const [inserted] = await db
    .insert(schema.sharedLists)
    .values({ userId: user, name })
    .returning({ id: schema.sharedLists.id });

  await db.insert(schema.sharedListMembers).values(
    [...memberWatchlistIds].map((watchlistId) => ({
      sharedListId: inserted.id,
      watchlistId,
    })),
  );

  getUserSharedLists().refresh();

  return { id: inserted.id };
});

type SharedListSummary = {
  id: number;
  name: string;
  movieCount: number;
};

export const getUserSharedLists = query(async (): Promise<SharedListSummary[]> => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    return [];
  }

  const rows = await db
    .select({
      id: schema.sharedLists.id,
      name: schema.sharedLists.name,
      movieId: schema.watchlistMovies.movieId,
    })
    .from(schema.sharedLists)
    .leftJoin(
      schema.sharedListMembers,
      eq(schema.sharedListMembers.sharedListId, schema.sharedLists.id),
    )
    .leftJoin(
      schema.watchlistMovies,
      eq(schema.watchlistMovies.watchlistId, schema.sharedListMembers.watchlistId),
    )
    .where(eq(schema.sharedLists.userId, user));

  const byList = new Map<number, { name: string; movies: Set<number> }>();

  for (const row of rows) {
    let entry = byList.get(row.id);
    if (!entry) {
      entry = { name: row.name, movies: new Set<number>() };
      byList.set(row.id, entry);
    }
    if (row.movieId !== null) {
      entry.movies.add(row.movieId);
    }
  }

  return [...byList.entries()].map(([id, entry]) => ({
    id,
    name: entry.name,
    movieCount: entry.movies.size,
  }));
});

type SharedListMovie = {
  movieId: number;
  title: string;
  overview: string;
  releaseDate: string;
  posterUrl: string | null;
  averageRating: number | null;
  ratingCount: number;
};

type SharedListDetail = {
  id: number;
  name: string;
  movies: SharedListMovie[];
};

async function getSharedRatings(sharedListId: number, user: string) {
  const db = getDB();

  const members = await db
    .select({
      listName: schema.sharedLists.name,
      watchlistId: schema.sharedListMembers.watchlistId,
      ownerId: schema.watchlists.userId,
    })
    .from(schema.sharedLists)
    .innerJoin(
      schema.sharedListMembers,
      eq(schema.sharedListMembers.sharedListId, schema.sharedLists.id),
    )
    .innerJoin(schema.watchlists, eq(schema.watchlists.id, schema.sharedListMembers.watchlistId))
    .where(and(eq(schema.sharedLists.id, sharedListId), eq(schema.sharedLists.userId, user)));

  if (members.length === 0) {
    return null;
  }

  const listName = members[0].listName;
  const watchlistIds = members.map((m) => m.watchlistId);
  const owners = [...new Set(members.map((m) => m.ownerId))];

  const memberMovies = await db
    .select({ movieId: schema.watchlistMovies.movieId })
    .from(schema.watchlistMovies)
    .where(inArray(schema.watchlistMovies.watchlistId, watchlistIds));

  const movieIds = [...new Set(memberMovies.map((r) => r.movieId))];

  if (movieIds.length === 0) {
    return { listName, ratingsByMovie: new Map<number, number[]>(), movieIds: [] as number[] };
  }

  const ratings = await db
    .select({
      movieId: schema.userMovieRatings.movieId,
      rating: schema.userMovieRatings.rating,
    })
    .from(schema.userMovieRatings)
    .where(
      and(
        inArray(schema.userMovieRatings.userId, owners),
        inArray(schema.userMovieRatings.movieId, movieIds),
      ),
    );

  const ratingsByMovie = new Map<number, number[]>();
  for (const r of ratings) {
    let list = ratingsByMovie.get(r.movieId);
    if (!list) {
      list = [];
      ratingsByMovie.set(r.movieId, list);
    }
    list.push(r.rating);
  }

  return { listName, ratingsByMovie, movieIds: [...ratingsByMovie.keys()] };
}

export const getSharedListById = query(
  v.number(),
  async (sharedListId): Promise<SharedListDetail | null> => {
    const db = getDB();
    const user = getUser();

    if (!user) {
      return null;
    }

    const data = await getSharedRatings(sharedListId, user);
    if (!data) {
      return null;
    }

    if (data.movieIds.length === 0) {
      return { id: sharedListId, name: data.listName, movies: [] };
    }

    const details = await db
      .select()
      .from(schema.movies)
      .where(inArray(schema.movies.movieId, data.movieIds));
    const detailsById = new Map(details.map((m) => [m.movieId, m]));

    const movies: SharedListMovie[] = data.movieIds.flatMap((movieId) => {
      const detail = detailsById.get(movieId);
      if (!detail) return [];
      const ratings = data.ratingsByMovie.get(movieId) ?? [];
      return [
        {
          movieId: detail.movieId,
          title: detail.title,
          overview: detail.overview,
          releaseDate: detail.releaseDate,
          posterUrl: detail.posterUrl,
          averageRating: averageRating(ratings),
          ratingCount: ratings.length,
        },
      ];
    });

    return { id: sharedListId, name: data.listName, movies };
  },
);

export const getSharedRecommendations = query(
  v.number(),
  async (sharedListId): Promise<TMDBMovie[]> => {
    const user = getUser();
    if (!user) return [];

    const data = await getSharedRatings(sharedListId, user);
    if (!data) return [];

    const ratedPayload = data.movieIds.flatMap((movieId) => {
      const avg = averageRating(data.ratingsByMovie.get(movieId) ?? []);
      return avg === null ? [] : [{ movieId, rating: avg }];
    });

    return fetchRecommendations(ratedPayload);
  },
);

export const deleteSharedList = command(v.number(), async (sharedListId: number) => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  await db
    .delete(schema.sharedLists)
    .where(and(eq(schema.sharedLists.id, sharedListId), eq(schema.sharedLists.userId, user)));

  getUserSharedLists().refresh();
});
