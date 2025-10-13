module.exports = (sequelize, DataTypes) => {
  const Color = sequelize.define("color", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  });

  return Color;
};
