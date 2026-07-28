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
    "/new",
    itemController.showNewItemForm,
);

itemRouter.post(
    "/new",
    itemController.createItem,
);

itemRouter.get(
    "/:itemId/edit",
    itemController.showEditItemForm,
);

itemRouter.post(
    "/:itemId/edit",
    itemController.updateItem,
);

itemRouter.get(
    "/:itemId",
    itemController.showItem,
);

module.exports = itemRouter;
