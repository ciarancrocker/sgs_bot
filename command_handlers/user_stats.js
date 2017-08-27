const database = require('../lib/database');
const moment = require('moment');
require('moment-duration-format');
const textHelpers = require('../lib/text_helpers');
const messageHelpers = require('../lib/message_helpers');
const Table = require('ascii-table');

const formatInterval = function(interval) {
  return moment.duration(interval).format();
};

module.exports = {
  bind: 'user_stats',
  handler: async function(message) {
    // argument 0 is the user to search for, but we use the mentions wrapper
    // because it's nice
    const mentions = message.mentions.members.array();
    if (mentions.length == 0) {
      await messageHelpers.sendError(message, 'No user specified');
      return;
    }
    const targetUser = mentions[0].user;

    // argument 1 should be the limit
    const limit = textHelpers.getLimitFromMessage(message.content, 10);
    const userId = await database.findOrCreateUser(targetUser);
    const data = await database.getUserGameStatistics(userId, limit);
    const table = new Table();
    table.setHeading(['Rank', 'Game', 'Time Played']);
    for (let i = 0; i < data.length; i++) {
      table.addRow([(i+1), data[i].name, formatInterval(data[i].time)]);
    }
    textHelpers.paginateMessage(message, table.toString());
  },
  help: 'Show game statistics for the specified user',
  administrative: true,
};
