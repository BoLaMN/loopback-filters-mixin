var debug;

debug = require('debug')('loopback:mixins:filters');

exports.mergeJoin = function(a2, comparator, callback, options) {
  var a1, a3, addCartesianJoin, addLeft, addRight, compare, getContiguousLength, i1, i2, len1, len2;
  a1 = this;
  a3 = [];
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
  var a1, a3, addCallback, hash, hashTable, hashed, hashedEntry, i, scanned, scannedEntry;
  a1 = this;
  a3 = [];
  addCallback = function(h, s) {
    var newElement;
    newElement = callback(h, s);
    if (newElement) {
      a3.push(newElement);
    }
  };
  if (a1.length < a2.length) {
    hashed = a1;
    scanned = a2;
  } else {
    hashed = a2;
    scanned = a1;
  }
  if (!hashed.length) {
    scanned.forEach(function(e) {
      return addCallback(null, e);
    });
    return a3;
  } else if (!scanned.length) {
    hashed.forEach(function(e) {
      return addCallback(e, null);
    });
    return a3;
  }
  hashTable = {};
  i = 0;
  while (i < hashed.length) {
    hashedEntry = hashed[i];
    hash = hashFcn(hashedEntry, i, hashed);
    if (hashTable[hash] == null) {
      hashTable[hash] = [];
    }
    hashTable[hash].push({
      used: false,
      e: hashedEntry
    });
    ++i;
  }
  i = 0;
  while (i < scanned.length) {
    scannedEntry = scanned[i];
    hash = hashFcn(scannedEntry, i, scanned);
    if (hashTable[hash]) {
      hashTable[hash].forEach(function(hashedEntry) {
        addCallback(hashedEntry.e, scannedEntry);
        hashedEntry.used = true;
      });
    } else {
      addCallback(null, scannedEntry);
    }
    i++;
  }
  Object.keys(hashTable).forEach(function(hash) {
    return hashTable[hash].forEach(function(hashedEntry) {
      if (!hashedEntry.used) {
        return addCallback(hashedEntry.e, null);
      }
    });
  });
  return a3;
};
