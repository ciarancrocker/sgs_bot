const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const punycode = require('punycode');

if (process.env.FEAT_UTIL) {
  module.exports = {
    administrative: true,
    bind: 'emojify',
    handler: async function(message) {
      const word = message.content.split(' ').slice(1).join(' ');

      // check if all the letters are unique; if they aren't we can't do this
      if (word.length != (new Set(word)).size) {
        await message.author.send('The message you specified cannot be used');
        await message.delete();
        return;
      }

      const messageBeforeLast = (await message.channel.messages.fetch({limit: 1, before: message.id})).first();
      const baseEmojiId = parseInt('1F1E6', 16);

      for (let character of word) {
        if (character != ' ') {
          await messageBeforeLast.react(punycode.ucs2.encode([baseEmojiId + alphabet.indexOf(character)]));
        }
      }
      await message.delete();
    },
  };
}
