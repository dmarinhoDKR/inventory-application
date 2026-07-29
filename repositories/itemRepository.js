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

async function create(item) {
    const result = await pool.query(
        `
        INSERT INTO items (
            name,
            description,
            manufacturer,
            sku,
            price,
            quantity,
            category_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        `,
        [
            item.name,
            item.description,
            item.manufacturer,
            item.sku,
            item.price,
            item.quantity,
            item.categoryId,
        ],
    );

    return result.rows[0];
}

async function update(itemId, item) {
    const result = await pool.query(
        `
        UPDATE items
        SET
            name = $1,
            description = $2,
            manufacturer = $3,
            sku = $4,
            price = $5,
            quantity = $6,
            category_id = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING id
        `,
        [
            item.name,
            item.description,
            item.manufacturer,
            item.sku,
            item.price,
            item.quantity,
            item.categoryId,
            itemId,
        ],
    );

    return result.rows[0] ?? null;
}

async function remove(itemId) {
    const result = await pool.query(
        `
        DELETE FROM items
        WHERE id = $1
        RETURNING id
        `,
        [itemId],
    );

    return result.rows[0] ?? null;
}

module.exports = {
    create,
    findAll,
    findById,
    remove,
    update,
};
