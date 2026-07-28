const pool = require("../db/pool");

async function findAll() {
    const result = await pool.query(`
        SELECT
            categories.id,
            categories.name,
            categories.description,
            COUNT(items.id)::INTEGER AS item_count
        FROM categories
        LEFT JOIN items
            ON items.category_id = categories.id
        GROUP BY
            categories.id,
            categories.name,
            categories.description
        ORDER BY categories.name
    `);

    return result.rows;
}

async function findById(categoryId) {
    const result = await pool.query(
        `
        SELECT
            id,
            name,
            description
        FROM categories
        WHERE id = $1
        `,
        [categoryId],
    );

    return result.rows[0] ?? null;
}

async function findItemsByCategoryId(categoryId) {
    const result = await pool.query(
        `
        SELECT
            id,
            name,
            manufacturer,
            sku,
            price,
            quantity
        FROM items
        WHERE category_id = $1
        ORDER BY name
        `,
        [categoryId],
    );

    return result.rows;
}

module.exports = {
    findAll,
    findById,
    findItemsByCategoryId,
};
