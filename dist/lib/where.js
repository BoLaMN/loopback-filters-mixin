var buildWhere, sift;

sift = require('sift');

buildWhere = function(where) {
  var query;
  query = {};
  if (where === null || typeof where !== 'object') {
    return query;
  }
  Object.keys(where).forEach(function(propName) {
    var cond, options, spec;
    cond = where[propName];
    if (propName === 'and' || propName === 'or' || propName === 'nor') {
      if (Array.isArray(cond)) {
        cond = cond.map(function(c) {
          return buildWhere(c);
        });
      }
      query['$' + propName] = cond;
      delete query[propName];
    }
    spec = false;
    options = null;
    if (cond && cond.constructor.name === 'Object') {
      options = cond.options;
      spec = Object.keys(cond)[0];
      cond = cond[spec];
    }
    if (spec) {
      query[propName] = (function() {
        switch (spec) {
          case 'between':
            return {
              $gte: cond[0],
              $lte: cond[1]
            };
          case 'inq':
            return {
              $in: cond
            };
          case 'nin':
            return {
              $nin: cond
            };
          case 'like':
            return {
              $regex: new RegExp(cond, options)
            };
          case 'nlike':
            return {
              $not: new RegExp(cond, options)
            };
          case 'neq':
            return {
              $ne: cond
            };
          case 'regexp':
            return {
              $regex: cond
            };
        }
      })();
      if (!query[propName]) {
        query[propName] = {};
        return query[propName]['$' + spec] = cond;
      }
    } else {
      return query[propName] = cond || {
        $type: 10
      };
    }
  });
  return query;
};

exports.normalizeWhere = function(where) {
  return function(e) {
    return sift(buildWhere(where), [e]).length;
  };
};
