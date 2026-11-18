const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const request = require("supertest");

const password = process.env.PARTSHELF_TEST_DB_PASSWORD;
if (process.env.NODE_ENV !== "test" || !password) {
    throw new Error("Run Jest with NODE_ENV=test and PARTSHELF_TEST_DB_PASSWORD set.");
}

const schema = `jest_${randomUUID().replaceAll("-", "")}`;
const pool = new Pool({
    host: "127.0.0.1",
    port: 55432,
    database: "partshelf_test",
    user: "partshelf_test",
    password,
    ssl: false,
    options: `-c search_path=${schema}`,
    connectionTimeoutMillis: 3000,
});

// Replace only the connection configuration. Repositories still use real PostgreSQL.
jest.doMock("../db/pool", () => pool);
const app = require("../app");

let schemaCreated = false;
let item;

beforeAll(async () => {
    await pool.query(`CREATE SCHEMA ${schema}`);
    schemaCreated = true;
    await pool.query(readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8"));
});

beforeEach(async () => {
    await pool.query(`TRUNCATE ${schema}.items, ${schema}.categories RESTART IDENTITY`);
    const { rows: [category] } = await pool.query(
        "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id",
        ["Storage", "Test category"],
    );
    item = {
        name: "Test SSD",
        description: "NVMe drive",
        manufacturer: "Test manufacturer",
        sku: "SSD-TEST",
        price: "49.90",
        quantity: 4,
        categoryId: category.id,
    };
});

afterAll(async () => {
    try {
        if (schemaCreated) await pool.query(`DROP SCHEMA ${schema} CASCADE`);
    } finally {
        await pool.end();
    }
});

function submit(url, fields) {
    return request(app).post(url).type("form").send(fields);
}

async function seedItem() {
    const { rows: [stored] } = await pool.query(
        `INSERT INTO items (name, description, manufacturer, sku, price, quantity, category_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [item.name, item.description, item.manufacturer, item.sku, item.price, item.quantity, item.categoryId],
    );
    return stored.id;
}

test("creates an item and redirects to its details", async () => {
    const response = await submit("/items/new", item).expect(302);
    const { rows } = await pool.query("SELECT * FROM items");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
        name: item.name,
        description: item.description,
        manufacturer: item.manufacturer,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        category_id: item.categoryId,
    });
    expect(response.headers.location).toBe(`/items/${rows[0].id}`);
});

test("updates an existing item and redirects to its details", async () => {
    const id = await seedItem();
    const changes = { name: "Updated SSD", price: "59.95", quantity: 0 };
    await submit(`/items/${id}/edit`, { ...item, ...changes })
        .expect(302)
        .expect("Location", `/items/${id}`);

    const { rows } = await pool.query("SELECT * FROM items");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id, ...changes, sku: item.sku, category_id: item.categoryId });
});

test.each([
    ["negative price", { price: "-0.01" }, /Price must be a non-negative amount/],
    ["negative quantity", { quantity: "-1" }, /Quantity must be a non-negative integer/],
    ["fractional quantity", { quantity: "1.5" }, /Quantity must be a non-negative integer/],
])("rejects %s without inserting an item", async (_label, changes, message) => {
    await submit("/items/new", { ...item, ...changes }).expect(400).expect(message);
    const { rows } = await pool.query("SELECT id FROM items");
    expect(rows).toEqual([]);
});

test("rejects a duplicate SKU and preserves the existing item", async () => {
    const id = await seedItem();
    await submit("/items/new", { ...item, name: "Duplicate SSD" })
        .expect(400)
        .expect(/An item with this SKU already exists/);

    const { rows } = await pool.query("SELECT id, name, sku FROM items");
    expect(rows).toEqual([{ id, name: item.name, sku: item.sku }]);
});

test("returns 409 when deleting a category with items", async () => {
    const id = await seedItem();
    const categoryUrl = `/categories/${item.categoryId}`;
    await request(app).post(`${categoryUrl}/delete`)
        .expect(409)
        .expect(/This category cannot be deleted/);

    await request(app).get(categoryUrl).expect(200);
    await request(app).get(`/items/${id}`).expect(200);
});

test.each(["/items/999", "/categories/999", "/unknown-route"])(
    "returns 404 for %s",
    async (url) => {
        await request(app).get(url).expect(404).expect(/Page not found/);
    },
);
