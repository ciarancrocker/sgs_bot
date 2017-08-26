const database = require('../lib/database');
const moment = require('moment');
require('moment-duration-format');
const textHelpers = require('../lib/text_helpers');
const plot = require('plotter').plot;

const formatInterval = function(interval) {
  return moment.duration(interval).format();
};

module.exports = {
  bind: 'game_graph',
  handler: async function(message) {
    let games = textHelpers.getLimitFromMessage(message.content, 5);
    if (games > 9) {
      games = 9; // Limit for now because 10 seems to break things
    }
    const days = 30;
  
    const data = await database.getGameGraph(games, days);
  
    var toPlot = {};
    for (let i = 0; i < games; i++ ) {
      toPlot[data[i].name] = [];
    }
    for (let i = 0; i < data.length; i++) {
      toPlot[data[i].name].push(data[i].time.hours + ':' + data[i].time.minutes);
    }

    plot({
      data: toPlot,
      title: 'Time played for top ' + games + ' games',
      xlabel: 'Days',
      ylabel: 'Hours played',
      filename: 'graph.png',
      finish: function() {
        message.reply('', {
          file: 'graph.png'
        });
      }
    }); 
  },
  help: 'Show game graph for the server',
};
