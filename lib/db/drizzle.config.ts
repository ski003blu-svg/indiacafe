import { defineConfig } from "drizzle-kit";
import path from "path";
import { config } from "dotenv";

// Load from api-server .env so DATABASE_URL is available when running db:push locally
config({
  path: path.resolve(__dirname, "../../artifacts/api-server/.env"),
  override: true,
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
