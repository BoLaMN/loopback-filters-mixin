sift = require 'sift'

buildWhere = (where) ->
  query = {}

  if where is null or typeof where isnt 'object'
    return query

  Object.keys(where).forEach (propName) ->
    cond = where[propName]

    if propName in [ 'and', 'or', 'nor' ]
      if Array.isArray cond
        cond = cond.map (c) ->
          buildWhere c

      query['$' + propName] = cond
      delete query[propName]

    spec = false
    options = null

    if cond and cond.constructor.name is 'Object'
      options = cond.options
      spec = Object.keys(cond)[0]
      cond = cond[spec]

    if spec
      query[propName] = switch spec
        when 'between'
          $gte: cond[0]
          $lte: cond[1]
        when 'inq'
          $in: cond
        when 'nin'
          $nin: cond
        when 'like'
          $regex: new RegExp(cond, options)
        when 'nlike'
          $not: new RegExp(cond, options)
        when 'neq'
          $ne: cond
        when 'regexp'
          $regex: cond

      if not query[propName]
        query[propName] = {}
        query[propName]['$' + spec] = cond
    else
      query[propName] = cond or $type: 10

  query

exports.normalizeWhere = (where) ->
  (e) -> sift(buildWhere(where), [e]).length