const express = require('express');
const intersection = require('lodash/intersection');

const app = express();

const byCloseness = (a, b) => b.closeness - a.closeness;
const sortAndFilter = (results) => (
  Object.keys(results).map((key) => results[key]).sort(byCloseness)
);
const getApproximateCloseness = (candidate, handTiles) => {
  const common = intersection(candidate, handTiles);
  return Math.floor((common.length / 14.0) * 100);
};

const getExactCloseness = (candidate, handTiles) => {
  const matchCandidates = [].concat(handTiles);
  const ourMatch = [];

  candidate.forEach((tile) => {
    const index = matchCandidates.indexOf(tile);

    if (index !== -1) {
      ourMatch.push(matchCandidates.splice(index, 1));
    }
  });

  return (ourMatch.length / 14) * 100;
};

const MARGIN = 10;

const parser = (filename) => (req, res) => {
  const results = {};
  const match = req.params.tiles.split('');
  const lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(filename),
  });

  const findMatch = (line) => {
    const [name, key] = line.split(',');
    const candidate = key.split('');

    const closeness = getApproximateCloseness(candidate, match);

    const thisMatch = { name, key, closeness };
    const bestMatch = results[name] || { name, key, closeness: 0 };

    if (thisMatch.closeness > (bestMatch.closeness - MARGIN)) {
      thisMatch.closeness = getExactCloseness(candidate, match);

      if (thisMatch.closeness > bestMatch.closeness) {
        results[name] = thisMatch;
      }
    }
  };

  lineReader.on('line', findMatch);
  lineReader.on('close', () => {
    res.json(sortAndFilter(results));
  });
};

app.get('/hands/1/:tiles', parser('xaa'));
app.get('/hands/2/:tiles', parser('xab'));
app.get('/hands/3/:tiles', parser('xac'));
app.get('/hands/4/:tiles', parser('xad'));
app.get('/hands/5/:tiles', parser('xae'));
app.get('/hands/6/:tiles', parser('xaf'));

module.exports = app;
