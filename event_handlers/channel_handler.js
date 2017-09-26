const db = require('../lib/database');
const winston = require('winston');

/**
 * Get the modal element in an array
 *
 * @param {*[]} arr -  Array to find mode of
 * @return {*} Modal element
 */
function mode(arr) {
  return arr.sort((a, b) =>
    arr.filter((v) => v===a).length
    - arr.filter((v) => v===b).length
  ).pop();
}

/**
 * Update the name of a channel based on it's members presence
 *
 * @param {Channel} channel - The channel to be updated
 */
async function updateChannel(channel) {
  // see if this is a channel we're managing
  const channelQuery = await db.pool.query(
    'SELECT * FROM channels WHERE discord_id = $1',
    [channel.id]
  );
  if (channelQuery.rowCount > 0) { // yes, we are managing it
    const channelMembers = channel.members.array();
    let channelName = channelQuery.rows[0].name;
    if (channelMembers.length > 0) {
      const presences = channelMembers.filter((m) => m.presence.activity)
        .map((m) => m.presence.activity.name);
      winston.debug(channelMembers.map((m) => m.presence.activity));
      if (presences.length > 0) {
        const modalGame = mode(presences);
        channelName = `${channelName} (${modalGame})`;
      }
    }
    if (channelName == channel.name) {
      winston.log('debug', 'Skipping update for "%s" (no change in name)',
        channel.name);
    } else {
      setChannelName(channel, channelName);
    }
  }
}

/**
 * Wrapper function to set a channel's name
 *
 * @param {Channel} channel - Channel whose name should be changed
 * @param {string} newName - New name for specified channel
 * @return {Promise} Promise for setting the name
 */
function setChannelName(channel, newName) {
  const oldName = channel.name;
  return channel.setName(newName).then(() => {
    winston.log('info', 'Channel changed from "%s" to "%s"', oldName, newName);
  }).catch((err) => {
    winston.log('error', 'Error changing channel name for channel "%s" (%d)',
      oldName, channel.id);
  });
}

/**
 * Convenience function for generating lists for temporary channel provisioning
 *
 * @param {Guild} guild - The guild for which channel management is taking place
 *
 * @return {Object} object with required arrays
 */
async function generateChannelLists(guild) {
  const managedChannels = (await db.pool.query('SELECT * FROM channels')).rows;
  const emptyManagedChannels = managedChannels.filter((mch) =>
    guild.channels.get(mch.discord_id).members.array().length == 0);
  const emptyTemporaryChannels = emptyManagedChannels
    .filter((emch) => emch.temporary).reverse();
  return {emptyManagedChannels, emptyTemporaryChannels};
}

/**
 * Handle provisioning and deprovisioning of temporary channels in a guild based
 * on channel occupancy.
 *
 * @param {Guild} guild - The Guild for which channel management should take
 *   place
 */
async function provisionTemporaryChannels(guild) {
  // first lets figure out if we need a temporary channels
  let {emptyManagedChannels, emptyTemporaryChannels} =
    await generateChannelLists(guild);

  winston.log('debug', '%s empty managed channels',
    emptyManagedChannels.length);
  if (emptyManagedChannels.length == 0) {
    // we need to make a temporary channel
    // first get the current newest channel for it's position
    const newestChannelId = await db.getNewestChannelId();
    const newestChannel = guild.channels.get(newestChannelId);

    // then we create the channel
    const channelNumber = await db.getNextChannelNumber();
    const channelName = `Temporary Channel ${channelNumber}`;
    winston.log('debug', 'Creating new temporary channel "%s"', channelName);
    // create it in discord
    const newChannel = await guild.createChannel(channelName, 'voice');
    if (newestChannel.parent) {
      await newChannel.setParent(newestChannel.parent);
    }
    await newChannel.setPosition(newestChannel.position + 1);
    // insert it in the db
    await db.createChannel(newChannel, channelNumber);
  } else if (emptyManagedChannels.length > 1) {
    // we might need to delete some temporary channels
    winston.log('debug', 'Scanning for empty temporary channels');
    while (emptyManagedChannels.length > 1) {
      // get and delete the newest temporary channel
      const channelToBeDeleted = emptyTemporaryChannels[0];
      winston.log('debug', 'Deleting temporary channel %s',
        channelToBeDeleted.name);
      await guild.channels.get(channelToBeDeleted.discord_id).delete();
      await db.deleteChannel(channelToBeDeleted.discord_id);
      // regenerate the lists
      const newValues = await generateChannelLists(guild);
      managedChannels = newValues.managedChannels;
      emptyManagedChannels = newValues.emptyManagedChannels;
      emptyTemporaryChannels = newValues.emptyTemporaryChannels;
    }
  }
}

/**
 * Handle the voice state update generated by Discord.js
 *
 * @param {GuildMember} before - Member before the update
 * @param {GuildMember} after - Member after the update
 */
function handleVoiceStateUpdate(before, after) {
  // do renaming
  if (before.voiceChannelID != null) {
    updateChannel(before.guild.channels.get(before.voiceChannelID));
  }
  if (after.voiceChannelID != null) {
    updateChannel(after.guild.channels.get(after.voiceChannelID));
  }

  // do temporary channels
  provisionTemporaryChannels(after.guild);
}

module.exports.handleVoiceStateUpdate = handleVoiceStateUpdate;
