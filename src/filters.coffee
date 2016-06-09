{ JoinQuery, normalizeQuery } = require './lib/query'

loopback = require 'loopback'
async = require 'async'

debug = require('debug')('loopback:mixins:filters')

selectFrom = (input, selectCallback) ->
  query = new JoinQuery(input)

  if selectCallback != undefined and selectCallback != null
    query = query.select(selectCallback)

  query

runFilters = (filters, results) ->
  filteredResults = results

  Object.keys(filters).forEach (filterName) ->
    params = filters[filterName]

    debug 'running "' + filterName + '" filter with ', params
    filteredResults = service[filterName] filteredResults, params

  filteredResults

queryWrapper = (fcnName) ->
  ->
    args = []

    i = 1

    while i < arguments.length
      args.push arguments[i]
      i++

    query = selectFrom(arguments[0])
    query[fcnName].apply(query, args).execute()

service = selectFrom: selectFrom
proto = selectFrom([]).constructor.prototype

Object.keys(proto).forEach (key) ->
  prop = proto[key]

  if [ 'inspect', 'execute' ].indexOf(key) < 0 and typeof prop == 'function'
    service[key] = queryWrapper(key)

  return

exports.service = service

module.exports = (Model) ->

  Model.sharedClass._methods.forEach (method) ->
    hasFilter = method.accepts.filter (accept) ->
      accept.arg is 'filter'

    if hasFilter.length
      method.accepts.push
        arg: 'select'
        type: 'object'
        description: 'Post filtering for result sets'

  Model.beforeRemote '**', (ctx, unused, next) ->
    context = loopback.getCurrentContext()

    if context and ctx.req.query?.select
      debug 'settng selectSteps on current ctx to ', ctx.req.query

      steps = normalizeQuery Model, JSON.parse(ctx.req.query.select)

      ctx.req.query.filter =
        where: steps.shift()

      context.set 'selectSteps', steps

    next()

  Model.afterRemote '**', (ctx, instance, next) ->
    context = loopback.getCurrentContext()

    if context
      steps = context.get 'selectSteps'

    if steps
      debug 'found filters set on current contex', steps

      originalLength = ctx.result.length

      async.eachSeries steps, (filters, done) ->
        if filters.include
          include = filters.include
          delete filters.include

          query =
            relation: include.relation.name
            scope: where: include.where

          include.relation.modelFrom.include ctx.result, query, (err, results) ->
            ctx.result = runFilters filters, results
            done()
        else
          ctx.result = runFilters filters, ctx.result
          done()
      , ->
        debug 'results reduced from ' + originalLength + ' rows to ' + ctx.result.length + ' rows'
        next null, ctx

    else next null, ctx

    return