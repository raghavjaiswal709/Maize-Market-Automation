import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || "maize_market";

console.log("[MongoDB] Initializing with database:", MONGODB_DB);

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

const globalWithMongo = global as typeof globalThis & {
  _mongoCache: MongoCache;
};

if (!globalWithMongo._mongoCache) {
  globalWithMongo._mongoCache = { client: null, db: null, promise: null };
}

const cached = globalWithMongo._mongoCache;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.client && cached.db) {
    console.log("[MongoDB] Using cached connection to database:", MONGODB_DB);
    return { client: cached.client, db: cached.db };
  }

  if (!cached.promise) {
    console.log("[MongoDB] Creating new connection to database:", MONGODB_DB);
    cached.promise = MongoClient.connect(MONGODB_URI).then((client) => {
      const db = client.db(MONGODB_DB);
      console.log("[MongoDB] Successfully connected to database:", MONGODB_DB);
      return { client, db };
    });
  }

  const { client, db } = await cached.promise;
  cached.client = client;
  cached.db = db;
  return { client, db };
}
