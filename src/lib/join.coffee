debug = require('debug')('loopback:mixins:filters')

{ normalizeComparator, normalizeHashFcn } = require './normalize'

exports.mergeJoin = (a2, comparator, callback, options) ->
  a1 = this
  a3 = []

  comparator = normalizeComparator(comparator, options)

  if !options or !options.sorted
    a1 = a1.slice().sort(comparator)
    a2 = a2.slice().sort(comparator)

  getContiguousLength = (src, start) ->
    if start < src.length
      i = start + 1
      while i < src.length and comparator(src[start], src[i]) == 0
        i++
      i - start
    else
      0

  addLeft = (start, end) ->
    i = start

    while i < end
      newElement = callback(a1[i], null)

      if newElement
        a3.push newElement

      ++i
    return

  addRight = (start, end) ->
    i = start

    while i < end
      newElement = callback(null, a2[i])

      if newElement
        a3.push newElement

      ++i
    return

  addCartesianJoin = (start1, end1, start2, end2) ->
    i1 = start1

    while i1 < end1
      i2 = start2

      while i2 < end2
        newElement = callback(a1[i1], a2[i2])

        if newElement
          a3.push newElement

        ++i2
      ++i1
    return

  i1 = 0
  i2 = 0

  if a1.length and a2.length
    len1 = getContiguousLength(a1, i1)
    len2 = getContiguousLength(a2, i2)

    while i1 < a1.length and i2 < a2.length
      compare = comparator(a1[i1], a2[i2])

      if compare == 0
        addCartesianJoin i1, i1 + len1, i2, i2 + len2

        i1 += len1
        i2 += len2

        len1 = getContiguousLength(a1, i1)
        len2 = getContiguousLength(a2, i2)
      else if compare < 0
        addLeft i1, i1 + len1

        i1 += len1
        len1 = getContiguousLength(a1, i1)
      else
        addRight i2, i2 + len2

        i2 += len2
        len2 = getContiguousLength(a2, i2)

  addLeft i1, a1.length
  addRight i2, a2.length

  a3

exports.hashJoin = (a2, hashFcn, callback) ->
  a1 = this
  a3 = []

  addCallback = undefined

  hashFcn = normalizeHashFcn(hashFcn)

  hashed = undefined
  scanned = undefined

  if a1.length < a2.length
    hashed = a1
    scanned = a2

    addCallback = (h, s) ->
      newElement = callback(h, s)

      if newElement
        a3.push newElement

      return
  else
    hashed = a2
    scanned = a1

    addCallback = (h, s) ->
      newElement = callback(s, h)

      if newElement
        a3.push newElement

      return

  if hashed.length == 0
    scanned.forEach (e) ->
      addCallback null, e
      return
    return a3
  else if scanned.length == 0
    hashed.forEach (e) ->
      addCallback e, null
      return
    return a3

  hashTable = {}
  hash = undefined
  hashBucket = undefined

  i = 0

  while i < hashed.length
    hashedEntry = hashed[i]
    hash = hashFcn(hashedEntry, i, hashed)
    hashBucket = hashTable[hash]

    if hashBucket
      hashBucket.push
        used: false
        e: hashedEntry
    else
      hashTable[hash] = [ {
        used: false
        e: hashedEntry
      } ]

    ++i

  i = 0

  while i < scanned.length
    scannedEntry = scanned[i]

    hash = hashFcn(scannedEntry, i, scanned)
    hashBucket = hashTable[hash]

    if hashBucket
      hashBucket.forEach (hashedEntry) ->
        addCallback hashedEntry.e, scannedEntry
        hashedEntry.used = true
        return
    else
      addCallback null, scannedEntry

    i++

  Object.keys(hashTable).forEach (hash) ->
    hashTable[hash].forEach (hashedEntry) ->
      if !hashedEntry.used
        addCallback hashedEntry.e, null
      return
    return
  a3

