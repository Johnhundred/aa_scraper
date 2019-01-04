const Request = require('request-promise-native');
const debug = require('debug')('guilds');
const bbPromise = require('bluebird');
const titleCase = require('title-case');
const cheerio = require('cheerio');
const { query } = require('./db/index.js');

const guildIds = [];

// Request guild page, parse it with cheerio, get character links
const getSingleGuild = async (link, guildName) => {
  try {
    const main = await Request({
      uri: link,
      headers: {
        'User-Agent': 'Request-Promise',
      },
      json: true,
    })
      .then(async (html) => {
        debug(`Received single guild page: ${guildName}`);
        // Parse guild page with cheerio
        const $ = cheerio.load(html);

        const characterLinks = [];

        const rawNodeId = $('div.node.ntype-guild').attr('id');
        if (typeof rawNodeId === 'undefined') {
          return [];
        }
        const aNodeId = rawNodeId.split('-');
        guildIds.push({
          node_id: aNodeId[1],
          name: guildName,
        });

        $('.view-content-guild-members tbody td.view-field-node-title').each((i, elm) => {
          // Append character links along with guild name (as obj) to result array
          const obj = {
            guildName,
          };

          obj.link = `https://www.argentarchives.org${$('a', elm).attr('href')}`;
          characterLinks.push(obj);
        });

        return characterLinks;
      })
      .catch((err) => {
        throw err;
      });


    await query(
      'MERGE (g:Guild {name: {name}})',
      {
        name: titleCase(guildName).trim(),
      },
    )
      .catch((err) => {
        throw err;
      });

    return main;
  } catch (err) {
    throw err;
  }
};

const handleGuilds = async (aNames) => {
  try {
    const guildLinks = [];
    const guildNames = [];
    const result = [];

    aNames.forEach((name) => {
      const newName = name.replace(' ', '%2520');
      guildNames.push(name);
      guildLinks.push(`https://www.argentarchives.org/freelinking/${newName}`);
    });

    await bbPromise.each(guildLinks, (currentValue, index, length) => { // eslint-disable-line
      // Request guild page, parse it with cheerio, get character links
      const job = getSingleGuild(currentValue, guildNames[index])
        .catch((err) => {
          throw err;
        });

      result.push(job);
      return job;
    });

    return result;
  } catch (err) {
    throw err;
  }
};

const getSingleCharacter = async (link, guildName) => {
  try {
    // Get single character page, save it
    const job = Request({
      uri: link,
      headers: {
        'User-Agent': 'Request-Promise',
      },
      json: true,
    })
      .then(async (res) => {
        let isCharacter = false;
        const $ = cheerio.load(res);
        $('.breadcrumb a').each((i, elm) => {
          if ($(elm).text() === 'People') {
            isCharacter = true;
          }
        });

        if (isCharacter) {
          let name = null;
          const guild = titleCase(guildName).trim();

          $('.people').each((i, elm) => {
            if (i === 0) {
              name = $('.people:first-child tr:first-child td', elm).text();
              name = name.trim();
            }
          });

          debug(`Received AA page of character: ${titleCase(name).trim()}`);

          let temp = $('div.ntype-usernode').attr('id');
          temp = temp.split('-');
          const newNodeId = temp[1];

          await query(
            `MATCH (g:Guild {name: {guild}})
            MERGE (c:Character {node_id: {node_id}})
            SET c.name = {name}
            MERGE (g)<-[rel:MEMBER_OF]-(c)`,
            {
              name: titleCase(name).trim(),
              node_id: parseInt(newNodeId, 10),
              guild,
            },
          )
            .catch((err) => {
              throw err;
            });
        }

        return true;
      })
      .catch((err) => {
        throw err;
      });

    return job;
  } catch (err) {
    throw err;
  }
};

const getCharacterInfo = async (aCharacters) => {
  try {
    if (aCharacters.length < 1) {
      debug('Skipping a guild due to having no members.');
      return;
    }

    // Get node id and guild name from parameter
    // Get name, race from page
    // Save name, race, guild association/relationship
    await bbPromise.each(aCharacters, (currentValue, index, length) => { // eslint-disable-line
      const job = getSingleCharacter(currentValue.link, currentValue.guildName)
        .catch((err) => {
          throw err;
        });

      return job;
    });
  } catch (err) {
    throw err;
  }
};

// Get guilds
(async () => {
  try {
    const stragglers = query(
      `MATCH (g:Guild) WHERE NOT EXISTS(g.updated_last) WITH g
      RETURN g.name AS name, ID(g) AS id LIMIT 50`,
      {},
    )
      .then(async (result) => {
        let names = [];

        result.records.forEach((record) => {
          names.push(record.get('name'));
        });

        const actualNames = [];
        actualNames.push(names[Math.floor(Math.random() * names.length)]);
        actualNames.push(names[Math.floor(Math.random() * names.length)]);
        actualNames.push(names[Math.floor(Math.random() * names.length)]);
        names = actualNames;
        debug(`Found guilds: ${names}`);

        // Parse guild page with cheerio
        // Get link to 5 most recently edited guilds
        // Return array of objects: character node IDs, name of guild they're in
        const characters = await handleGuilds(names)
          .catch((err) => {
            throw err;
          });

        const mergedCharacters = [].concat.apply([], characters); // eslint-disable-line

        // Iterate through array of characters
        // Each job gets character page
        // Gets name, race
        // Saves name, race, guild (received)
        await bbPromise.each(mergedCharacters, (currentValue, index, length) => { // eslint-disable-line
          const job = getCharacterInfo(currentValue)
            .catch((err) => {
              throw err;
            });

          return job;
        });

        // Save guild node IDs, set updated_last
        await query(
          `MATCH (g:Guild) WHERE g.name IN {guildNames}
          SET g.updated_last = timestamp()`,
          { guildNames: names },
        )
          .catch((err) => {
            throw err;
          });

        await bbPromise.each(guildIds, (currentValue) => { // eslint-disable-line
          const job = query(
            `MATCH (g:Guild) WHERE g.name = {name}
            SET g.node_id = {node_id}`,
            { name: currentValue.name, node_id: currentValue.node_id },
          )
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

    await stragglers;

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
