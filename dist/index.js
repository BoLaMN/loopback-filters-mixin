'use strict';
var filters;

filters = require('./filters');

module.exports = function(app) {
  app.loopback.modelBuilder.mixins.define('Filters', filters);
};
