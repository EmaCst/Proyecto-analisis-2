module.exports = (sequelize, DataTypes) => {
  const EstadoEnvio = sequelize.define("estadoEnvio", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false, // "procesando", "preparado", "en tránsito", "entregado"
    },
  });

  return EstadoEnvio;
};
