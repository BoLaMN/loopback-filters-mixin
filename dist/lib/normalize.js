var debug;

debug = require('debug')('loopback:mixins:filters');

exports.normalizeHashFcn = function(hashFcn) {
  if (typeof hashFcn === 'string' || hashFcn instanceof String) {
    if (hashFcn instanceof String) {
      hashFcn = hashFcn.valueOf();
    }
    return function(e) {
      return e[hashFcn];
    };
  } else if (typeof hashFcn === 'object' && Array.isArray(hashFcn)) {
    return function(e) {
      return JSON.stringify(hashFcn.map(function(prop) {
        return e[prop];
      }));
    };
  } else {
    return hashFcn;
  }
};

exports.normalizeComparator = function(comparator, options) {
  var stringCompare;
  stringCompare = void 0;
  if (options && options.localeCompare) {
    stringCompare = function(s1, s2) {
      return s1.localeCompare(s2);
    };
  } else {
    stringCompare = function(s1, s2) {
      if (s1 < s2) {
        return -1;
      } else if (s1 > s2) {
        return 1;
      } else {
        return 0;
      }
    };
  }
  if (typeof comparator === 'string' || comparator instanceof String) {
    if (comparator instanceof String) {
      comparator = comparator.valueOf();
    }
    return function(e1, e2) {
      if (typeof e1[comparator] === 'string' || e1[comparator] instanceof String) {
        return stringCompare(e1[comparator], e2[comparator]);
      } else if (typeof e1[comparator].diff === 'function') {
        return e1[comparator].diff(e2[comparator]);
      } else {
        return +e1[comparator] - (+e2[comparator]);
      }
    };
  } else if (typeof comparator === 'object' && Array.isArray(comparator)) {
    return function(e1, e2) {
      var result;
      result = 0;
      comparator.some(function(prop) {
        if (typeof e1[prop] === 'string' || e1[prop] instanceof String) {
          result = stringCompare(e1[prop], e2[prop]);
        } else if (typeof e1[prop].diff === 'function') {
          result = e1[prop].diff(e2[prop]);
        } else {
          result = +e1[prop] - (+e2[prop]);
        }
        return result !== 0;
      });
      return result;
    };
  } else {
    return comparator;
  }
};

exports.normalizeSelect = function(callback) {
  if (typeof callback === 'string' || callback instanceof String) {
    return function(e) {
      var result;
      result = {};
      result[callback] = e[callback];
      return result;
    };
  } else if (typeof callback === 'object' && Array.isArray(callback)) {
    return function(e) {
      return callback.reduce(function(prev, prop) {
        prev[prop] = e[prop];
        return prev;
      }, {});
    };
  } else {
    return callback;
  }
};
