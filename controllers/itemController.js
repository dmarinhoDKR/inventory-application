const itemRepository = require(
    "../repositories/itemRepository",
);

function renderNotFound(response) {
    return response.status(404).render("404", {
        title: "Item not found",
    });
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
    const itemId = Number(
        request.params.itemId,
    );

    if (
        !Number.isInteger(itemId) ||
        itemId <= 0
    ) {
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

module.exports = {
    listItems,
    showItem,
};
