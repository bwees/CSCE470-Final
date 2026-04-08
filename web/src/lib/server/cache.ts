type CacheRecord = {
  response: Response;
};

type CacheShim = Pick<Cache, 'match' | 'put'>;

const memoryStore = new Map<string, CacheRecord>();

function cloneRequestKey(request: Request) {
  return `${request.method}:${request.url}`;
}

function createMemoryCache(): CacheShim {
  return {
    async match(request: Request) {
      const record = memoryStore.get(cloneRequestKey(request));

      if (!record) {
        return undefined;
      }

      return record.response.clone();
    },
    async put(request: Request, response: Response) {
      memoryStore.set(cloneRequestKey(request), {
        response: response.clone(),
      });
    },
  };
}

export function getPosterCache(): CacheShim {
  const workerCache =
    typeof caches !== 'undefined' && 'default' in caches
      ? ((caches as CacheStorage & { default: CacheShim }).default ?? null)
      : null;

  return workerCache ?? createMemoryCache();
}
