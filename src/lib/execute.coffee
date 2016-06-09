debug = require('debug')('loopback:mixins:filters')

Promise = require 'bluebird'

exports.executeAsync = (query, options) ->
  promises = query.params.map (param) ->
    if param?.constructor?.name is 'JoinQuery'
      param.execute options
    else
      Promise.resolve param

  Promise.all(promises).then (params) ->
    if !(options and options.force) and query.result != null
      query.result
    else if query?.a?.constructor?.name is 'JoinQuery'
      query.a.execute(options).then (results) ->
        if !(options and options.force) and query.result != null
          query.result
        else
          query.result = results

          if query.op
            query.result = query.op.apply(query.result, params)

          query.result
    else
      query.result = query.a

      if query.op
        query.result = query.op.apply(query.result, params)

      query.result

exports.executeSync = (query, options) ->
  if !(options and options.force) and query.result != null
    query.result
  else
    params = query.params.map (param) ->
      if param?.constructor?.name is 'JoinQuery'
        param.execute options
      else
        param

    if query?.a?.constructor?.name is 'JoinQuery'
      query.result = query.a.execute(options)
    else
      query.result = query.a

    if query.op
      query.result = query.op.apply(query.result, params)

    query.result
