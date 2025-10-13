module.exports = (app) => {
  const roles = require("../controllers/rol.controller.js");
  const router = require("express").Router();

  // Crear rol
  router.post("/create", roles.create);

  // Obtener todos los roles
  router.get("/", roles.findAll);

  // Obtener un rol por ID
  router.get("/:id", roles.findOne);

  // Actualizar rol
  router.put("/update/:id", roles.update);

  // Eliminar rol
  router.delete("/delete/:id", roles.delete);

  app.use("/api/roles", router);
};
