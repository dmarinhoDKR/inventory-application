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
    "/:categoryId",
    categoryController.showCategory,
);

module.exports = categoryRouter;
