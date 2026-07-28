const pool = require("../db/pool");

async function findAll() {
    const result = await pool.query(`
        SELECT
            items.id,
            items.name,
            items.manufacturer,
            items.sku,
            items.price,
            items.quantity,
            items.category_id,
            categories.name AS category_name
        FROM items
        INNER JOIN categories
            ON categories.id = items.category_id
        ORDER BY items.name
    `);

    return result.rows;
}

async function findById(itemId) {
    const result = await pool.query(
        `
        SELECT
            items.id,
            items.name,
            items.description,
            items.manufacturer,
            items.sku,
            items.price,
            items.quantity,
            items.category_id,
            items.created_at,
            items.updated_at,
            categories.name AS category_name
        FROM items
        INNER JOIN categories
            ON categories.id = items.category_id
        WHERE items.id = $1
        `,
        [itemId],
    );

    return result.rows[0] ?? null;
}

module.exports = {
    findAll,
    findById,
};
