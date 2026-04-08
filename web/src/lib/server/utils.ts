import { getRequestEvent } from '$app/server';
import { getDB } from './db';
import { schema } from './db/schema';

export function getUser() {
  const { cookies } = getRequestEvent();

  const userId = cookies.get('userIdFF');

  if (!userId) {
    return null;
  }

  const db = getDB();
  db.insert(schema.users).values({ id: userId }).onConflictDoNothing().run();

  return cookies.get('userIdFF') || null;
}
