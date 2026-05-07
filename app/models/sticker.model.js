module.exports = (sequelize, Sequelize) => {
  const Sticker = sequelize.define("stickers", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false
    },
    emocion: {
      type: Sequelize.STRING, 
      allowNull: false
    },
    descripcion: {
      type: Sequelize.STRING 
    }
  });

  return Sticker;
};