const Request = require('request-promise-native');
const debug = require('debug')('guilds');
const bbPromise = require('bluebird');
const titleCase = require('title-case');
const cheerio = require('cheerio');
const { query } = require('./db/index.js');

const handleGuildPage = async (html) => {
  try {
    // Parse guild page with cheerio
    const $ = cheerio.load(html);
    let guildLinks = [];
    let guildNames = [];

    $('.view-content-guilds-filter tbody .view-field-node-title').each((i, elm) => {
      guildLinks.push(`https://www.argentarchives.org${$('a', elm).attr('href')}`);
      guildNames.push($('a', elm).text());
    });

    // Get link to 5 most recently edited guilds
    guildLinks = guildLinks.slice(0, 5);
    guildNames = guildNames.slice(0, 5);

    // Request guild page, parse it with cheerio, get character links
    // Append character links along with guild name (as obj) to result array

    return result;
  } catch (err) {
    throw err;
  }
};

const getCharacterInfo = async (oCharacter) => {
  try {
    // Get node id and guild name from parameter
    // Get name, race from page
    // Save name, race, guild association/relationship
  } catch (err) {
    throw err;
  }
};

// Get guilds page
(async () => {
  try {
    const main = Request({
      uri: 'https://www.argentarchives.org/guilds',
      headers: {
        'User-Agent': 'Request-Promise',
      },
      json: true,
    })
      .then(async (res) => {
        debug('Received AA guild page.');
        // Parse guild page with cheerio
        // Get link to 5 most recently edited guilds
        // Return array of objects: character node IDs, name of guild they're in
        const characters = await handleGuildPage(res)
          .catch((err) => {
            throw err;
          });

        // Iterate through array of characters
        // Each job gets character page
        // Gets name, race
        // Saves name, race, guild (received)
        await bbPromise.each(characters, (currentValue, index, length) => { // eslint-disable-line
          const job = getCharacterInfo(currentValue)
            .catch((err) => {
              throw err;
            });

          return job;
        });

        return true;
      })
      .catch((err) => {
        throw err;
      });

    await main;

    process.exit(0);
  } catch (err) {
    debug(JSON.stringify(err));
    const stack = err.stack.split('\n');
    stack.forEach((line) => {
      debug('ERROR:', line);
    });
    throw err;
  }
})();
