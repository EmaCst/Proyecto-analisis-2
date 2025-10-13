module.exports = (sequelize, DataTypes) => {
  const Inventario = sequelize.define("inventario", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  // Relaciones se definirán en index.js (productoId, sucursalId, colorId, tallaId)
  return Inventario;
};
