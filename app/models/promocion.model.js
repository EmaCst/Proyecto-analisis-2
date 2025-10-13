module.exports = (sequelize, DataTypes) => {
  const Promocion = sequelize.define("promocion", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
    },
    descuento: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false, // porcentaje (10 = 10%)
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  return Promocion;
};
