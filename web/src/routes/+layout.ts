export const prerender = true;

import { redirect } from '@sveltejs/kit';

const REDIRECTS = {
  '/': '/popular',
};

export async function load({ url }) {
  const pathname = url.pathname;
  if (REDIRECTS.hasOwnProperty(pathname)) {
    return redirect(301, (REDIRECTS as any)[pathname]);
  }
}
