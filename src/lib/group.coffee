debug = require('debug')('loopback:mixins:filters')

{ normalizeComparator, normalizeHashFcn } = require './normalize'

exports.sortGroupBy = (comparator, callback, options) ->
  a = this
  results = []

  if a.length == 0
    return results

  comparator = normalizeComparator(comparator, options)

  if !options or !options.sorted
    a = a.slice().sort(comparator)

  grouped = callback(null, a[0])

  i = 1

  while i < a.length
    if comparator(a[i - 1], a[i]) == 0
      grouped = callback(grouped, a[i])
    else
      results.push grouped
      grouped = callback(null, a[i])

    ++i

  results.push grouped
  results

exports.hashGroupBy = (hashFcn, callback) ->
  a = this

  if a.length == 0
    return []

  hashFcn = normalizeHashFcn(hashFcn)
  hashTable = {}

  i = 0

  while i < a.length
    e = a[i]
    hash = hashFcn(e, i, a)

    grouped = hashTable[hash]
    hashTable[hash] = callback(grouped or null, e)

    ++i

  Object.keys(hashTable).map (hash) ->
    hashTable[hash]
