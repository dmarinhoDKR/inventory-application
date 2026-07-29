const categoryRepository = require(
    "../repositories/categoryRepository",
);
const itemRepository = require(
    "../repositories/itemRepository",
);

function parseItemId(value) {
    const itemId = Number(value);

    if (
        !Number.isInteger(itemId) ||
        itemId <= 0
    ) {
        return null;
    }

    return itemId;
}

function normalizeItem(body = {}) {
    return {
        name: String(body.name ?? "").trim(),
        description: String(
            body.description ?? "",
        ).trim(),
        manufacturer: String(
            body.manufacturer ?? "",
        ).trim(),
        sku: String(body.sku ?? "").trim(),
        price: String(body.price ?? "").trim(),
        quantity: String(
            body.quantity ?? "",
        ).trim(),
        categoryId: String(
            body.categoryId ?? "",
        ).trim(),
    };
}

async function validateItem(item) {
    const errors = [];

    if (!item.name) {
        errors.push("Name is required.");
    } else if (item.name.length > 150) {
        errors.push(
            "Name must be 150 characters or fewer.",
        );
    }

    if (!item.description) {
        errors.push("Description is required.");
    }

    if (!item.manufacturer) {
        errors.push("Manufacturer is required.");
    } else if (item.manufacturer.length > 100) {
        errors.push(
            "Manufacturer must be 100 characters or fewer.",
        );
    }

    if (!item.sku) {
        errors.push("SKU is required.");
    } else if (item.sku.length > 50) {
        errors.push(
            "SKU must be 50 characters or fewer.",
        );
    }

    if (!item.price) {
        errors.push("Price is required.");
    } else {
        const pricePattern = /^\d+(?:\.\d{1,2})?$/;
        const price = Number(item.price);

        if (
            !pricePattern.test(item.price) ||
            !Number.isFinite(price) ||
            price < 0 ||
            price > 99_999_999.99
        ) {
            errors.push(
                "Price must be a non-negative amount " +
                "with at most two decimal places.",
            );
        }
    }

    if (!item.quantity) {
        errors.push("Quantity is required.");
    } else {
        const quantity = Number(item.quantity);

        if (
            !/^\d+$/.test(item.quantity) ||
            !Number.isSafeInteger(quantity) ||
            quantity < 0
        ) {
            errors.push(
                "Quantity must be a non-negative integer.",
            );
        }
    }

    const categoryId = Number(item.categoryId);

    if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
    ) {
        errors.push("Select a valid category.");
    } else {
        const category = (
            await categoryRepository.findById(
                categoryId,
            )
        );

        if (!category) {
            errors.push("Select a valid category.");
        }
    }

    return errors;
}

function toPersistenceItem(item) {
    return {
        ...item,
        quantity: Number(item.quantity),
        categoryId: Number(item.categoryId),
    };
}

function databaseValidationMessage(error) {
    if (error.code === "23505") {
        return "An item with this SKU already exists.";
    }

    if (error.code === "23503") {
        return "The selected category no longer exists.";
    }

    return null;
}

function renderNotFound(response) {
    return response.status(404).render("404", {
        title: "Item not found",
    });
}

async function renderForm(
    response,
    {
        title,
        item,
        errors,
        formAction,
        submitLabel,
        statusCode = 200,
    },
) {
    const categories = (
        await categoryRepository.findAll()
    );

    response.status(statusCode).render(
        "items/form",
        {
            title,
            item,
            categories,
            errors,
            formAction,
            submitLabel,
        },
    );
}

function renderDeletePage(
    response,
    {
        item,
        statusCode = 200,
    },
) {
    response.status(statusCode).render(
        "items/delete",
        {
            title: "Delete Item",
            item,
        },
    );
}

async function listItems(
    _request,
    response,
) {
    const items = await itemRepository.findAll();

    response.render("items/index", {
        title: "Items",
        items,
    });
}

async function showItem(
    request,
    response,
) {
    const itemId = parseItemId(
        request.params.itemId,
    );

    if (itemId === null) {
        renderNotFound(response);
        return;
    }

    const item = await itemRepository.findById(
        itemId,
    );

    if (!item) {
        renderNotFound(response);
        return;
    }

    response.render("items/show", {
        title: item.name,
        item,
    });
}

