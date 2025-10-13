module.exports = (app) => {
  const estadoEnvio = require("../controllers/estadoEnvio.controller.js");
  const router = require("express").Router();

  // Crear un nuevo estado
  router.post("/create", estadoEnvio.create);

  // Obtener todos los estados
  router.get("/", estadoEnvio.findAll);

  // Actualizar un estado por ID
  router.put("/:id", estadoEnvio.update);

  // Eliminar un estado por ID
  router.delete("/:id", estadoEnvio.delete);

  // Montar el router en la ruta base
  app.use("/api/estadoenvios", router);
};
