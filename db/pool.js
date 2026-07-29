const path = require("node:path");

const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({
    path: path.join(__dirname, "..", ".env"),
    quiet: true,
});

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
    console.error(
        "Unexpected PostgreSQL pool error:",
        error.message,
    );
});

module.exports = pool;
