debug = require('debug')('loopback:mixins:filters')

{ hashJoin, mergeJoin } = require './join'
{ hashGroupBy, sortGroupBy } = require './group'
{ executeAsync, executeSync } = require './execute'
{ normalizeSelect, normalizeComparator } = require './normalize'
{ whereFn } = require './where'

class JoinQuery
  constructor: (input, op, params) ->
    @a = input
    @op = op
    @params = params or []
    @result = null

  mergeJoin: (a2, comparator, callback, options) ->
    new JoinQuery(this, mergeJoin, [
      a2
      comparator
      callback
      options
    ])

  hashJoin: (a2, hashFcn, callback) ->
    new JoinQuery(this, hashJoin, [
      a2
      hashFcn
      callback
    ])

  sortGroupBy: (comparator, callback, options) ->
    new JoinQuery(this, sortGroupBy, [
      comparator
      callback
      options
    ])

  hashGroupBy: (hashFcn, callback) ->
    new JoinQuery(this, hashGroupBy, [
      hashFcn
      callback
    ])

  map: (callback) ->
    new JoinQuery(this, Array::map, [ normalizeSelect(callback) ])

  select: (callback) ->
    @map callback

  filter: (params) ->
    return new JoinQuery(this, Array::filter, [ whereFn(params) ])
    query

  where: (params) ->
    @filter params

  having: (params) ->
    @filter params

  sort: (comparator, options) ->
    new JoinQuery(this, ((comparator) ->
      @slice().sort comparator
    ), [ normalizeComparator(comparator, options) ])

  orderBy: (comparator, options) ->
    @sort comparator, options

  slice: (begin, end) ->
    new JoinQuery(this, Array::slice, [
      begin
      end
    ])

  limit: (len, offset) ->
    offset = offset or 0
    @slice offset, len + offset

  offset: (offset) ->
    @slice offset

  inspect: (callback) ->
    new JoinQuery(this, ((callback) ->
      callback this
      this
    ), [ callback ])

  execute: (options) ->
    if options and options.async
      executeAsync this, options
    else
      executeSync this, options

module.exports = JoinQuery