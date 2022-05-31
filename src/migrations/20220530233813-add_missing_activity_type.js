// LEGENDE
// _i = insufficient balance
// _s = Success
// _f = fail
//
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface
      .changeColumn('activity', 'type', {
        type: DataTypes.ENUM(
          'depositAccepted',
          'depositComplete',
          'withdrawRequested',
          'withdrawAccepted',
          'withdrawComplete',
          'withdrawRejected',
          'login_s',
          'login_f',
          'logout_s',
          'withdraw_f',
        ),
      });
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface
      .changeColumn('activity', 'type', {
        type: DataTypes.ENUM(
          'depositAccepted',
          'depositComplete',
          'withdrawRequested',
          'withdrawAccepted',
          'withdrawComplete',
          'withdrawRejected',
          'login_s',
          'login_f',
          'logout_s',
        ),
      });
  },
};
