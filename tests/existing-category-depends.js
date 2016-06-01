var test = require('./_common.js');

test.task('a:b:c');
test.task('a:b:d');

// explicitly make category task, dependencies should be injected
test.task('a');

// Error: Cannot add 'a:e' to category 'a', because a gulp task with the name of the category already exists!
test.task('a:e:f');

test.task('default', [ 'a' ]);
test.makeImplicitTasks();
