# SGS Bot

[![Build Status](https://travis-ci.org/ciarancrocker/sgs_bot.svg?branch=master)](https://travis-ci.org/ciarancrocker/sgs_bot)

A Discord bot made for the [Swansea Gaming Society](https://sugaming.co.uk).
Includes amazing features like:

* Automatic channel renaming - Help identify what games are being played in
which channel at a glance
* Game statistics tracking - Provides insights for server operators as to what
games are popular

## Planned features

* Burst channels - Automatically create and delete voice channels if existing
ones get full
* Rich events tools - Tools to coordinate community event management

## Running the bot

The bot is currently under heavy development, and as such I don't reccommend
running it in any kind of production or heavy traffic environment unless you
plan on dealing with the pain and suffering that will ensue.

The bot is not designed to be connected to multiple servers at this time, so if
you want the bot to be in different servers, you'll need to run multiple bots.

Make sure you have at least the following installed:

* Node.js version 8 or higher - the bot makes use of async functions defined in
the ECMA 2017 draft, which is only supported from version 8. Don't skimp.
* PostgreSQL 9.6 or higher - Older versions will probably work, this is just
what I run it on to develop
* gnuplot and ghostscript

The bot has only ever been tested to run on Linux; if you can get it to run on
Windows, send in a pull request with updated docs!

1. Clone the repository and check out whatever version you want to use (for now,
   master is your only real option)
2. Run `yarn` in the directory you cloned into to grab the dependencies
3. Copy the `.env.example` file to `.env` and set the configuration directives
   appropriately.
4. Import the schema file in the root of the repository into an empty database
   in Postgres. Make sure the owner of the tables, sequences and roles is set
   appropriately for what you set in the env file.
5. Start the bot with `node index.js` and pray.

To test the bot with eslint run `npm run test`. This will run eslint over all the code. If you'd
rather run this test and then launch the bot run `npm run dev` which will do this for you as well.
