// routes/catalogo.routes.js
module.exports = (app) => {
  const catalogo = require("../controllers/catalogo.controller.js");
  const router = require("express").Router();

  router.get("/", catalogo.getAll);
  router.get("/:id", catalogo.getById);

  app.use("/api/catalogo", router);
};
