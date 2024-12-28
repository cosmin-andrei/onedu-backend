// backend/migrations/XXXXXX-add_initiala_tatalui_to_formulare230.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('formulare230', 'initiala_tatalui', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '' // sau orice valoare implicită consideri potrivită
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('formulare230', 'initiala_tatalui');
  }
};
