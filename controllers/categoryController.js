const categoryRepository = require(
    "../repositories/categoryRepository",
);

function renderNotFound(response) {
    return response.status(404).render("404", {
        title: "Category not found",
    });
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
    const categoryId = Number(
        request.params.categoryId,
    );

    if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
    ) {
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

module.exports = {
    listCategories,
    showCategory,
};
