var JoinQuery, async, debug, loopback, normalizeQuery, proto, queryWrapper, ref, runFilters, selectFrom, service;

ref = require('./lib/query'), JoinQuery = ref.JoinQuery, normalizeQuery = ref.normalizeQuery;

loopback = require('loopback');

async = require('async');

debug = require('debug')('loopback:mixins:filters');

selectFrom = function(input, selectCallback) {
  var query;
  query = new JoinQuery(input);
  if (selectCallback !== void 0 && selectCallback !== null) {
    query = query.select(selectCallback);
  }
  return query;
};

runFilters = function(filters, results) {
  var filteredResults;
  filteredResults = results;
  Object.keys(filters).forEach(function(filterName) {
    var params;
    params = filters[filterName];
    debug('running "' + filterName + '" filter with ', params);
    return filteredResults = service[filterName](filteredResults, params);
  });
  return filteredResults;
};

queryWrapper = function(fcnName) {
  return function() {
    var args, i, query;
    args = [];
    i = 1;
    while (i < arguments.length) {
      args.push(arguments[i]);
      i++;
    }
    query = selectFrom(arguments[0]);
    return query[fcnName].apply(query, args).execute();
  };
};

service = {
  selectFrom: selectFrom
};

proto = selectFrom([]).constructor.prototype;

Object.keys(proto).forEach(function(key) {
  var prop;
  prop = proto[key];
  if (['inspect', 'execute'].indexOf(key) < 0 && typeof prop === 'function') {
    service[key] = queryWrapper(key);
  }
});

exports.service = service;

module.exports = function(Model) {
  Model.sharedClass._methods.forEach(function(method) {
    var hasFilter;
    hasFilter = method.accepts.filter(function(accept) {
      return accept.arg === 'filter';
    });
    if (hasFilter.length) {
      return method.accepts.push({
        arg: 'select',
        type: 'object',
        description: 'Post filtering for result sets'
      });
    }
  });
  Model.beforeRemote('**', function(ctx, unused, next) {
    var context, ref1, steps;
    context = loopback.getCurrentContext();
    if (context && ((ref1 = ctx.req.query) != null ? ref1.select : void 0)) {
      debug('settng selectSteps on current ctx to ', ctx.req.query);
      steps = normalizeQuery(Model, JSON.parse(ctx.req.query.select));
      ctx.req.query.filter = {
        where: steps.shift()
      };
      context.set('selectSteps', steps);
    }
    return next();
  });
  return Model.afterRemote('**', function(ctx, instance, next) {
    var context, originalLength, steps;
    context = loopback.getCurrentContext();
    if (context) {
      steps = context.get('selectSteps');
    }
    if (steps) {
      debug('found filters set on current contex', steps);
      originalLength = ctx.result.length;
      async.eachSeries(steps, function(filters, done) {
        var include, query;
        if (filters.include) {
          include = filters.include;
          delete filters.include;
          query = {
            relation: include.relation.name,
            scope: {
              where: include.where
            }
          };
          return include.relation.modelFrom.include(ctx.result, query, function(err, results) {
            ctx.result = runFilters(filters, results);
            return done();
          });
        } else {
          ctx.result = runFilters(filters, ctx.result);
          return done();
        }
      }, function() {
        debug('results reduced from ' + originalLength + ' rows to ' + ctx.result.length + ' rows');
        return next(null, ctx);
      });
    } else {
      next(null, ctx);
    }
  });
};
