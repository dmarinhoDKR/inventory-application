# PartShelf

A server-rendered computer parts inventory application built with Express, EJS, and PostgreSQL.

PartShelf allows users to manage product categories and the computer parts stored in each category. It was created for The Odin Project Inventory Application assignment.

![Node.js](https://img.shields.io/badge/Node.js-0F172A?style=flat-square&logo=nodedotjs&logoColor=5FA04E)
![Express](https://img.shields.io/badge/Express-0F172A?style=flat-square&logo=express&logoColor=FFFFFF)
![EJS](https://img.shields.io/badge/EJS-0F172A?style=flat-square&logo=ejs&logoColor=B4CA65)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-0F172A?style=flat-square&logo=postgresql&logoColor=4169E1)

## Features

- Browse all inventory categories.
- View the items contained in each category.
- Browse and inspect every inventory item.
- Create, update, and delete categories.
- Create, update, move, and delete items.
- Validate required fields, prices, quantities, category selections, category names, and SKUs.
- Prevent duplicate category names and item SKUs.
- Prevent deletion of categories that still contain items.
- Confirm destructive actions before deletion.
- Seed the database with example computer parts.
- Render custom `404` and deletion-conflict responses.

## Technology

- Node.js
- Express 5
- EJS
- PostgreSQL 16
- `pg`
- `dotenv`
- HTML and CSS

## Data model

PartShelf uses two PostgreSQL tables:

- `categories`
- `items`

Each item belongs to exactly one category. One category can contain multiple items.

```text
categories
    1
    |
    |
    *
items
```

Important database rules include:

- unique category names;
- unique item SKUs;
- non-negative prices;
- non-negative quantities;
- nonblank required text fields;
- `ON DELETE RESTRICT` between categories and items;
- an index on `items.category_id`.

The complete design is documented in [docs/database-design.md](docs/database-design.md).

## Requirements

- Node.js 18 or later
- npm
- PostgreSQL 16 or a compatible PostgreSQL version

PostgreSQL can run locally, in Docker, or through a hosted database service.

## Local setup

Clone the repository:

```bash
git clone https://github.com/dmarinhoDKR/inventory-application.git
cd inventory-application
```

Install the dependencies:

```bash
npm ci
```

Create the local environment file:

```bash
cp .env.example .env
```

Set `DATABASE_URL` in `.env`:

```text
DATABASE_URL=postgresql://username:password@hostname:port/database
```

Do not commit `.env`. It is ignored by Git.

If the database password contains URL-reserved characters, URL-encode the password before placing it in `DATABASE_URL`.

## PostgreSQL with Docker

One local option is a PostgreSQL 16 container.

Choose a local password without placing it directly in the command history:

```bash
read -rsp "Local PartShelf PostgreSQL password: " POSTGRES_PASSWORD
echo
export POSTGRES_PASSWORD
```

Create the named volume:

```bash
docker volume create partshelf-postgres-data
```

Start PostgreSQL:

```bash
docker run \
  --detach \
  --name partshelf-postgres \
  --env POSTGRES_DB=partshelf \
  --env POSTGRES_USER=partshelf \
  --env POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --publish 5433:5432 \
  --volume partshelf-postgres-data:/var/lib/postgresql/data \
  postgres:16
```

Remove the password from the shell variable:

```bash
unset POSTGRES_PASSWORD
```

For this container, the local connection URL has this structure:

```text
DATABASE_URL=postgresql://partshelf:your-password@127.0.0.1:5433/partshelf
```

Check that PostgreSQL is ready:

```bash
docker exec \
  partshelf-postgres \
  pg_isready \
  --username partshelf \
  --dbname partshelf
```

After the initial creation, the container can be stopped and started with:

```bash
docker stop partshelf-postgres
docker start partshelf-postgres
```

The named volume preserves the PostgreSQL data when the container is stopped or recreated without removing the volume.

## Initialize and seed the database

Run:

```bash
npm run db:seed
```

The seed command:

1. executes `db/schema.sql`;
2. creates the tables and index when they do not exist;
3. inserts four example categories;
4. inserts four example computer parts;
5. uses a transaction;
6. avoids duplicate categories and SKUs when run again.

## Run the application

Start PartShelf:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

For development with automatic restart:

```bash
npm run dev
```

The application also accepts a `PORT` environment variable.

## Routes

### General

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/` | Application home page |

### Categories

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/categories` | List categories |
| `GET` | `/categories/new` | Show the new-category form |
| `POST` | `/categories/new` | Create a category |
| `GET` | `/categories/:categoryId` | View a category and its items |
| `GET` | `/categories/:categoryId/edit` | Show the category edit form |
| `POST` | `/categories/:categoryId/edit` | Update a category |
| `GET` | `/categories/:categoryId/delete` | Show category deletion confirmation |
| `POST` | `/categories/:categoryId/delete` | Delete an empty category |

### Items

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/items` | List items |
| `GET` | `/items/new` | Show the new-item form |
| `POST` | `/items/new` | Create an item |
| `GET` | `/items/:itemId` | View an item |
| `GET` | `/items/:itemId/edit` | Show the item edit form |
| `POST` | `/items/:itemId/edit` | Update an item |
| `GET` | `/items/:itemId/delete` | Show item deletion confirmation |
| `POST` | `/items/:itemId/delete` | Delete an item |

Unknown resources and routes return `404`.

Attempting to delete a category that still contains items returns `409 Conflict`. The user must move or delete the category's items first.

## Project structure

```text
inventory-application/
├── controllers/
├── db/
│   ├── pool.js
│   ├── schema.sql
│   └── seed.js
├── docs/
│   └── database-design.md
├── public/
│   └── styles.css
├── repositories/
├── routes/
├── views/
│   ├── categories/
│   └── items/
├── .env.example
├── app.js
├── package.json
└── README.md
```

The application is organized into:

- routes for URL and HTTP-method mapping;
- controllers for request handling and validation;
- repositories for parameterized PostgreSQL queries;
- EJS views for server-rendered pages;
- PostgreSQL scripts for schema creation and seed data.

## Validation and database safety

Application validation covers:

- required category and item fields;
- category name length;
- item name, manufacturer, and SKU lengths;
- non-negative prices with at most two decimal places;
- non-negative integer quantities;
- valid existing category selection.

PostgreSQL constraints provide a second layer of protection.

All application values are passed to SQL using parameterized queries. Database seed operations run inside a transaction.

## Verification performed

The project has been checked through:

- Node.js syntax checks;
- dependency audit;
- repository-level PostgreSQL queries;
- direct PostgreSQL inspection;
- complete HTTP create, read, update, and delete workflows;
- invalid form submissions;
- duplicate category-name and SKU attempts;
- missing-resource responses;
- blocked deletion of populated categories;
- successful deletion of empty categories and items;
- repeatable database seeding.

## Current limitations

- The application does not include authentication or user accounts.
- Management routes are publicly accessible.
- Automated tests have not yet been added.
- The project has not yet been deployed.

## Project stages

1. Planned the inventory data model.
2. Set up Express and EJS.
3. Added the PostgreSQL schema and repeatable seed data.
4. Added category and item read pages.
5. Added create and update forms with validation.
6. Added deletion confirmation and category-protection rules.

## License

This project is licensed under the [MIT License](LICENSE).
