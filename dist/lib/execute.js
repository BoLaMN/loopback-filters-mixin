var Promise, debug;

debug = require('debug')('loopback:mixins:filters');

Promise = require('bluebird');

exports.executeAsync = function(query, options) {
  var promises;
  promises = query.params.map(function(param) {
    var ref;
    if ((param != null ? (ref = param.constructor) != null ? ref.name : void 0 : void 0) === 'JoinQuery') {
      return param.execute(options);
    } else {
      return Promise.resolve(param);
    }
  });
  return Promise.all(promises).then(function(params) {
    var ref, ref1;
    if (!(options && options.force) && query.result !== null) {
      return query.result;
    } else if ((query != null ? (ref = query.a) != null ? (ref1 = ref.constructor) != null ? ref1.name : void 0 : void 0 : void 0) === 'JoinQuery') {
      return query.a.execute(options).then(function(results) {
        if (!(options && options.force) && query.result !== null) {
          return query.result;
        } else {
          query.result = results;
          if (query.op) {
            query.result = query.op.apply(query.result, params);
          }
          return query.result;
        }
      });
    } else {
      query.result = query.a;
      if (query.op) {
        query.result = query.op.apply(query.result, params);
      }
      return query.result;
    }
  });
};

exports.executeSync = function(query, options) {
  var params, ref, ref1;
  if (!(options && options.force) && query.result !== null) {
    return query.result;
  } else {
    params = query.params.map(function(param) {
      var ref;
      if ((param != null ? (ref = param.constructor) != null ? ref.name : void 0 : void 0) === 'JoinQuery') {
        return param.execute(options);
      } else {
        return param;
      }
    });
    if ((query != null ? (ref = query.a) != null ? (ref1 = ref.constructor) != null ? ref1.name : void 0 : void 0 : void 0) === 'JoinQuery') {
      query.result = query.a.execute(options);
    } else {
      query.result = query.a;
    }
    if (query.op) {
      query.result = query.op.apply(query.result, params);
    }
    return query.result;
  }
};
