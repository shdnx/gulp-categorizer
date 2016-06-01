var test = require('./_common');

test.task('a:b:c');
test.task('a:b:d');
test.task('a:e:f');

test.task('default', [ 'a' ]);

// expected warning about no makeImplicitTasks() called
//test.makeImplicitTasks();
