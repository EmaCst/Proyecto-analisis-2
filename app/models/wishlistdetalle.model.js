module.exports = (sequelize, DataTypes) => {
  const WishlistDetalle = sequelize.define("wishlistDetalle", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  });

  // Relaciones: wishlistId, productoId
  return WishlistDetalle;
};
