var debug;

debug = require('debug')('loopback:mixins:filters');

exports.sortGroupBy = function(comparator, callback, options) {
  var a, grouped, i, results;
  a = this;
  results = [];
  if (a.length === 0) {
    return results;
  }
  if (!options || !options.sorted) {
    a = a.slice().sort(comparator);
  }
  grouped = callback(null, a[0]);
  i = 1;
  while (i < a.length) {
    if (comparator(a[i - 1], a[i]) === 0) {
      grouped = callback(grouped, a[i]);
    } else {
      results.push(grouped);
      grouped = callback(null, a[i]);
    }
    ++i;
  }
  results.push(grouped);
  return results;
};

exports.hashGroupBy = function(hashFcn, callback) {
  var a, e, grouped, hash, i, results;
  a = this;
  results = {};
  if (a.length === 0) {
    return [];
  }
  i = 0;
  while (i < a.length) {
    e = a[i];
    hash = hashFcn(e, i, a);
    grouped = results[hash];
    results[hash] = callback(grouped || null, e);
    ++i;
  }
  return Object.keys(results).map(function(hash) {
    return results[hash];
  });
};
