const db = require("../models");
const FacturaEncabezado = db.facturaEncabezados;
const facturaDetalles = db.facturaDetalles;
const ventas = db.ventas;
const sucursales = db.sucursales;
const Productos = db.productos;
const { Sequelize } = db;

exports.getVentasPorSucursal = async (req, res) => {
  try {
    const [resultados] = await db.sequelize.query(`
      SELECT 
        s."id" AS "sucursalId",
        s."nombre" AS "sucursalNombre",
        SUM(fd."subtotal") AS "totalVentas",
        COUNT(DISTINCT fe."id") AS "cantidadFacturas",
        SUM(fe."iva") AS "totalIVA",
        MAX(fe."fecha") AS "ultimaVenta"
      FROM "facturaEncabezados" fe
      JOIN "facturaDetalles" fd ON fe."id" = fd."facturaId"
      JOIN "inventarios" i ON fd."inventarioId" = i."id"
      JOIN "sucursals" s ON i."sucursalId" = s."id"
      GROUP BY s."id", s."nombre"
      ORDER BY s."nombre" ASC;
    `);

    res.json(resultados);
  } catch (error) {
    console.error("❌ Error al obtener ventas por sucursal:", error);
    res.status(500).json({ message: "Error al obtener ventas por sucursal", error });
  }
};

// 🔹 NUEVO: Ventas totales agrupadas por tiempo (día, mes o año)
exports.getVentasPorTiempo = async (req, res) => {
  try {
    const ventas = await FacturaEncabezado.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("fecha")), "fecha"],
        [Sequelize.fn("SUM", Sequelize.col("total")), "totalVentas"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "cantidadFacturas"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("fecha"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("fecha")), "ASC"]],
    });

    res.json(ventas);
  } catch (error) {
    console.error("❌ Error al obtener ventas por tiempo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.getParesVendidosPorTiempo = async (req, res) => {
  try {
    const datos = await facturaDetalles.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("facturaEncabezado.createdAt")), "fecha"],
        [Sequelize.fn("SUM", Sequelize.col("facturaDetalle.cantidad")), "totalPares"],
      ],
      include: [
        {
          model: FacturaEncabezado,
          as: "facturaEncabezado",
          attributes: [],
        },
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("facturaEncabezado.createdAt"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("facturaEncabezado.createdAt")), "ASC"]],
      raw: true,
    });

    res.json(datos);
  } catch (error) {
    console.error("❌ Error al obtener los pares vendidos por tiempo:", error);
    res.status(500).json({
      mensaje: "Error al obtener los pares vendidos por tiempo",
      error: error.message,
    });
  }
};