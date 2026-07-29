CREATE TABLE IF NOT EXISTS categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY
        PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    CONSTRAINT categories_name_unique
        UNIQUE (name),
    CONSTRAINT categories_name_not_blank
        CHECK (BTRIM(name) <> ''),
    CONSTRAINT categories_description_not_blank
        CHECK (BTRIM(description) <> '')
);

CREATE TABLE IF NOT EXISTS items (
    id INTEGER GENERATED ALWAYS AS IDENTITY
        PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT items_sku_unique
        UNIQUE (sku),
    CONSTRAINT items_name_not_blank
        CHECK (BTRIM(name) <> ''),
    CONSTRAINT items_description_not_blank
        CHECK (BTRIM(description) <> ''),
    CONSTRAINT items_manufacturer_not_blank
        CHECK (BTRIM(manufacturer) <> ''),
    CONSTRAINT items_sku_not_blank
        CHECK (BTRIM(sku) <> ''),
    CONSTRAINT items_price_nonnegative
        CHECK (price >= 0),
    CONSTRAINT items_quantity_nonnegative
        CHECK (quantity >= 0),
    CONSTRAINT items_category_id_foreign
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS items_category_id_index
    ON items (category_id);
