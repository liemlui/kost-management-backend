// pwe/backend-nest/src/config/env.ts

import * as dotenv from "dotenv";

dotenv.config();

function must(name: string): string {
  const v = process.env[name];
  if (!v || String(v).trim() === "") {
    throw new Error(`env.missing: ${name}`);
  }
  return v;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),
  SESSION_SECRET: must("SESSION_SECRET"),
  DATABASE_URL: must("DATABASE_URL")
} as const;
