'use strict';

module.exports = function(gulp, options) {
  if (!gulp) {
    console.error('gulp-categorizer: missing gulp object!');
    return null;
  }

  // save the gulp.task function, as the user will probably overwrite it
  const _gulpTask = gulp.task;

  if (!options) options = {};
  const categorySeparator = options.categorySeparator || ':';

  // Used as a map to map category names to the array of task names that belong to that category.
  let taskCategoryMap = {};

  // A list to keep track of gulp tasks registered. Used to verify that a task registered earlier is not used as a category name later.
  let taskNames = [];

  const gulpCategorizer = {};

  // Gets the name of the category task that contains the task with the specified name.
  // E.g. for "a:b:c" it will return "a:b".
  gulpCategorizer.getTaskCategoryName = function(taskName) {
    let index = taskName.lastIndexOf(categorySeparator);

    if (index === -1) return null;
    else return taskName.substring(0, index);
  };

  // Gets all category names that the task with the specified name belongs to.
  // E.g. for "a:b:c" it will return [ "a", "a:b" ].
  gulpCategorizer.getAllTaskCategoryNames = function(taskName) {
    let index = taskName.indexOf(categorySeparator);
    let categories = [];

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

    return true;
  };

  // Drop-in replacement for gulp.task.
  gulpCategorizer.task = function(taskName, dependencies, func) {
    if (typeof dependencies === 'function') {
      func = dependencies;
      dependencies = [];
    }

    // check if a category with the same name already exists
    // if so, merge dependencies and remove the category
    if (typeof taskCategoryMap[taskName] !== 'undefined') {
      dependencies = dependencies.concat(taskCategoryMap[taskName]);
      delete taskCategoryMap[taskName];
    }

    const taskCategories = gulpCategorizer.getAllTaskCategoryNames(taskName);
    let currentCategory = null;

    let i = 0;
    while (i < taskCategories.length) {
      const category = taskCategories[i];

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
  gulpCategorizer.makeCategoryTasks = function() {
    for (let category in taskCategoryMap) {
      _gulpTask.call(gulp, category, taskCategoryMap[category]);
    }
  };

  return gulpCategorizer;
};