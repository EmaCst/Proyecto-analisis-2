module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define("rol", {
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
  return Rol;
};
