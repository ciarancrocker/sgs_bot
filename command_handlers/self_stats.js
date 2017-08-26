const database = require('../lib/database');
const moment = require('moment');
require('moment-duration-format');
const textHelpers = require('../lib/text_helpers');
const Table = require('ascii-table');

const formatInterval = function(interval) {
  return moment.duration(interval).format();
};

module.exports = {
  bind: 'self_stats',
  handler: async function(message) {
    const limit = textHelpers.getLimitFromMessage(message.content, 10);

    const userId = await database.findOrCreateUser(message.author);
    const data = await database.getUserGameStatistics(userId, limit);
    const table = new Table();
    table.setHeading(['Rank', 'Game', 'Time Played']);
    for (let i = 0; i < data.length; i++) {
      table.addRow([(i+1), data[i].name, formatInterval(data[i].time)]);
    }
    textHelpers.paginateMessage(message, table.toString());
  },
  help: 'Show your game statistics',
};
