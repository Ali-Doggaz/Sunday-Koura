import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../lib/env";
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
