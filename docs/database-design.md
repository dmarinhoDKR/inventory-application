# PartShelf Database Design

## Application

PartShelf is a computer parts inventory application for managing product categories and the items stored in each category.

## Business rules

- A category can contain many items.
- Each item must belong to exactly one category.
- Category names must be unique.
- Item SKUs must be unique.
- Item prices cannot be negative.
- Item quantities cannot be negative.
- A category containing items cannot be deleted.
- An item can be moved from one category to another.
- Deleting an item does not affect its category.

## Categories

| Field | PostgreSQL type | Constraints |
|---|---|---|
| `id` | `INTEGER` | Primary key, generated identity |
| `name` | `VARCHAR(100)` | Required, unique |
| `description` | `TEXT` | Required |

## Items

| Field | PostgreSQL type | Constraints |
|---|---|---|
| `id` | `INTEGER` | Primary key, generated identity |
| `name` | `VARCHAR(150)` | Required |
| `description` | `TEXT` | Required |
| `manufacturer` | `VARCHAR(100)` | Required |
| `sku` | `VARCHAR(50)` | Required, unique |
| `price` | `NUMERIC(10, 2)` | Required, zero or greater |
| `quantity` | `INTEGER` | Required, zero or greater |
| `category_id` | `INTEGER` | Required, references `categories.id` |
| `created_at` | `TIMESTAMPTZ` | Required, defaults to current time |
| `updated_at` | `TIMESTAMPTZ` | Required, defaults to current time |

## Relationship

The relationship between categories and items is one-to-many:

```text
categories
    1
    |
    |
    *
items

```

`items.category_id` references `categories.id` with `ON DELETE RESTRICT`.

This prevents the deletion of a category while items still belong to it. The user must move or delete those items first.

## Planned operations

### Categories

- List all categories.
- View one category and its items.
- Create a category.
- Update a category.
- Delete an empty category.

### Items

- List all items.
- View one item.
- Create an item.
- Update an item.
- Delete an item.
