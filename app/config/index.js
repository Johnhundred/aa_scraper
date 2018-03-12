require('dotenv').config();

const vars = {
  env: process.env.NODE_ENV || 'development',

  development: {
    neo4jUrl: process.env.NEO4J_URL,
    neo4jUser: process.env.NEO4J_USER,
    neo4jPass: process.env.NEO4J_PASSWORD,
    batchSize: parseInt(process.env.LOBBYFACTS_BATCH_SIZE, 10) || 100,
  },
};

module.exports = vars;
