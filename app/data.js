const debug = require('debug')('data');
const { query } = require('./db/index.js');
const express = require('express');
const titleCase = require('title-case');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

const color = (startNode) => {
  switch (startNode.race) {
    case 'Night Elf':
      startNode.group = 3;
      break;
    case 'Draenei':
      startNode.group = 4;
      break;
    case 'Human':
      startNode.group = 5;
      break;
    case 'Gnome':
      startNode.group = 6;
      break;
    case 'Dwarf':
      startNode.group = 7;
      break;
    case 'Orc':
      startNode.group = 8;
      break;
    case 'Troll':
      startNode.group = 9;
      break;
    case 'Tauren':
      startNode.group = 10;
      break;
    case 'Blood Elf':
      startNode.group = 11;
      break;
    case 'Undead':
      startNode.group = 12;
      break;
    case 'Worgen':
      startNode.group = 13;
      break;
    case 'Goblin':
      startNode.group = 14;
      break;
    case 'Pandaren':
      startNode.group = 15;
      break;
    case 'Nightborne':
      startNode.group = 16;
      break;
    case 'Void Elf':
      startNode.group = 17;
      break;
    case 'Lightforged Draenei':
      startNode.group = 18;
      break;
    case 'Highmountain Tauren':
      startNode.group = 19;
      break;
    default:
      startNode.group = 1;
  }

  return startNode;
};

const getSpecificData = async (name, chainLinks) => {
  try {
    let nodes = [];
    const links = [];
    const numberOfLinks = parseInt(chainLinks, 10);
    let queryText;

    if (numberOfLinks === 1) {
      queryText = 'MATCH path=({name: {name}})-[]-() RETURN *';
    } else if (numberOfLinks === 2) {
      queryText = 'MATCH path=({name: {name}})-[]-()-[]-() RETURN *';
    } else if (numberOfLinks === 3) {
      queryText = 'MATCH path=({name: {name}})-[]-()-[]-()-[]-() RETURN *';
    }

    const data = await query(
      queryText,
      {
        name,
      },
    )
      .catch((err) => {
        throw err;
      });

    const uniq = (a) => {
      const seen = {};
      return a.filter((item) => { // eslint-disable-line
        return seen.hasOwnProperty(item.id) ? false : (seen[item.id] = true); // eslint-disable-line
      });
    };

    data.records.forEach((record) => {
      let segments = [];
      record._fields.forEach((field) => { // eslint-disable-line
        if (field.hasOwnProperty('segments')) { // eslint-disable-line
          segments = segments.concat(field.segments);
        }
      });

      segments.forEach((segment) => { // eslint-disable-line
        const start = segment.start; // eslint-disable-line
        let startNode = {
          id: start.properties.name,
          label: start.labels[0],
          race: start.properties.race,
          group: 1,
        };

        startNode = color(startNode);

        nodes.push(startNode);

        const end = segment.end; // eslint-disable-line
        let endNode = {
          id: end.properties.name,
          label: end.labels[0],
          race: end.properties.race,
          group: 1,
        };

        endNode = color(endNode);

        if (endNode.label === 'Guild') {
          endNode.group = 2;
        }

        nodes.push(endNode);

        const rel = segment.relationship; // eslint-disable-line
        const relData = {
          source: startNode.id,
          target: endNode.id,
          type: rel.type,
        };

        links.push(relData);
      });
    });

    nodes = uniq(nodes);

    const d3Data = {
      nodes,
      links,
    };

    return d3Data;

    // fs.writeFile('./wat.json', JSON.stringify(d3Data), (err) => {
    //   if (err) throw err;
    //   console.log('The file has been saved!');
    //   process.exit(0);
    //   return true;
    // });
  } catch (err) {
    throw err;
  }
};

const getAllData = async () => {
  try {
    let nodes = [];
    const links = [];

    const data = await query(
      'MATCH path=()-[]-() RETURN *',
      {
        name: 'Nymi',
      },
    )
      .catch((err) => {
        throw err;
      });

    const uniq = (a) => {
      const seen = {};
      return a.filter((item) => { // eslint-disable-line
        return seen.hasOwnProperty(item.id) ? false : (seen[item.id] = true); // eslint-disable-line
      });
    };

    data.records.forEach((record) => {
      let segments = [];
      record._fields.forEach((field) => { // eslint-disable-line
        if (field.hasOwnProperty('segments')) { // eslint-disable-line
          segments = segments.concat(field.segments);
        }
      });

      segments.forEach((segment) => { // eslint-disable-line
        const start = segment.start; // eslint-disable-line
        let startNode = {
          id: start.properties.name,
          label: start.labels[0],
          race: start.properties.race,
          group: 1,
        };

        startNode = color(startNode);

        nodes.push(startNode);

        const end = segment.end; // eslint-disable-line
        let endNode = {
          id: end.properties.name,
          label: end.labels[0],
          race: end.properties.race,
          group: 1,
        };

        endNode = color(endNode);

        if (endNode.label === 'Guild') {
          endNode.group = 2;
        }

        nodes.push(endNode);

        const rel = segment.relationship; // eslint-disable-line
        const relData = {
          source: startNode.id,
          target: endNode.id,
          type: rel.type,
        };

        links.push(relData);
      });
    });

    nodes = uniq(nodes);

    const d3Data = {
      nodes,
      links,
    };

    return d3Data;

    // fs.writeFile('./wat.json', JSON.stringify(d3Data), (err) => {
    //   if (err) throw err;
    //   console.log('The file has been saved!');
    //   process.exit(0);
    //   return true;
    // });
  } catch (err) {
    throw err;
  }
};

app.use(cors());
app.use(helmet());

app.get('/update/:name', async (req, res) => {
  const name = titleCase(req.params.name).trim();
  const data = await getSpecificData(name, 1);
  res.send(data);
});

app.get('/:name/:links', async (req, res) => {
  const name = titleCase(req.params.name).trim();
  const links = req.params.links;
  const data = await getSpecificData(name, links);
  res.send(data);
});

app.get('/', async (req, res) => {
  const data = await getAllData();
  res.send(data);
});

app.listen(PORT);
