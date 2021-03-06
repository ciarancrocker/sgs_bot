const logger = require('../logging');

module.exports = function(pool) {
  const queries = {
    findUserQuery: 'SELECT id FROM users WHERE discord_id = $1 LIMIT 1',
    createUserQuery: 'INSERT INTO users (discord_id, display_name) VALUES ($1, $2) RETURNING id',
    userAuthenticationQuery: 'SELECT true FROM permissions WHERE array[discord_id] <@ $1',
  };

  return {
    findOrCreateUser: async function(discordUser) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN TRANSACTION');
        const searchResult = await client.query(queries['findUserQuery'], [discordUser.id]);
        if (searchResult.rowCount == 1) {
          // user was found
          logger.log('debug', `Found user ID ${searchResult.rows[0].id} for Discord ID ${discordUser.id}`);
          await client.query('COMMIT');
          return searchResult.rows[0].id;
        } else {
          // user was not found, create it
          const createResult = await client.query(queries['createUserQuery'], [discordUser.id, discordUser.tag]);
          logger.log('debug', `Created new user ID ${createResult.rows[0].id} for Discord ID ${discordUser.id}`);
          await client.query('COMMIT');
          return createResult.rows[0].id;
        }
      } catch (e) {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    },

    isUserAuthenticated: async function(guildMember) {
      const ids = guildMember.roles.cache.keyArray();
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
    },
  };
};
