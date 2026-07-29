const express = require("express");
const path = require("node:path");

const indexRouter = require("./routes/indexRouter");
const categoryRouter = require(
    "./routes/categoryRouter",
);
const itemRouter = require("./routes/itemRouter");

const app = express();
const port = process.env.PORT || 3000;
const hostname = "0.0.0.0";

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.locals.appName = "PartShelf";

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/categories", categoryRouter);
app.use("/items", itemRouter);

app.use((_request, response) => {
    response.status(404).render("404", {
        title: "Page Not Found",
    });
});

if (require.main === module) {
    app.listen(port, hostname, () => {
        console.log(
            `PartShelf running at http://${hostname}:${port}`,
        );
    });
}

module.exports = app;
