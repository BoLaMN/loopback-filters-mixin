var debug, isFunction, isObjectLike, isString;

debug = require('debug')('loopback:mixins:filters');

isObjectLike = function(callback) {
  return typeof callback === 'object' && Array.isArray(callback);
};

isString = function(val) {
  return typeof val === 'string' || val instanceof String;
};

isFunction = function(fn) {
  return typeof fn === 'function';
};

exports.normalizeHashFcn = function(hashFcn) {
  if (isString(hashFcn)) {
    if (hashFcn instanceof String) {
      hashFcn = hashFcn.valueOf();
    }
    return function(e) {
      return e[hashFcn];
    };
  } else if (isObjectLike(hashFcn)) {
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
  if (options == null) {
    options = {};
  }
  if (options.localeCompare) {
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
  if (isString(comparator)) {
    if (comparator instanceof String) {
      comparator = comparator.valueOf();
    }
    return function(e1, e2) {
      if (isString(e1[comparator])) {
        return stringCompare(e1[comparator], e2[comparator]);
      } else if (isFunction(e1[comparator].diff)) {
        return e1[comparator].diff(e2[comparator]);
      } else {
        return +e1[comparator] - (+e2[comparator]);
      }
    };
  } else if (isObjectLike(comparator)) {
    return function(e1, e2) {
      var result;
      result = 0;
      comparator.some(function(prop) {
        if (isString(e1[prop])) {
          result = stringCompare(e1[prop], e2[prop]);
        } else if (isFunction(e1[prop].diff)) {
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
  if (isString(callback)) {
    return function(e) {
      var result;
      result = {};
      result[callback] = e[callback];
      return result;
    };
  } else if (isObjectLike(callback)) {
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

exports.normalizeQuery = function(startingModel, filter) {
  var add, addInclude, querySteps, relate, relationModels, relationNames, traverse;
  querySteps = [];
  relationModels = [startingModel];
  relationNames = [];
  relate = function(relation) {
    return relationModels[relationModels.length - 1].relations[relation];
  };
  add = function(item, fn) {
    if (Array.isArray(item)) {
      return item.forEach(fn);
    } else {
      return fn(item, true);
    }
  };
  addInclude = function(include, addModel) {
    if (include) {
      return add(include, function(item, notArray) {
        var newRelation;
        newRelation = relate(item.relation || item);
        item.name = relationNames.join('.');
        if (notArray && addModel) {
          relationNames.push(item.relation || item);
          relationModels.push(newRelation.modelTo);
        }
        return item.relation = newRelation;
      });
    }
  };
  traverse = function(obj) {
    if (obj == null) {
      obj = {};
    }
    if (obj.then) {
      addInclude(obj.then.include, true);
      add(obj.then, function(itm) {
        return traverse(itm);
      });
      delete obj.then;
    }
    if (obj["finally"]) {
      relationNames.pop();
      relationModels.pop();
      addInclude(obj["finally"].include);
      querySteps.push(obj["finally"]);
      delete obj["finally"];
    }
    querySteps.unshift(obj);
    return querySteps;
  };
  return traverse(filter);
};
