var debug, normalizeComparator, normalizeHashFcn, ref;

debug = require('debug')('loopback:mixins:filters');

ref = require('./normalize'), normalizeComparator = ref.normalizeComparator, normalizeHashFcn = ref.normalizeHashFcn;

exports.sortGroupBy = function(comparator, callback, options) {
  var a, grouped, i, results;
  a = this;
  results = [];
  if (a.length === 0) {
    return results;
  }
  comparator = normalizeComparator(comparator, options);
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
  var a, e, grouped, hash, hashTable, i;
  a = this;
  if (a.length === 0) {
    return [];
  }
  hashFcn = normalizeHashFcn(hashFcn);
  hashTable = {};
  i = 0;
  while (i < a.length) {
    e = a[i];
    hash = hashFcn(e, i, a);
    grouped = hashTable[hash];
    hashTable[hash] = callback(grouped || null, e);
    ++i;
  }
  return Object.keys(hashTable).map(function(hash) {
    return hashTable[hash];
  });
};
