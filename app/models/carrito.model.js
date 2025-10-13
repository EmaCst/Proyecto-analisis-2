module.exports = (sequelize, DataTypes) => {
  const Carrito = sequelize.define("carrito", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    creadoEn: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return Carrito;
};
