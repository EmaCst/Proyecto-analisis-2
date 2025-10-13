module.exports = (sequelize, DataTypes) => {
  const Envio = sequelize.define("envio", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    direccionEnvio: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fechaCreacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    fechaActualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  // Relaciones: facturaId, estadoId
  return Envio;
};
