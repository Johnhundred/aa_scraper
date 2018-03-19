const Request = require('request-promise-native');
const debug = require('debug')('index');
const bbPromise = require('bluebird');
const titleCase = require('title-case');
const cheerio = require('cheerio');
const { query } = require('./db/index.js');

const handleMain = async (html) => {
  const $ = cheerio.load(html);
  const characterNames = [];
  const characterLinks = [];
  const nodeIds = [];

  $('.view-content-adventures-bydate tbody .view-field-users-name').each((i, elm) => {
    characterLinks.push(`https://www.argentarchives.org${$('a', elm).attr('href')}`);
    characterNames.push($('a', elm).text());
    let temp = $('a', elm).attr('href');
    temp = temp.split('node/');
    nodeIds.push(temp[1]);
  });

  const result = {
    characterLinks,
    characterNames,
    nodeIds,
  };

  return result;
};

const saveMain = async (obj) => {
  try {
    await bbPromise.each(obj.characterNames, (currentValue, index, length) => { // eslint-disable-line
      const job = query(
        `MERGE (c:Character {node_id: {node_id}})
        SET c.name = {name}`,
        {
          name: titleCase(currentValue).trim(),
          node_id: parseInt(obj.nodeIds[index], 10),
        },
      )
        .catch((err) => {
          throw err;
        });

      debug('Character saved.');
      return job;
    });

    return true;
  } catch (err) {
    throw err;
  }
};

const getCharacterLinks = async (links, nodeId) => {
  try {
    await bbPromise.each(links, (currentValue, index, length) => { // eslint-disable-line
      const job = Request({
        uri: currentValue.link,
        headers: {
          'User-Agent': 'Request-Promise',
        },
        json: true,
      })
        .then(async (res) => {
          debug('Received AA page.');
          let isCharacter = false;
          const $ = cheerio.load(res);
          $('.breadcrumb a').each((i, elm) => {
            if ($(elm).text() === 'People') {
              isCharacter = true;
            }
          });

          if (isCharacter) {
            let name = null;
            let guild = null;

            $('.people').each((i, elm) => {
              if (i === 0) {
                name = $('.people:first-child tr:first-child td', elm).text();
                name = name.trim();
              }

              if (i === 1) {
                guild = $('tr td a', elm).text();
                guild = titleCase(guild).trim();
              }
            });

            let temp = $('div.ntype-usernode').attr('id');
            temp = temp.split('-');
            const newNodeId = temp[1];

            if (guild !== '' && guild.toLowerCase() !== 'none' && guild !== '-') {
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
            } else {
              await query(
                `MERGE (c:Character {node_id: {node_id}})
                SET c.name = {name}`,
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

    return true;
  } catch (err) {
    throw err;
  }
};

const handleCharacter = async (html, nodeId) => {
  try {
    const $ = cheerio.load(html);
    let guild = null;
    const linkedCharacters = [];

    $('.people').each((i, elm) => {
      if (i === 1) {
        guild = $('tr td a', elm).text();
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

    guild = titleCase(guild).trim();
    if (guild !== '' && guild.toLowerCase() !== 'none' && guild !== '-') {
      await query(
        `MATCH (c:Character {node_id: {node_id}})
        MERGE (g:Guild {name: {name}})
        MERGE (g)<-[r:MEMBER_OF]-(c)`,
        {
          name: guild,
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
    const character = Request({
      uri: link,
      headers: {
        'User-Agent': 'Request-Promise',
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
    const main = Request({
      uri: 'https://www.argentarchives.org/',
      headers: {
        'User-Agent': 'Request-Promise',
      },
      json: true,
    })
      .then(async (res) => {
        debug('Received AA main page.');
        const obj = await handleMain(res)
          .catch((err) => {
            throw err;
          });

        await saveMain(obj)
          .catch((err) => {
            throw err;
          });

        await bbPromise.each(obj.characterLinks, (currentValue, index, length) => { // eslint-disable-line
          const job = getCharacterInfo(currentValue, obj.nodeIds[index])
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
