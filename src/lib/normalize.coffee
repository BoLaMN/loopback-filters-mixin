debug = require('debug')('loopback:mixins:filters')

exports.normalizeHashFcn = (hashFcn) ->
  if typeof hashFcn == 'string' or hashFcn instanceof String
    if hashFcn instanceof String
      hashFcn = hashFcn.valueOf()
    (e) ->
      e[hashFcn]
  else if typeof hashFcn == 'object' and Array.isArray(hashFcn)
    (e) ->
      JSON.stringify hashFcn.map (prop) ->
        e[prop]
  else
    hashFcn

exports.normalizeComparator = (comparator, options) ->
  stringCompare = undefined

  if options and options.localeCompare
    stringCompare = (s1, s2) ->
      s1.localeCompare s2
  else
    stringCompare = (s1, s2) ->
      if s1 < s2 then -1 else if s1 > s2 then 1 else 0

  if typeof comparator == 'string' or comparator instanceof String
    if comparator instanceof String
      comparator = comparator.valueOf()

    (e1, e2) ->
      if typeof e1[comparator] == 'string' or e1[comparator] instanceof String
        stringCompare e1[comparator], e2[comparator]
      else if typeof e1[comparator].diff == 'function'
        e1[comparator].diff e2[comparator]
      else
        +e1[comparator] - (+e2[comparator])
  else if typeof comparator == 'object' and Array.isArray(comparator)
    (e1, e2) ->
      result = 0

      comparator.some (prop) ->
        if typeof e1[prop] == 'string' or e1[prop] instanceof String
          result = stringCompare(e1[prop], e2[prop])
        else if typeof e1[prop].diff == 'function'
          result = e1[prop].diff(e2[prop])
        else
          result = +e1[prop] - (+e2[prop])
        result != 0
      result
  else
    comparator

exports.normalizeSelect = (callback) ->
  if typeof callback == 'string' or callback instanceof String
    (e) ->
      result = {}
      result[callback] = e[callback]
      result
  else if typeof callback == 'object' and Array.isArray(callback)
    (e) ->
      callback.reduce (prev, prop) ->
        prev[prop] = e[prop]
        prev
      , {}
  else
    callback
