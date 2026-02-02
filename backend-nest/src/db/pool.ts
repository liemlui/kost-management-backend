// pwe/backend-nest/src/db/pool.ts

import { Pool, QueryResult, QueryResultRow } from "pg";
// @ts-ignore - Types for pg module
import { ENV } from "../config/env";

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL
  // Kalau kamu perlu SSL untuk cloud postgres, nanti kita tambahkan opsi ssl di sini.
});

pool.on("error", (err) => {
  console.error("pg.pool.error", {
    message: err.message,
    code: (err as any).code,
    host: (err as any).hostname
  });
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query(text, params);
}

export async function pingDb() {
  try {
    const r = await query<{ now: string }>("select now()::text as now");
    return { ok: true, now: r.rows[0]?.now };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message,
      code: err.code,
      host: err.hostname
    };
  }
}
