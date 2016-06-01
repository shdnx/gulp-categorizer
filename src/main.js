'use strict';

var gutil = require('gulp-util');

module.exports = function(gulp, options) {
  if (!gulp)
    throw new Error('gulp-categorizer: expected gulp object as the first parameter!');

  // save the gulp.task function, as the user will probably overwrite it
  var _gulpTask = gulp.task;

  if (!options) options = {};
  var debug = options.debug || false;
  var categorySeparator = options.categorySeparator || ':';

  // Used as a map to map category names to the array of task names that belong to that category.
  var taskCategoryMap = {};

  // A list to keep track of gulp tasks registered. Used to verify that a task registered earlier is not used as a category name later.
  var taskNames = [];

  // A flag indicating whether makeImplicitTasks() has been called. Used for sanity checks.
  var madeImplicitTasks = false;

  var gulpCategorizer = {};

  function log(message) {
    if (!debug) return;

    gutil.log('[gulp-categorizer]', gutil.colors.gray.dim('Debug: ' + message));
  }

  function warn(message) {
    gutil.log('[gulp-categorizer]', gutil.colors.red('Warning: ' + message));
  }

  // Gets the name of the category task that contains the task with the specified name.
  // E.g. for "a:b:c" it will return "a:b".
  gulpCategorizer.getTaskCategoryName = function(taskName) {
    var index = taskName.lastIndexOf(categorySeparator);

    if (index === -1) return null;
    else return taskName.substring(0, index);
  };

  // Gets all category names that the task with the specified name belongs to.
  // E.g. for "a:b:c" it will return [ "a", "a:b" ].
  gulpCategorizer.getAllTaskCategoryNames = function(taskName) {
    var index = taskName.indexOf(categorySeparator);
    var categories = [];

    while (index !== -1) {
      categories.push(taskName.substring(0, index));
      index = taskName.indexOf(categorySeparator, index + categorySeparator.length);
    }

    return categories;
  };

  // Adds the specified task to the specified category, if it's not part of it yet.
  // Returns true if it was added, or false if it was already in the category.
  gulpCategorizer.addTaskToCategory = function(categoryName, taskName) {
    if (taskNames.indexOf(categoryName) !== -1)
      throw new Error("Cannot add '" + taskName + "' to category '" + categoryName + "', because a gulp task with the name of the category already exists!");

    if (!taskCategoryMap[categoryName])
      taskCategoryMap[categoryName] = [ taskName ];
    else if (taskCategoryMap[categoryName].indexOf(taskName) === -1)
      taskCategoryMap[categoryName].push(taskName);
    else return false;

    log('Task "' + taskName + '" added to category "' + categoryName + '"');
    return true;
  };

  // Drop-in replacement for gulp.task.
  gulpCategorizer.task = function(taskName, dependencies, func) {
    if (madeImplicitTasks)
      warn('gulp task "' + taskName + '" created after a call to makeImplicitTasks(): call makeImplicitTasks() at the end of your gulp script.');

    if (typeof dependencies === 'function') {
      func = dependencies;
      dependencies = [];
    }

    // check if a category with the same name already exists
    // if so, merge dependencies and remove the category
    if (typeof taskCategoryMap[taskName] !== 'undefined') {
      dependencies = dependencies.concat(taskCategoryMap[taskName]);
      log('Automatically injected dependencies for explicit category task "' + taskName + '": ' + JSON.stringify(taskCategoryMap[taskName]));
      delete taskCategoryMap[taskName];
    }

    var taskCategories = gulpCategorizer.getAllTaskCategoryNames(taskName);
    var currentCategory = null;

    var i = 0;
    while (i < taskCategories.length) {
      var category = taskCategories[i];

      if (currentCategory !== null)
        gulpCategorizer.addTaskToCategory(currentCategory, category);

      currentCategory = category;
      i++;
    }

    if (currentCategory !== null)
      gulpCategorizer.addTaskToCategory(currentCategory, taskName);

    taskNames.push(taskName);
    return _gulpTask.call(gulp, taskName, dependencies, func);
  }

  // Create gulp.task()s out of any implicit categories.
  // For example, if we had the tasks 'js:foo', 'js:bar', 'css:blah' and 'js', then this will create the gulp task 'css', with 'css:blah' as its only dependency.
  gulpCategorizer.makeImplicitTasks = function() {
    if (madeImplicitTasks)
      warn('duplicate call to makeImplicitTasks(): only call this function once, at the end of your gulp script.');

    for (var category in taskCategoryMap) {
      _gulpTask.call(gulp, category, taskCategoryMap[category]);
      log('Created implicit category task "' + category + '" with dependencies: ' + JSON.stringify(taskCategoryMap[category]));
    }

    madeImplicitTasks = true;
  };

  process.on('exit', function() {
    if (!madeImplicitTasks) {
      warn('No call to makeImplicitTasks() was made, so no implicit categories were created!');
      warn('The following implicit categories were not created:');
      for (var category in taskCategoryMap)
        warn(' - "' + category + '" with dependencies: ' + JSON.stringify(taskCategoryMap[category]));
    }
  });

  return gulpCategorizer;
};
