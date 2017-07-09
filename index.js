const Discord = require('discord.js');
const client = new Discord.Client();
const _ = require('lodash');
const winston = require('winston');

require('dotenv').config();

const channel_handler = require('./channel_handler');
const presence_handler = require('./presence_handler');
const message_handler = require('./message_handler');

winston.configure({
  transports: [
    new (winston.transports.Console)({
      timestamp: true,
    }),
    new (winston.transports.File)({
      filename: 'sgs_bot.log',
    }),
  ],
});

client.on('ready', () => {
  winston.log('info', 'Logged into Discord as %s', client.user.tag);
  // set creepy presence
  client.user.setPresence({
    status: 'online',
    afk: false,
    game: {
      name: '100% fresh dank memes',
      url: '',
    },
  }).then(() => {
    winston.log('info', 'Presence set.');
  });
  winston.log('info', 'Using %s as prefix for commands', process.env.COMMAND_PREFIX);
});

client.on('presenceUpdate', presence_handler.handlePresenceUpdate);
client.on('voiceStateUpdate', channel_handler.handleVoiceStateUpdate);
client.on('message', message_handler.dispatchMessage);

client.login(process.env.DISCORD_KEY);
