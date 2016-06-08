querys = require './lib/query'
loopback = require 'loopback'

debug = require('debug')('loopback:mixins:filters')

selectFrom = (input, selectCallback) ->
  query = new querys(input)

  if selectCallback != undefined and selectCallback != null
    query = query.select(selectCallback)

  query

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
      debug 'settng selectFilter on current ctx to ', ctx.req.query.select
      context.set 'selectFilter', JSON.parse ctx.req.query.select

    next()

  Model.afterRemote '**', (ctx, instance, next) ->
    context = loopback.getCurrentContext()

    if context
      filters = context.get 'selectFilter'

    if filters
      debug 'found filters set on current contex', filters

      originalLength = ctx.result.length

      Object.keys(filters).forEach (filterName) ->
        params = filters[filterName]

        debug 'running "' + filterName + '" filter with ', params
        ctx.result = service[filterName] ctx.result, params

    debug 'results reduced from ' + originalLength + ' rows to ' + ctx.result.length + ' rows'

    next null, ctx

    return