const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const winston = require('winston');

const handler = async function(message) {
  if (!message.guild) {
    await messageHelpers.sendError(message,
      'This command must be run within a server.');
    return;
  }

  const roleName = message.content.split(' ').slice(1).join(' ');
  const userRoles = message.member.roles.array()
    .filter((el) => el.name == roleName);
  if (userRoles.length == 0) {
    await messageHelpers.sendError(message,
      'You are not a member of the specified role.');
    return;
  }

  // verify the role is bot managed
  const dbResult = await db.pool.query(
    'SELECT true FROM bot_roles WHERE discord_id = $1',
    [userRoles[0].id]
  );
  if (dbResult.rowCount == 0) {
    await messageHelpers.sendError(message,
      'The specified role is not managed by this bot.');
    return;
  }

  await message.member.removeRole(userRoles[0]);
  await message.reply(`You were removed from the role ${userRoles[0].name}`);
  winston.log(
    'info',
    `User ${message.author.tag} was removed from the role ${userRoles[0].name}`
  );
};

module.exports = {
  bind: 'leave_role',
  handler: handler,
  help: 'Leave a role managed by this bot',
};