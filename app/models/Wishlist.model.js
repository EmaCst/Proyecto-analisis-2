module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define("wishlist", {
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

  // Relaciones: usuarioId
  return Wishlist;
};
