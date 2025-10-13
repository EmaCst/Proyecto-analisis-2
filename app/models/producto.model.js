module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define("producto", {
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
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    marca: {
      type: DataTypes.STRING(100),
    },
    modelo: {
      type: DataTypes.STRING(100),
    },
    imagenUrl: {
      type: DataTypes.STRING(255),
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  return Producto;
};
