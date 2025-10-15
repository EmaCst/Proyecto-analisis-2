// usamos la función requiere para cargar el modulo db.config.js para traer los parametros preconfigurados de la BD
const dbConfig = require("../config/db.config.js");
// cargamos el modulo sequelize "ORM" para el manejo de las entidades como objetos. 
const Sequelize = require("sequelize");
// creamos una variable sequelize y la inicializamos como un Objeto Sequelize con la informacion de la BD 
const DataTypes = Sequelize.DataTypes;

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  dialectOptions: {
    ssl:{
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
    // si utilizamos una BD externa, probablemente nos pida ssl = true, cambios la linea de reject por la que esta comentada
    /* ssl:{ requiere: true}*/
    ssl: {
      rejectUnauthorized: false
    }
  }
});
// creamos un objeto db
const db = {};
// la variable db.Sequelize = modulo importado Sequelize que esta declarado previamente donde se importa el modulo
db.Sequelize = Sequelize;
// se define una variable con la configuracion de sequelize
db.sequelize = sequelize;
// se crea una variable clientes que importa el modelo que esta dentro de la carpeta models/cliente.model.js


// ================== IMPORTACIÓN DE MODELOS ==================
db.usuarios = require("./usuario.model.js")(sequelize, DataTypes);
db.sucursales = require("./sucursal.model.js")(sequelize, DataTypes);
db.productos = require("./producto.model.js")(sequelize, DataTypes);
db.tallas = require("./talla.model.js")(sequelize, DataTypes);
db.colores = require("./color.model.js")(sequelize, DataTypes);
db.inventarios = require("./inventario.model.js")(sequelize, DataTypes);
db.promociones = require("./promocion.model.js")(sequelize, DataTypes);
db.productoPromociones = require("./productopromocion.model.js")(sequelize, DataTypes);
db.carritos = require("./carrito.model.js")(sequelize, DataTypes);
db.carritoDetalles = require("./carritodetalle.model.js")(sequelize, DataTypes);
db.facturaEncabezados = require("./facturaencabezado.model.js")(sequelize, DataTypes);
db.facturaDetalles = require("./facturadetalle.model.js")(sequelize, DataTypes);
db.estadoEnvios = require("./estadoenvio.model.js")(sequelize, DataTypes);
db.envios = require("./envio.model.js")(sequelize, DataTypes);
db.wishlists = require("./Wishlist.model.js")(sequelize, DataTypes);
db.wishlistDetalles = require("./wishlistdetalle.model.js")(sequelize, DataTypes);

// ================= RELACIONES =================

// Productos, Colores, Tallas, Sucursales, Inventario
db.productos.hasMany(db.inventarios, { foreignKey: "productoId" });
db.colores.hasMany(db.inventarios, { foreignKey: "colorId" });
db.tallas.hasMany(db.inventarios, { foreignKey: "tallaId" });
db.sucursales.hasMany(db.inventarios, { foreignKey: "sucursalId" });

db.inventarios.belongsTo(db.productos, { foreignKey: "productoId" });
db.inventarios.belongsTo(db.colores, { foreignKey: "colorId" });
db.inventarios.belongsTo(db.tallas, { foreignKey: "tallaId" });
db.inventarios.belongsTo(db.sucursales, { foreignKey: "sucursalId" });

// Promociones y Productos (Many-to-Many)
db.promociones.belongsToMany(db.productos, {
  through: db.productoPromociones,
  foreignKey: "promocionId",
  otherKey: "productoId",
});
db.productos.belongsToMany(db.promociones, {
  through: db.productoPromociones,
  foreignKey: "productoId",
  otherKey: "promocionId",
});

// Carrito y Carrito Detalle
db.usuarios.hasOne(db.carritos, { foreignKey: "usuarioId" });
db.carritos.belongsTo(db.usuarios, { foreignKey: "usuarioId" });

db.carritos.hasMany(db.carritoDetalles, { foreignKey: "carritoId" });
db.carritoDetalles.belongsTo(db.carritos, { foreignKey: "carritoId" });

db.inventarios.hasMany(db.carritoDetalles, { foreignKey: "inventarioId" });
db.carritoDetalles.belongsTo(db.inventarios, { foreignKey: "inventarioId" });

// Envíos
db.estadoEnvios.hasMany(db.envios, { foreignKey: "estadoId" });
db.envios.belongsTo(db.estadoEnvios, { foreignKey: "estadoId" });

db.facturaEncabezados.hasOne(db.envios, { foreignKey: "facturaId" });
db.envios.belongsTo(db.facturaEncabezados, { foreignKey: "facturaId" });

// Wishlist
db.usuarios.hasMany(db.wishlists, { foreignKey: "usuarioId" });
db.wishlists.belongsTo(db.usuarios, { foreignKey: "usuarioId" });

db.wishlists.hasMany(db.wishlistDetalles, { foreignKey: "wishlistId" });
db.wishlistDetalles.belongsTo(db.wishlists, { foreignKey: "wishlistId" });

db.inventarios.hasMany(db.wishlistDetalles, { foreignKey: "inventarioId" });
db.wishlistDetalles.belongsTo(db.inventarios, { foreignKey: "inventarioId" });

// FacturaEncabezado -> Usuario
db.usuarios.hasMany(db.facturaEncabezados, { foreignKey: "usuarioId" });
db.facturaEncabezados.belongsTo(db.usuarios, { foreignKey: "usuarioId" });

// FacturaEncabezado -> Promocion 
db.promociones.hasMany(db.facturaEncabezados, { foreignKey: "promocionId" });
db.facturaEncabezados.belongsTo(db.promociones, { foreignKey: "promocionId" });

// FacturaEncabezado -> FacturaDetalle
db.facturaEncabezados.hasMany(db.facturaDetalles, { foreignKey: "facturaId" });
db.facturaDetalles.belongsTo(db.facturaEncabezados, { foreignKey: "facturaId" });

// Inventario -> FacturaDetalle (para tener talla/color)
db.inventarios.hasMany(db.facturaDetalles, { foreignKey: "inventarioId" });
db.facturaDetalles.belongsTo(db.inventarios, { foreignKey: "inventarioId" });


module.exports = db;
