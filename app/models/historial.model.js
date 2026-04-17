module.exports = (sequelize, DataTypes) => {
  const Historial = sequelize.define("Historial", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'historial_chats'
  });

  return Historial;
};