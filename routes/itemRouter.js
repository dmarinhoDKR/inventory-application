const { Router } = require("express");

const itemController = require(
    "../controllers/itemController",
);

const itemRouter = Router();

itemRouter.get(
    "/",
    itemController.listItems,
);

itemRouter.get(
    "/:itemId",
    itemController.showItem,
);

module.exports = itemRouter;
