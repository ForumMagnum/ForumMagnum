import LRU from "lru-cache";

type Data = DbObject[];

class PostgresSearchCache extends LRU<string, Data> {
  constructor(ttlMinutes = 15, maxEntries = 500) {
    super({
      max: maxEntries,
      maxAge: ttlMinutes * 60000,
    });
  }
}

export default PostgresSearchCache;
