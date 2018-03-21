const Request = require('request-promise-native');
const debug = require('debug')('index');
const bbPromise = require('bluebird');
const titleCase = require('title-case');
const cheerio = require('cheerio');
const { query } = require('./db/index.js');

const includeHeaders = (body, response, resolveWithFullResponse) => { // eslint-disable-line
  const obj = {
    headers: response.headers,
    data: body,
  };

  return obj;
};

const getCharacterLinks = async (links, nodeId) => {
  try {
    await bbPromise.each(links, (currentValue, index, length) => { // eslint-disable-line
      // uri: `http://localhost:46464/?url=${currentValue.link}`,
      const job = Request({
        uri: currentValue.link,
        headers: {
          'User-Agent': 'AA-Network-Scraper-Promise',
        },
        json: true,
        transform: includeHeaders,
      })
        .then(async (res) => {
          debug('Received AA page.');
          let isCharacter = false;
          const $ = cheerio.load(res.data);
          $('.breadcrumb a').each((i, elm) => {
            if ($(elm).text() === 'People') {
              isCharacter = true;
            }
          });

          if (isCharacter) {
            let name = null;
            let race = null;
            let guild = null;

            $('.people').each((i, elm) => {
              if (i === 0) {
                name = $('.people:first-child tr:first-child td', elm).text();
                name = name.trim();
              }

              if (i === 1) {
                race = $('.people:first-child tr:first-child td', elm).text();
                race = titleCase(race).trim();
                guild = $('tr td a', elm).text();
                guild = titleCase(guild).trim();
              }
            });

            let temp = $('div.ntype-usernode').attr('id');
            temp = temp.split('-');
            const newNodeId = temp[1];

            if (guild !== '' && guild.toLowerCase() !== 'none' && guild !== '-') {
              await query(
                `MERGE (g:Guild {name: {guild}}) WITH g
                MERGE (c:Character {node_id: {node_id}})
                SET c.name = {name},
                c.race = {race} WITH g, c
                MERGE (g)<-[rel:MEMBER_OF]-(c)`,
                {
                  name: titleCase(name).trim(),
                  race: titleCase(race).trim(),
                  node_id: parseInt(newNodeId, 10),
                  guild,
                },
              )
                .catch((err) => {
                  throw err;
                });
            } else {
              await query(
                `MERGE (c:Character {node_id: {node_id}})
                SET c.name = {name},
                c.race = {race}`,
                {
                  name: titleCase(name).trim(),
                  race: titleCase(race).trim(),
                  node_id: parseInt(newNodeId, 10),
                  guild,
                },
              )
                .catch((err) => {
                  throw err;
                });
            }

            const queryText = `MATCH (c:Character {node_id: {node_id}}) WITH c
              MATCH (ch:Character {node_id: {node_id_new}}) WITH c, ch
              MERGE (c)-[re:${currentValue.type.toUpperCase()}]->(ch)`;
            await query(
              queryText,
              {
                node_id: parseInt(nodeId, 10),
                node_id_new: parseInt(newNodeId, 10),
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
    });

    debug('Received character links.');
    return true;
  } catch (err) {
    throw err;
  }
};

const handleCharacter = async (html, nodeId) => {
  try {
    const $ = cheerio.load(html);
    let guild = null;
    let race = null;
    const linkedCharacters = [];

    $('.people').each((i, elm) => {
      if (i === 1) {
        guild = $('tr td a', elm).text();
        race = $('.people tr:nth-child(1) td', elm).text();
      }

      if (i === 3) {
        $('.people tr:nth-child(1) td a', elm).each((ii, elem) => {
          let character = $(elem).attr('href');
          const lastThree = character[character.length - 4];
          if (lastThree !== '.png' && lastThree !== '.jpg' && lastThree !== 'jpeg' && lastThree !== '.gif' && character.indexOf('/files') === -1) {
            if (character[0] !== 'h') {
              character = `https://www.argentarchives.org${character}`;
            }

            if (character.indexOf('argentarchives.org') !== -1) {
              character = {
                type: 'friend',
                link: character,
              };
              linkedCharacters.push(character);
            }
          }
        });

        $('.people tr:nth-child(2) td a', elm).each((ii, elem) => {
          let character = $(elem).attr('href');
          const lastThree = character[character.length - 4];
          if (lastThree !== '.png' && lastThree !== '.jpg' && lastThree !== 'jpeg' && lastThree !== '.gif' && character.indexOf('/files') === -1) {
            if (character[0] !== 'h') {
              character = `https://www.argentarchives.org${character}`;
            }

            if (character.indexOf('argentarchives.org') !== -1) {
              character = {
                type: 'related',
                link: character,
              };
              linkedCharacters.push(character);
            }
          }
        });

        $('.people tr:nth-child(3) td a', elm).each((ii, elem) => {
          let character = $(elem).attr('href');
          const lastThree = character[character.length - 4];
          if (lastThree !== '.png' && lastThree !== '.jpg' && lastThree !== 'jpeg' && lastThree !== '.gif' && character.indexOf('/files') === -1) {
            if (character[0] !== 'h') {
              character = `https://www.argentarchives.org${character}`;
            }

            if (character.indexOf('argentarchives.org') !== -1) {
              character = {
                type: 'rival',
                link: character,
              };
              linkedCharacters.push(character);
            }
          }
        });
      }

      if (i === 4) {
        $('.people tr:nth-child(1) td a', elm).each((ii, elem) => {
          let character = $(elem).attr('href');
          const lastThree = character[character.length - 4];
          if (lastThree !== '.png' && lastThree !== '.jpg' && lastThree !== 'jpeg' && lastThree !== '.gif' && character.indexOf('/files') === -1) {
            if (character[0] !== 'h') {
              character = `https://www.argentarchives.org${character}`;
            }

            if (character.indexOf('argentarchives.org') !== -1) {
              character = {
                type: 'loves',
                link: character,
              };
              linkedCharacters.push(character);
            }
          }
        });

        $('.people tr:nth-child(2) td a', elm).each((ii, elem) => {
          let character = $(elem).attr('href');
          const lastThree = character[character.length - 4];
          if (lastThree !== '.png' && lastThree !== '.jpg' && lastThree !== 'jpeg' && lastThree !== '.gif' && character.indexOf('/files') === -1) {
            if (character[0] !== 'h') {
              character = `https://www.argentarchives.org${character}`;
            }

            if (character.indexOf('argentarchives.org') !== -1) {
              character = {
                type: 'hates',
                link: character,
              };
              linkedCharacters.push(character);
            }
          }
        });
      }
    });

    race = titleCase(race).trim();
    guild = titleCase(guild).trim();
    if (guild !== '' && guild.toLowerCase() !== 'none' && guild !== '-') {
      await query(
        `MERGE (c:Character {node_id: {node_id}})
        SET c.race = {race} WITH c
        MERGE (g:Guild {name: {name}}) WITH c, g
        MERGE (g)<-[r:MEMBER_OF]-(c)`,
        {
          name: guild,
          race,
          node_id: parseInt(nodeId, 10),
        },
      )
        .catch((err) => {
          throw err;
        });
    }

    await getCharacterLinks(linkedCharacters, nodeId)
      .catch((err) => {
        throw err;
      });

    return true;
  } catch (err) {
    throw err;
  }
};

const getCharacterInfo = async (link, nodeId) => {
  try {
    // uri: `http://localhost:46464/?url=${link}`,
    const character = Request({
      uri: link,
      headers: {
        'User-Agent': 'AA-Network-Scraper-Promise',
      },
      json: true,
    })
      .then(async (res) => {
        debug('Received AA page.');
        await handleCharacter(res, nodeId)
          .catch((err) => {
            throw err;
          });

        return true;
      })
      .catch((err) => {
        throw err;
      });

    return character;
  } catch (err) {
    throw err;
  }
};

(async () => {
  try {
    let stragglers = await query(
      `MATCH (c:Character) WHERE NOT EXISTS(c.updated_last) WITH c
      RETURN c.node_id AS node_id LIMIT 10`,
      {},
    )
      .catch((err) => {
        throw err;
      });

    debug(stragglers);

    if (stragglers.records.length < 10) {
      const newLimit = 10 - stragglers.records.length;
      const extras = await query(
        `MATCH (c:Character) WHERE EXISTS(c.updated_last) WITH c
        RETURN c.node_id AS node_id ORDER BY c.updated_last ASC LIMIT ${newLimit}`,
        {},
      )
        .catch((err) => {
          throw err;
        });

      stragglers = stragglers.records.concat(extras.records);
    }

    await bbPromise.each(stragglers.records, (currentValue, index, length) => { // eslint-disable-line
      debug('Beginning one record.');
      const nodeId = currentValue.get('node_id');
      const nodeLink = `https://www.argentarchives.org/node/${nodeId}`;

      const job = getCharacterInfo(nodeLink, nodeId)
        .catch((err) => {
          throw err;
        });

      return job;
    });

    await bbPromise.each(stragglers.records, (currentValue, index, length) => { // eslint-disable-line
      const nodeId = currentValue.get('node_id');

      const job = query(
        'MERGE (c:Character {node_id: {node_id}}) SET c.updated_last = timestamp()',
        {
          node_id: nodeId,
        },
      )
        .catch((err) => {
          throw err;
        });

      debug('Finished updating the timestamp of one record.');
      return job;
    });

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
