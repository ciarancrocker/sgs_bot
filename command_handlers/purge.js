const db = require('../lib/database');
const logger = require('../lib/logging');
const messageHelpers = require('../lib/message_helpers');

const {CFG_PURGE_LOG} = process.env;

if (process.env.FEAT_UTIL) {
  module.exports = {
    bind: 'purge',
    handler: async function(message) {
      const args = message.content.split(' ').slice(1);

      // the first argument is non-optional, fail if not provided
      if (args.length < 1) {
        await messageHelpers.sendError(message,
          'You must specify a number of messages to be deleted');
        return;
      }

      const n = Number(args[0]);
      if (isNaN(n)) {
        await messageHelpers.sendError(message, `Invalid argument for n: ${n}`);
        return;
      }

      // the user must be in a channel for this command to be useful
      if (!message.channel) {
        await messageHelpers.sendError(message,
          `You must send this command from a channel for it to be useful`);
        return;
      }

      // delete the messages
      await fetchDeleteMessagesRecursive(message.channel, n, message.id, message.author.id);
      await message.delete();
    },
    help: 'Purge the last <n> messages from the channel this command' +
    ' is invoked in.',
    administrative: true,
  };
}

/**
 * Fetch and delete messages from a channel.
 * @param {*} channel Channel to delete messages from
 * @param {*} count Number of messages to delete
 * @param {*} before The message ID to use as a before value
 * @param {*} purgedBy The user ID of the user initiating the purge
 */
async function fetchDeleteMessagesRecursive(channel, count, before, purgedBy) {
  // limit each request to up to 100 (Discord API maximum)
  const requestedCount = (count > 100) ? 100 : count;
  const msgs = await channel.fetchMessages({
    limit: requestedCount,
    before,
  });
  const messages = msgs.array();
  logger.log('debug', `Requested ${requestedCount} messages for purge, got ${messages.length}`);
  if (messages.length > 0) {
    // log them all in the database if configured
    if (CFG_PURGE_LOG) {
      for (let msg of messages) {
        await db.pool.query(
          'INSERT INTO purge_log (message_id, author_id, content, purged_by, timestamp) VALUES ($1, $2, $3, $4, $5)',
          [msg.id, msg.author.id, msg.content, purgedBy, msg.createdAt]
        );
      }
    }
    // if there's still more to request, and there are actually more messages to delete
    if (count > 100 && messages.length == requestedCount) {
      const minMsgId = messages.map((x) => x.id).reduce((pre, cur) => (pre < cur) ? pre : cur);
      logger.log('debug', `Recursing further with count ${count - 100}`);
      await fetchDeleteMessagesRecursive(channel, count - 100, minMsgId, purgedBy);
    }
    await channel.bulkDelete(messages, true);
  }
  return;
}
