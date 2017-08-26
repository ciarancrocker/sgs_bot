const winston = require('winston');

/**
 * Paginate a text message so it fits inside Discord's message character
 * limit
 *
 * @param {Object} message - Discord.js Message which is replied to
 * @param {string} textToSend - Message to be sent
 */
function paginateMessage(message, textToSend) {
  const limit = 1950;
  if (textToSend.length <= limit) {
    message.reply(textToSend, {code: true});
    return;
  }
  let split = Math.min(limit, textToSend.length);
  for (let i = limit; i > 0; i--) {
    if (textToSend[i] == '\n') {
      split = i;
      break;
    }
  }
  winston.log('debug', 'Splitting at %i', split);
  message.reply(
    textToSend.slice(0, Math.min(split, textToSend.length)),
    {code: true}
  );
  paginateMessage(message, textToSend.slice(split));
}

/**
 * Get a result limit from the specified message, constraining it to values
 * that aren't obscene.
 *
 * @param {Object} message - Discord.js Message object from which to get value
 * @return {number} Constrained limit from the message
 */
function getLimitFromMessage(message, defaultLimit) {
  let limit = defaultLimit;
  const argv = message.content.split(' ');
  if (argv.length > 1) {
    // try and get a limit from the message
    if (!isNaN(argv[1])) {
      limit = parseInt(argv[1]);
    }
  }

  // set an upper bound on the limit based on what type of message it is
  if (message.member) { // sent from a text channel
    limit = Math.min(limit, 25);
  } else { // sent from a DM
    limit = limit; // if they want to get spammed, they can get spammed.
  }
  return limit;
}

module.exports = {
  paginateMessage,
  getLimitFromMessage,
};
