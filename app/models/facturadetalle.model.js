module.exports = (sequelize, DataTypes) => {
  const FacturaDetalle = sequelize.define("facturaDetalle", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  });

  // Relaciones: facturaId, inventarioId
  return FacturaDetalle;
};
