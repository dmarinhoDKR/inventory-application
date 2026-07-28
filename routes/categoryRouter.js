const { Router } = require("express");

const categoryController = require(
    "../controllers/categoryController",
);

const categoryRouter = Router();

categoryRouter.get(
    "/",
    categoryController.listCategories,
);

categoryRouter.get(
    "/new",
    categoryController.showNewCategoryForm,
);

categoryRouter.post(
    "/new",
    categoryController.createCategory,
);

categoryRouter.get(
    "/:categoryId/edit",
    categoryController.showEditCategoryForm,
);

categoryRouter.post(
    "/:categoryId/edit",
    categoryController.updateCategory,
);

categoryRouter.get(
    "/:categoryId",
    categoryController.showCategory,
);

module.exports = categoryRouter;
