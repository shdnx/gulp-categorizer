# gulp-categorizer
Implicitly categorize your gulp tasks by their name.

Consider the following gulpfile.js:

	const gulp = require('gulp');

	gulp.task('js:foo', function() { /* ... */ });
	gulp.task('js:bar', function() { /* ... */ });

	gulp.task('js', [ 'js:foo', 'js:bar' ]);

	gulp.task('default', [ 'js' ]);

Normally in gulp, you'd have to explicitly create a gulp task 'js' that depends on 'js:foo' and 'js:bar', as you have seen above in line 6.
This quickly becomes tedious as your gulpfiles grow. You might create a new task 'js:baz', but forget to add it to the dependencies of 'js', leading to frustrating minutes of debugging and trying to figure out why 'js:baz' is not being run.

gulp-categorizer automatically organizes your gulp tasks into categories based on their name, and creates "implicit" gulp tasks for any categories not defined explicitly.
So in the above example, gulp-categorizer will automatically create the 'js' gulp task for you, and sets its dependencies to 'js:foo' and 'js:bar'.

This is how the above code would look like when using gulp-categorizer:

	const gulp = require('gulp'),
		gulpCat = require('gulp-categorizer')(gulp);

	// For convenience, overwrite gulp.task with gulp-categorizer's wrapper function at the beginning of your gulpfile:
	gulp.task = gulpCat.task;

	// The main part of your gulpfile remains exactly the same:
	gulp.task('js:foo', function() { /* ... */ });
	gulp.task('js:bar', function() { /* ... */ });

	// You can reference the 'js' target as you would normally:
	gulp.task('default', [ 'js' ]);

	// Add this line to the very end of your gulpfile:
	gulpCat.makeCategoryTasks();

Now you can use the 'js' target as you would use any other target, for example by invoking `gulp js`.

See below for installation, usage details and configuration options.

## Installation

Install using npm:

	npm install --save-dev gulp-categorizer

## Compatibility and dependencies

gulp-categorizer has no explicit dependencies, but the user has to pass its constructor a gulp object.

gulp-categorizer works with any gulp version compatible with version 3.9.1.

## Usage

First, require the gulp-categorizer package and pass it the gulp object as well as any options (see below):

	const gulpCat = require('gulp-categorizer')(gulp, options);

Now you can use `gulpCat.task()` as a drop-in replacement for `gulp.task`. You can, in fact, simply replace `gulp.task` with `gulpCat.task`:

	gulp.task = gulpCat.task;

At the very end of your gulpfile, add the following line:

	gulpCat.makeCategoryTasks();

This line will create the "implicit" gulp tasks for any categories for which you didn't define a task manually.

The "implicit" tasks that gulp-categorizer creates automatically can be used the same way as any other task, including in the command line, using `gulp.run`, or as a dependency.

You may also define any category tasks explicitly, after all of their dependencies have been defined:

	const gulp = require('gulp'),
		gulpCat = require('gulp-categorizer')(gulp);

	gulp.task = gulpCat.task;

	gulp.task('js:foo', function() { /* ... */ });
	gulp.task('js:bar', function() { /* ... */ });

	// This task won't be automatically categorized as a 'js' task.
	gulp.task('some-other-task', function() { /* ... */ });

	// Define the 'js' task explicitly. gulp-categorizer will automatically add 'js:foo' and 'js:bar' to the array of dependencies, after 'some-other-task'.
	gulp.task('js', [ 'some-other-task' ], function() { /* ... */ });

	// Note that you cannot define any tasks that belong to the 'js' category after you've defined the task corresponding to that category.
	// For example, this would throw an error:
	//gulp.task('js:baz', function() { /* ... */ });

	gulp.task('default', [ 'js' ]);

	gulpCat.makeCategoryTasks();

Nested categories are also valid and work as you'd expect. For example:

	gulp.task('js:server:foo', function() { /* ... */ });

	gulp.task('js:client:bar', function() { /* ... */ });

Now you can use `gulp js` which will run both 'js:server:foo' and 'js:client:bar', or you can use `gulp js:server` which will run only 'js:server:foo'.

## Options

You can pass an options object as the second argument of the gulp-categorizer constructor. All options are optional.

	categorySeparator: String = ':'

The category separator to use. This is recommended to be a single character, but is allowed to be any string. Defaults to a colon (':').

## License

MIT