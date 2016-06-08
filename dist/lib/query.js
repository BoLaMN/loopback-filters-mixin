var JoinQuery, debug, executeAsync, executeSync, hashGroupBy, hashJoin, mergeJoin, normalizeComparator, normalizeSelect, ref, ref1, ref2, ref3, sortGroupBy, whereFn;

debug = require('debug')('loopback:mixins:filters');

ref = require('./join'), hashJoin = ref.hashJoin, mergeJoin = ref.mergeJoin;

ref1 = require('./group'), hashGroupBy = ref1.hashGroupBy, sortGroupBy = ref1.sortGroupBy;

ref2 = require('./execute'), executeAsync = ref2.executeAsync, executeSync = ref2.executeSync;

ref3 = require('./normalize'), normalizeSelect = ref3.normalizeSelect, normalizeComparator = ref3.normalizeComparator;

whereFn = require('./where').whereFn;

JoinQuery = (function() {
  function JoinQuery(input, op, params) {
    this.a = input;
    this.op = op;
    this.params = params || [];
    this.result = null;
  }

  JoinQuery.prototype.mergeJoin = function(a2, comparator, callback, options) {
    return new JoinQuery(this, mergeJoin, [a2, comparator, callback, options]);
  };

  JoinQuery.prototype.hashJoin = function(a2, hashFcn, callback) {
    return new JoinQuery(this, hashJoin, [a2, hashFcn, callback]);
  };

  JoinQuery.prototype.sortGroupBy = function(comparator, callback, options) {
    return new JoinQuery(this, sortGroupBy, [comparator, callback, options]);
  };

  JoinQuery.prototype.hashGroupBy = function(hashFcn, callback) {
    return new JoinQuery(this, hashGroupBy, [hashFcn, callback]);
  };

  JoinQuery.prototype.map = function(callback) {
    return new JoinQuery(this, Array.prototype.map, [normalizeSelect(callback)]);
  };

  JoinQuery.prototype.select = function(callback) {
    return this.map(callback);
  };

  JoinQuery.prototype.filter = function(params) {
    return new JoinQuery(this, Array.prototype.filter, [whereFn(params)]);
    return query;
  };

  JoinQuery.prototype.where = function(params) {
    return this.filter(params);
  };

  JoinQuery.prototype.having = function(params) {
    return this.filter(params);
  };

  JoinQuery.prototype.sort = function(comparator, options) {
    return new JoinQuery(this, (function(comparator) {
      return this.slice().sort(comparator);
    }), [normalizeComparator(comparator, options)]);
  };

  JoinQuery.prototype.orderBy = function(comparator, options) {
    return this.sort(comparator, options);
  };

  JoinQuery.prototype.slice = function(begin, end) {
    return new JoinQuery(this, Array.prototype.slice, [begin, end]);
  };

  JoinQuery.prototype.limit = function(len, offset) {
    offset = offset || 0;
    return this.slice(offset, len + offset);
  };

  JoinQuery.prototype.offset = function(offset) {
    return this.slice(offset);
  };

  JoinQuery.prototype.inspect = function(callback) {
    return new JoinQuery(this, (function(callback) {
      callback(this);
      return this;
    }), [callback]);
  };

  JoinQuery.prototype.execute = function(options) {
    if (options && options.async) {
      return executeAsync(this, options);
    } else {
      return executeSync(this, options);
    }
  };

  return JoinQuery;

})();

module.exports = JoinQuery;
