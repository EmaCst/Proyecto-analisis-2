// Importamos módulos
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: "*", // Permite cualquier origen para pruebas desde Postman/Thunder
};
app.use(cors(corsOptions));

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión con la base de datos
const db = require("./app/models");
db.sequelize.sync();
// Si necesitas reiniciar las tablas, descomenta esto:
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// Ruta base
app.get("/", (req, res) => {
  res.json({ message: "Bienvenido a nuestro Cine" });
});

// ==========================
//   RUTAS DEL PROYECTO
// ==========================

// Importamos rutas de facturas con controller que acepta tarjetas crudas
require("./app/routes/factura.routes.js")(app);
require("./app/routes/inventario.routes")(app);
require("./app/routes/promocion.routes")(app);
require("./app/routes/productopromocion.routes")(app);
require("./app/routes/estadoenvio.routes")(app);

// ==========================
//   RUTAS CON ROUTERS EXTERNOS
// ==========================
const usuarioRoutes = require("./app/routes/usuario.routes.js");
const productoRoutes = require("./app/routes/producto.routes.js");
const tallaRoutes = require("./app/routes/talla.routes.js");
const colorRoutes = require("./app/routes/color.routes.js");
const sucursalRoutes = require("./app/routes/sucursal.routes.js");
const carritoDetalleRoutes = require("./app/routes/carritoDetalle.routes.js");
const wishlistDetalleRoutes = require("./app/routes/wishlistdetalle.routes");
const carritoRoutes = require("./app/routes/carrito.routes");
const wishlistRoutes = require("./app/routes/wishlist.routes");
const estadoEnvioRoutes = require("./app/routes/estadoenvio.routes");

app.use("/api/estadoEnvios", estadoEnvioRoutes); 
app.use("/api/wishlists", wishlistRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/wishlistDetalles", wishlistDetalleRoutes);
app.use("/api/carritodetalles", carritoDetalleRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/tallas", tallaRoutes);
app.use("/api/colores", colorRoutes);
app.use("/api/sucursales", sucursalRoutes);

// ==========================
//   SERVIDOR
// ==========================
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
