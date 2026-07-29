function getHome(_request, response) {
    response.render("index", {
        title: "Computer Parts Inventory",
    });
}

module.exports = {
    getHome,
};
