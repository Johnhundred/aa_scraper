require('dotenv').config();

const vars = {
  env: process.env.NODE_ENV || 'development',

  development: {
    neo4jUrl: process.env.NEO4J_URL,
    neo4jUser: process.env.NEO4J_USER,
    neo4jPass: process.env.NEO4J_PASSWORD,
  },

  production: {
    neo4jUrl: process.env.GRAPHENEDB_BOLT_URL,
    neo4jUser: process.env.GRAPHENEDB_BOLT_USER,
    neo4jPass: process.env.GRAPHENEDB_BOLT_PASSWORD,
  },
};

module.exports = vars;
