var debug, normalizeComparator, normalizeHashFcn, ref;

debug = require('debug')('loopback:mixins:filters');

ref = require('./normalize'), normalizeComparator = ref.normalizeComparator, normalizeHashFcn = ref.normalizeHashFcn;

exports.mergeJoin = function(a2, comparator, callback, options) {
  var a1, a3, addCartesianJoin, addLeft, addRight, compare, getContiguousLength, i1, i2, len1, len2;
  a1 = this;
  a3 = [];
  comparator = normalizeComparator(comparator, options);
  if (!options || !options.sorted) {
    a1 = a1.slice().sort(comparator);
    a2 = a2.slice().sort(comparator);
  }
  getContiguousLength = function(src, start) {
    var i;
    if (start < src.length) {
      i = start + 1;
      while (i < src.length && comparator(src[start], src[i]) === 0) {
        i++;
      }
      return i - start;
    } else {
      return 0;
    }
  };
  addLeft = function(start, end) {
    var i, newElement;
    i = start;
    while (i < end) {
      newElement = callback(a1[i], null);
      if (newElement) {
        a3.push(newElement);
      }
      ++i;
    }
  };
  addRight = function(start, end) {
    var i, newElement;
    i = start;
    while (i < end) {
      newElement = callback(null, a2[i]);
      if (newElement) {
        a3.push(newElement);
      }
      ++i;
    }
  };
  addCartesianJoin = function(start1, end1, start2, end2) {
    var i1, i2, newElement;
    i1 = start1;
    while (i1 < end1) {
      i2 = start2;
      while (i2 < end2) {
        newElement = callback(a1[i1], a2[i2]);
        if (newElement) {
          a3.push(newElement);
        }
        ++i2;
      }
      ++i1;
    }
  };
  i1 = 0;
  i2 = 0;
  if (a1.length && a2.length) {
    len1 = getContiguousLength(a1, i1);
    len2 = getContiguousLength(a2, i2);
    while (i1 < a1.length && i2 < a2.length) {
      compare = comparator(a1[i1], a2[i2]);
      if (compare === 0) {
        addCartesianJoin(i1, i1 + len1, i2, i2 + len2);
        i1 += len1;
        i2 += len2;
        len1 = getContiguousLength(a1, i1);
        len2 = getContiguousLength(a2, i2);
      } else if (compare < 0) {
        addLeft(i1, i1 + len1);
        i1 += len1;
        len1 = getContiguousLength(a1, i1);
      } else {
        addRight(i2, i2 + len2);
        i2 += len2;
        len2 = getContiguousLength(a2, i2);
      }
    }
  }
  addLeft(i1, a1.length);
  addRight(i2, a2.length);
  return a3;
};

exports.hashJoin = function(a2, hashFcn, callback) {
  var a1, a3, addCallback, hash, hashBucket, hashTable, hashed, hashedEntry, i, scanned, scannedEntry;
  a1 = this;
  a3 = [];
  addCallback = void 0;
  hashFcn = normalizeHashFcn(hashFcn);
  hashed = void 0;
  scanned = void 0;
  if (a1.length < a2.length) {
    hashed = a1;
    scanned = a2;
    addCallback = function(h, s) {
      var newElement;
      newElement = callback(h, s);
      if (newElement) {
        a3.push(newElement);
      }
    };
  } else {
    hashed = a2;
    scanned = a1;
    addCallback = function(h, s) {
      var newElement;
      newElement = callback(s, h);
      if (newElement) {
        a3.push(newElement);
      }
    };
  }
  if (hashed.length === 0) {
    scanned.forEach(function(e) {
      addCallback(null, e);
    });
    return a3;
  } else if (scanned.length === 0) {
    hashed.forEach(function(e) {
      addCallback(e, null);
    });
    return a3;
  }
  hashTable = {};
  hash = void 0;
  hashBucket = void 0;
  i = 0;
  while (i < hashed.length) {
    hashedEntry = hashed[i];
    hash = hashFcn(hashedEntry, i, hashed);
    hashBucket = hashTable[hash];
    if (hashBucket) {
      hashBucket.push({
        used: false,
        e: hashedEntry
      });
    } else {
      hashTable[hash] = [
        {
          used: false,
          e: hashedEntry
        }
      ];
    }
    ++i;
  }
  i = 0;
  while (i < scanned.length) {
    scannedEntry = scanned[i];
    hash = hashFcn(scannedEntry, i, scanned);
    hashBucket = hashTable[hash];
    if (hashBucket) {
      hashBucket.forEach(function(hashedEntry) {
        addCallback(hashedEntry.e, scannedEntry);
        hashedEntry.used = true;
      });
    } else {
      addCallback(null, scannedEntry);
    }
    i++;
  }
  Object.keys(hashTable).forEach(function(hash) {
    hashTable[hash].forEach(function(hashedEntry) {
      if (!hashedEntry.used) {
        addCallback(hashedEntry.e, null);
      }
    });
  });
  return a3;
};
