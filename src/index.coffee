'use strict'

filters = require './filters'

module.exports = (app) ->
  app.loopback.modelBuilder.mixins.define 'Filters', filters

  return
