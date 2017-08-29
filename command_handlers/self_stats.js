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
    const param1 = message.content.split(' ')[1] || '10';
    const param2 = message.content.split(' ')[2] || 10;
    const userId = await database.findOrCreateUser(message.author);
    let data = [];

    if (isNaN(param1)) {
      data = await database.getUserGameStatisticsString(userId, param1, param2);
    } else {
      data = await database.getUserGameStatistics(userId, parseInt(param1));
    }

    const table = new Table();
    table.setHeading(['Rank', 'Game', 'Time Played']);
    for (let i = 0; i < data.length; i++) {
      table.addRow([(i+1), data[i].name, formatInterval(data[i].time)]);
    }
    textHelpers.paginateMessage(message, table.toString());
  },
  help: 'Show your game statistics',
};
