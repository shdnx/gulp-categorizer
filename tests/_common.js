var gulp = require('gulp'),
  gulpCat = require('../src/main')(gulp, { debug: true });

function noop(cb) { cb(); }

module.exports = {
  gulp: gulp,
  gulpCat: gulpCat,

  task: function(name, dependencies) {
    return gulpCat.task(name, dependencies || [], noop);
  },

  noop: noop,
  makeImplicitTasks: gulpCat.makeImplicitTasks
};