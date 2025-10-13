module.exports = (sequelize, DataTypes) => {
  const CarritoDetalle = sequelize.define("carritoDetalle", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  // Relaciones: carritoId, inventarioId
  return CarritoDetalle;
};
