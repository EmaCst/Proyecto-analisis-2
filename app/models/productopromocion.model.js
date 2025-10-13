module.exports = (sequelize, DataTypes) => {
  const ProductoPromocion = sequelize.define("productoPromocion", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  });

  // Las relaciones productoId y promocionId se establecerán luego
  return ProductoPromocion;
};
