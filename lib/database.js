require('dotenv').config();

const pg = require('pg');
const winston = require('winston');

const queries = require('../data/queries.json');

const pool = module.exports.pool = new pg.Pool({
  user: process.env.PG_USERNAME,
  host: process.env.PG_HOSTNAME,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
});

module.exports.findOrCreateUser = async function(discordUser) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION');
    const searchResult = await client.query(queries['findUserQuery'],
      [discordUser.id]);
    if (searchResult.rowCount == 1) {
      // user was found
      winston.log('debug', 'Found user ID %s for Discord ID %s',
        searchResult.rows[0].id, discordUser.id);
      await client.query('COMMIT');
      return searchResult.rows[0].id;
    } else {
      // user was not found, create it
      const createResult = await client.query(queries['createUserQuery'],
        [discordUser.id, discordUser.tag]);
      winston.log('debug', 'Created new user ID %s for Discord ID %s',
        createResult.rows[0].id, discordUser.id);
      await client.query('COMMIT');
      return createResult.rows[0].id;
    }
  } finally {
    client.release();
  }
};

module.exports.findOrCreateGame = async function(gameName) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION');
    const searchResult = await client.query(queries['findGameQuery'],
      [gameName]);
    if (searchResult.rowCount == 1) {
      // game was found
      winston.log('debug', 'Found game ID %s for game %s',
        searchResult.rows[0].id, gameName);
      await client.query('COMMIT');
      return searchResult.rows[0].id;
    } else {
      const createResult = await client.query(queries['createGameQuery'],
        [gameName]);
      winston.log('debug', 'Created new game ID %s for game %s',
        createResult.rows[0].id, gameName);
      await client.query('COMMIT');
      return createResult.rows[0].id;
    }
  } finally {
    client.release();
  }
};

module.exports.createNewSession = async function(userId, gameId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION');
    const values = [userId, gameId, new Date(), 'in_progress'];
    const createResult = await client.query(queries['createNewSessionQuery'],
      values);
    winston.log('debug', 'Created new session (%s) for user %s playing %s',
      createResult.rows[0].id, userId, gameId);
    await client.query('COMMIT');
    return createResult.rows[0].id;
  } finally {
    client.release();
  }
};

module.exports.endSession = async function(userId, gameId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION');
    const discoverResult = await client.query(queries['sessionDiscoverQuery'],
      [userId, gameId]);
    if (discoverResult.rowCount == 0) {
      // silently do nothing
      return;
    }
    const endResult = await client.query(queries['sessionEndQuery'],
      [new Date(), discoverResult.rows[0].id]);
    await client.query('COMMIT');
    winston.log('debug', 'Ended session (%s) for user %s playing %s',
      endResult.rows[0].id, userId, gameId);
    return;
  } finally {
    client.release();
  }
};

module.exports.getGameStatistics = async function(limit) {
  const selectResult = await pool.query(queries['gameStatisticsQuery'],
    [limit]);
  return selectResult.rows;
};

module.exports.getGameStatisticsString = async function(game, limit) {
  const selectResult = await pool.query(queries['gameStatisticsQueryString'],
    [game + '*', limit]);
  return selectResult.rows;
};

module.exports.getUserGameStatistics = async function(userId, limit) {
  const selectResult = await pool.query(queries['userGameStatisticsQuery'],
    [userId, limit]);
  return selectResult.rows;
};

module.exports.getGameGraph = async function(games, days) {
  const selectResult = await pool.query(queries['gameGraphQuery'],
    [games, days]);
  return selectResult.rows;
};

module.exports.isUserAuthenticated = async function(guildMember) {
  let ids = guildMember.roles.keyArray();
  ids.push(guildMember.id);

  // send off the query
  const result = await pool.query(queries['userAuthenticationQuery'], [ids]);
  if (result.rowCount > 0) {
    // They're authenticated, hooray!
    return true;
  } else {
    // He's not an admin, he's a very naughty member!
    return false;
  }
};
