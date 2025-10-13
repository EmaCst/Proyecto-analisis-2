module.exports = (sequelize, Sequelize) => {
  const FacturaEncabezado = sequelize.define("facturaEncabezado", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    subtotal: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    iva: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
  });

  return FacturaEncabezado;
};