async function showNewItemForm(
    _request,
    response,
) {
    await renderForm(response, {
        title: "New Item",
        item: {
            name: "",
            description: "",
            manufacturer: "",
            sku: "",
            price: "",
            quantity: "",
            categoryId: "",
        },
        errors: [],
        formAction: "/items/new",
        submitLabel: "Create item",
    });
}

async function createItem(
    request,
    response,
) {
    const item = normalizeItem(request.body);
    const errors = await validateItem(item);

    if (errors.length > 0) {
        await renderForm(response, {
            title: "New Item",
            item,
            errors,
            formAction: "/items/new",
            submitLabel: "Create item",
            statusCode: 400,
        });
        return;
    }

    try {
        const createdItem = await itemRepository.create(
            toPersistenceItem(item),
        );

        response.redirect(
            `/items/${createdItem.id}`,
        );
    } catch (error) {
        const message = databaseValidationMessage(
            error,
        );

        if (!message) {
            throw error;
        }

        errors.push(message);

        await renderForm(response, {
            title: "New Item",
            item,
            errors,
            formAction: "/items/new",
            submitLabel: "Create item",
            statusCode: 400,
        });
    }
}

async function showEditItemForm(
    request,
    response,
) {
    const itemId = parseItemId(
        request.params.itemId,
    );

    if (itemId === null) {
        renderNotFound(response);
        return;
    }

    const storedItem = await itemRepository.findById(
        itemId,
    );

    if (!storedItem) {
        renderNotFound(response);
        return;
    }

    const item = {
        name: storedItem.name,
        description: storedItem.description,
        manufacturer: storedItem.manufacturer,
        sku: storedItem.sku,
        price: String(storedItem.price),
        quantity: String(storedItem.quantity),
        categoryId: String(
            storedItem.category_id,
        ),
    };

    await renderForm(response, {
        title: "Edit Item",
        item,
        errors: [],
        formAction: `/items/${itemId}/edit`,
        submitLabel: "Save changes",
    });
}

async function updateItem(
    request,
    response,
) {
    const itemId = parseItemId(
        request.params.itemId,
    );

    if (itemId === null) {
        renderNotFound(response);
        return;
    }

    const item = normalizeItem(request.body);
    const errors = await validateItem(item);

    if (errors.length > 0) {
        await renderForm(response, {
            title: "Edit Item",
            item,
            errors,
            formAction: `/items/${itemId}/edit`,
            submitLabel: "Save changes",
            statusCode: 400,
        });
        return;
    }

    try {
        const updatedItem = await itemRepository.update(
            itemId,
            toPersistenceItem(item),
        );

        if (!updatedItem) {
            renderNotFound(response);
            return;
        }

        response.redirect(
            `/items/${updatedItem.id}`,
        );
    } catch (error) {
        const message = databaseValidationMessage(
            error,
        );

        if (!message) {
            throw error;
        }

        errors.push(message);

        await renderForm(response, {
            title: "Edit Item",
            item,
            errors,
            formAction: `/items/${itemId}/edit`,
            submitLabel: "Save changes",
            statusCode: 400,
        });
    }
}

async function showDeleteItemPage(
    request,
    response,
) {
    const itemId = parseItemId(
        request.params.itemId,
    );

    if (itemId === null) {
        renderNotFound(response);
        return;
    }

    const item = await itemRepository.findById(
        itemId,
    );

    if (!item) {
        renderNotFound(response);
        return;
    }

    renderDeletePage(response, {
        item,
    });
}

async function deleteItem(
    request,
    response,
) {
    const itemId = parseItemId(
        request.params.itemId,
    );

    if (itemId === null) {
        renderNotFound(response);
        return;
    }

    const deletedItem = await itemRepository.remove(
        itemId,
    );

    if (!deletedItem) {
        renderNotFound(response);
        return;
    }

    response.redirect("/items");
}

module.exports = {
    createItem,
    deleteItem,
    listItems,
    showDeleteItemPage,
    showEditItemForm,
    showItem,
    showNewItemForm,
    updateItem,
};
