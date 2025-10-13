module.exports = (app) => {
  const productoPromocion = require("../controllers/productopromocion.controller.js");
  const router = require("express").Router();

  router.post("/create", productoPromocion.create);
  router.get("/", productoPromocion.findAll);
  router.delete("/delete/:id", productoPromocion.delete);

  app.use("/api/producto-promocion", router);
};
