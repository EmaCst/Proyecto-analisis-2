module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define("usuario", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    contrasena: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    direccion: {
      type: DataTypes.STRING(255),
    },
    telefono: {
      type: DataTypes.STRING(20),
    },
        Rol: {
      type: DataTypes.STRING(20),
      allowNull: false
  }
});

  return Usuario;
};
