var debug, loopback, proto, queryWrapper, querys, selectFrom, service;

querys = require('./lib/query');

loopback = require('loopback');

debug = require('debug')('loopback:mixins:filters');

selectFrom = function(input, selectCallback) {
  var query;
  query = new querys(input);
  if (selectCallback !== void 0 && selectCallback !== null) {
    query = query.select(selectCallback);
  }
  return query;
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
    var context, ref;
    context = loopback.getCurrentContext();
    if (context && ((ref = ctx.req.query) != null ? ref.select : void 0)) {
      debug('settng selectFilter on current ctx to ', ctx.req.query.select);
      context.set('selectFilter', JSON.parse(ctx.req.query.select));
    }
    return next();
  });
  return Model.afterRemote('**', function(ctx, instance, next) {
    var context, filters, originalLength;
    context = loopback.getCurrentContext();
    if (context) {
      filters = context.get('selectFilter');
    }
    if (filters) {
      debug('found filters set on current contex', filters);
      originalLength = ctx.result.length;
      Object.keys(filters).forEach(function(filterName) {
        var params;
        params = filters[filterName];
        debug('running "' + filterName + '" filter with ', params);
        return ctx.result = service[filterName](ctx.result, params);
      });
    }
    debug('results reduced from ' + originalLength + ' rows to ' + ctx.result.length + ' rows');
    next(null, ctx);
  });
};
