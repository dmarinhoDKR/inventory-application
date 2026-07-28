const categoryRepository = require(
    "../repositories/categoryRepository",
);

function parseCategoryId(value) {
    const categoryId = Number(value);

    if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
    ) {
        return null;
    }

    return categoryId;
}

function normalizeCategory(body = {}) {
    return {
        name: String(body.name ?? "").trim(),
        description: String(
            body.description ?? "",
        ).trim(),
    };
}

function validateCategory(category) {
    const errors = [];

    if (!category.name) {
        errors.push("Name is required.");
    } else if (category.name.length > 100) {
        errors.push(
            "Name must be 100 characters or fewer.",
        );
    }

    if (!category.description) {
        errors.push("Description is required.");
    }

    return errors;
}

function renderNotFound(response) {
    return response.status(404).render("404", {
        title: "Category not found",
    });
}

function renderForm(
    response,
    {
        title,
        category,
        errors,
        formAction,
        submitLabel,
        statusCode = 200,
    },
) {
    response.status(statusCode).render(
        "categories/form",
        {
            title,
            category,
            errors,
            formAction,
            submitLabel,
        },
    );
}

async function listCategories(
    _request,
    response,
) {
    const categories = await categoryRepository.findAll();

    response.render("categories/index", {
        title: "Categories",
        categories,
    });
}

async function showCategory(
    request,
    response,
) {
    const categoryId = parseCategoryId(
        request.params.categoryId,
    );

    if (categoryId === null) {
        renderNotFound(response);
        return;
    }

    const category = await categoryRepository.findById(
        categoryId,
    );

    if (!category) {
        renderNotFound(response);
        return;
    }

    const items = (
        await categoryRepository.findItemsByCategoryId(
            categoryId,
        )
    );

    response.render("categories/show", {
        title: category.name,
        category,
        items,
    });
}

function showNewCategoryForm(
    _request,
    response,
) {
    renderForm(response, {
        title: "New Category",
        category: {
            name: "",
            description: "",
        },
        errors: [],
        formAction: "/categories/new",
        submitLabel: "Create category",
    });
}

async function createCategory(
    request,
    response,
) {
    const category = normalizeCategory(
        request.body,
    );
    const errors = validateCategory(category);

    if (errors.length > 0) {
        renderForm(response, {
            title: "New Category",
            category,
            errors,
            formAction: "/categories/new",
            submitLabel: "Create category",
            statusCode: 400,
        });
        return;
    }

    try {
        const createdCategory = (
            await categoryRepository.create(category)
        );

        response.redirect(
            `/categories/${createdCategory.id}`,
        );
    } catch (error) {
        if (error.code !== "23505") {
            throw error;
        }

        errors.push(
            "A category with this name already exists.",
        );

        renderForm(response, {
            title: "New Category",
            category,
            errors,
            formAction: "/categories/new",
            submitLabel: "Create category",
            statusCode: 400,
        });
    }
}

async function showEditCategoryForm(
    request,
    response,
) {
    const categoryId = parseCategoryId(
        request.params.categoryId,
    );

    if (categoryId === null) {
        renderNotFound(response);
        return;
    }

    const category = await categoryRepository.findById(
        categoryId,
    );

    if (!category) {
        renderNotFound(response);
        return;
    }

    renderForm(response, {
        title: "Edit Category",
        category,
        errors: [],
        formAction: `/categories/${categoryId}/edit`,
        submitLabel: "Save changes",
    });
}

async function updateCategory(
    request,
    response,
) {
    const categoryId = parseCategoryId(
        request.params.categoryId,
    );

    if (categoryId === null) {
        renderNotFound(response);
        return;
    }

    const category = normalizeCategory(
        request.body,
    );
    const errors = validateCategory(category);

    if (errors.length > 0) {
        renderForm(response, {
            title: "Edit Category",
            category,
            errors,
            formAction: `/categories/${categoryId}/edit`,
            submitLabel: "Save changes",
            statusCode: 400,
        });
        return;
    }

    try {
        const updatedCategory = (
            await categoryRepository.update(
                categoryId,
                category,
            )
        );

        if (!updatedCategory) {
            renderNotFound(response);
            return;
        }

        response.redirect(
            `/categories/${updatedCategory.id}`,
        );
    } catch (error) {
        if (error.code !== "23505") {
            throw error;
        }

        errors.push(
            "A category with this name already exists.",
        );

        renderForm(response, {
            title: "Edit Category",
            category,
            errors,
            formAction: `/categories/${categoryId}/edit`,
            submitLabel: "Save changes",
            statusCode: 400,
        });
    }
}

module.exports = {
    listCategories,
    showCategory,
    showNewCategoryForm,
    createCategory,
    showEditCategoryForm,
    updateCategory,
};
