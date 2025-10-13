module.exports = (sequelize, DataTypes) => {
  const Talla = sequelize.define("talla", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numero: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
  });

  return Talla;
};
