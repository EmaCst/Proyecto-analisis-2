module.exports = (app) => {
  const promociones = require("../controllers/promocion.controller.js");
  const router = require("express").Router();

  router.post("/create", promociones.create);
  router.get("/", promociones.findAll);
  router.get("/:id", promociones.findOne);
  router.put("/update/:id", promociones.update);
  router.delete("/delete/:id", promociones.delete);

  app.use("/api/promociones", router);
};
