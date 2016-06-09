debug = require('debug')('loopback:mixins:filters')

isObjectLike = (callback) ->
  typeof callback is 'object' and Array.isArray(callback)

isString = (val) ->
  typeof val is 'string' or val instanceof String

isFunction = (fn) ->
  typeof fn is 'function'

exports.normalizeHashFcn = (hashFcn) ->
  if isString hashFcn
    if hashFcn instanceof String
      hashFcn = hashFcn.valueOf()
    (e) ->
      e[hashFcn]
  else if isObjectLike hashFcn
    (e) ->
      JSON.stringify hashFcn.map (prop) ->
        e[prop]
  else
    hashFcn

exports.normalizeComparator = (comparator, options = {}) ->
  if options.localeCompare
    stringCompare = (s1, s2) ->
      s1.localeCompare s2
  else
    stringCompare = (s1, s2) ->
      if s1 < s2 then -1 else if s1 > s2 then 1 else 0

  if isString comparator
    if comparator instanceof String
      comparator = comparator.valueOf()

    (e1, e2) ->
      if isString e1[comparator]
        stringCompare e1[comparator], e2[comparator]
      else if isFunction e1[comparator].diff
        e1[comparator].diff e2[comparator]
      else
        +e1[comparator] - (+e2[comparator])
  else if isObjectLike comparator
    (e1, e2) ->
      result = 0

      comparator.some (prop) ->
        if isString e1[prop]
          result = stringCompare(e1[prop], e2[prop])
        else if isFunction e1[prop].diff
          result = e1[prop].diff(e2[prop])
        else
          result = +e1[prop] - (+e2[prop])
        result isnt 0
      result
  else
    comparator

exports.normalizeSelect = (callback) ->
  if isString callback
    (e) ->
      result = {}
      result[callback] = e[callback]
      result
  else if isObjectLike callback
    (e) ->
      callback.reduce (prev, prop) ->
        prev[prop] = e[prop]
        prev
      , {}
  else
    callback

exports.normalizeQuery = (startingModel, filter) ->
  querySteps = []

  relationModels = [ startingModel ]
  relationNames = []

  relate = (relation) ->
    relationModels[relationModels.length - 1].relations[relation]

  add = (item, fn) ->
    if Array.isArray item
      item.forEach fn
    else fn item, true

  addInclude = (include, addModel) ->
    if include
      add include, (item, notArray) ->
        newRelation = relate item.relation or item
        item.name = relationNames.join '.'

        if notArray and addModel
          relationNames.push item.relation or item
          relationModels.push newRelation.modelTo

        item.relation = newRelation

  traverse = (obj = {}) ->
    if obj.then
      addInclude obj.then.include, true

      add obj.then, (itm) ->
        traverse itm
      delete obj.then

    if obj.finally
      relationNames.pop()
      relationModels.pop()

      addInclude obj.finally.include

      querySteps.push obj.finally
      delete obj.finally

    querySteps.unshift obj
    querySteps

  traverse filter