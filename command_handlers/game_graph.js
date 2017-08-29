const database = require('../lib/database');
require('moment-duration-format');
const plot = require('plotter').plot;

module.exports = {
  bind: 'game_graph',
  handler: async function(message) {
    const param1 = message.content.split(' ')[1] || '9';
    const param2 = message.content.split(' ')[2] || 9;
    const days = 30;
    let games = 9;
    let data = [];

    if (isNaN(param1)) {
      data = await database.getGameGraphString(param2, param1, days);
      games = param2;
    } else {
      data = await database.getGameGraph(parseInt(param1), days);
      games = parseInt(param1);
    }

    let toPlot = {};
    for (let i = 0; i < data.length; i++ ) {
      toPlot[data[i].name] = [];
    }
    for (let i = 0; i < data.length; i++) {
      let formated = '0:0';
      if (typeof data[i].time.hours !== 'undefined') {
        formated = data[i].time.hours + ':' + data[i].time.minutes;
      } else {
        formated = '0:' + data[i].time.minutes;
      }
      toPlot[data[i].name].push(formated);
    }

    plot({
      data: toPlot,
      title: 'Time played for top ' + games + ' games',
      xlabel: 'Days',
      ylabel: 'Hours played',
      filename: 'graph.png',
      finish: function() {
        message.reply('', {
          file: 'graph.png',
        }, );
      },
    }, );
  },
  help: 'Show game graph for the server',
};
