const neo4j = require('neo4j-driver').v1;
const debug = require('debug')('db');
const config = require('../config');

const { neo4jUrl, neo4jUser, neo4jPass } = config[config.env];
const driver = neo4j.driver(neo4jUrl, neo4j.auth.basic(neo4jUser, neo4jPass));

process.on('exit', (code) => {
  debug(`Process exiting with code ${code}.`);
  driver.close();
  process.exit(code);
});

process.on('uncaughtException', (err) => {
  debug(`Caught exception: ${err}\n`);
  driver.close();
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  debug(`Caught unhandledRejection: ${err}\n`);
  // driver.close();
  // process.exit(0);
});

const query = async (queryText, params) => {
  try {
    const session = driver.session();

    const result = await session
      // eslint-disable-next-line
      // .run('MERGE (james:Person {name : {nameParam} }) RETURN james.name AS name', { nameParam: 'James' })
      .run(queryText, params)
      .then((result) => { // eslint-disable-line
        session.close();
        return result;
      })
      .catch((error) => {
        session.close();
        throw error;
      });

    return result;
  } catch (err) {
    throw err;
  }
};

const saveData = async (queryText, params) => {
  try {
    debug('Saving data - executing query.');

    await query(queryText, params)
      .catch((err) => {
        throw err;
      });

    debug('Query executed, data saved, relation(s) created.');
    return true;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  query,
  saveData,
};
