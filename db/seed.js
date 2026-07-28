const fs = require("node:fs");
const path = require("node:path");

const pool = require("./pool");

const categories = [
    {
        name: "Processors",
        description: "CPUs for desktop computer builds.",
    },
    {
        name: "Graphics Cards",
        description: "Dedicated GPUs for graphics and compute workloads.",
    },
    {
        name: "Memory",
        description: "Desktop memory kits and modules.",
    },
    {
        name: "Storage",
        description: "Solid-state drives and other storage devices.",
    },
];

const items = [
    {
        name: "Ryzen 5 7600",
        description: "Six-core desktop processor.",
        manufacturer: "AMD",
        sku: "CPU-AMD-R5-7600",
        price: "199.99",
        quantity: 12,
        category: "Processors",
    },
    {
        name: "GeForce RTX 4060",
        description: "Desktop graphics card with 8 GB of video memory.",
        manufacturer: "NVIDIA",
        sku: "GPU-NV-RTX4060",
        price: "299.99",
        quantity: 8,
        category: "Graphics Cards",
    },
    {
        name: "Vengeance 32 GB DDR5",
        description: "Dual-channel desktop memory kit.",
        manufacturer: "Corsair",
        sku: "RAM-COR-DDR5-32",
        price: "109.99",
        quantity: 20,
        category: "Memory",
    },
    {
        name: "980 PRO 1 TB NVMe SSD",
        description: "PCIe NVMe solid-state drive.",
        manufacturer: "Samsung",
        sku: "SSD-SAM-980PRO-1TB",
        price: "99.99",
        quantity: 15,
        category: "Storage",
    },
];

async function findOrCreateCategory(
    client,
    category,
) {
    const insertResult = await client.query(
        `
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
        RETURNING id
        `,
        [
            category.name,
            category.description,
        ],
    );

    if (insertResult.rows[0]) {
        return insertResult.rows[0].id;
    }

    const selectResult = await client.query(
        `
        SELECT id
        FROM categories
        WHERE name = $1
        `,
        [category.name],
    );

    if (!selectResult.rows[0]) {
        throw new Error(
            `Category could not be loaded: ${category.name}`,
        );
    }

    return selectResult.rows[0].id;
}

async function seedDatabase() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const schemaPath = path.join(
            __dirname,
            "schema.sql",
        );
        const schema = fs.readFileSync(
            schemaPath,
            "utf8",
        );

        await client.query(schema);

        const categoryIds = new Map();

        for (const category of categories) {
            const categoryId = await findOrCreateCategory(
                client,
                category,
            );

            categoryIds.set(
                category.name,
                categoryId,
            );
        }

        for (const item of items) {
            const categoryId = categoryIds.get(
                item.category,
            );

            if (!categoryId) {
                throw new Error(
                    `Category ID not found: ${item.category}`,
                );
            }

            await client.query(
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
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7
                )
                ON CONFLICT (sku) DO NOTHING
                `,
                [
                    item.name,
                    item.description,
                    item.manufacturer,
                    item.sku,
                    item.price,
                    item.quantity,
                    categoryId,
                ],
            );
        }

        await client.query("COMMIT");
        console.log("Database seed completed successfully.");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await seedDatabase();
    } catch (error) {
        console.error(
            "Database seed failed:",
            error.message,
        );
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
