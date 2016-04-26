'use strict';

var fs = require('fs');

var Ajv = require('ajv');
var argv = require('yargs').argv;
var colors = require('colors');
var glob = require('glob');
var gulp = require('gulp');

var ajv = new Ajv({allErrors: true});

var test_dir = 'tests/*';
if ('tests' in argv) {
  test_dir = argv.tests;
}
var input_dir = 'input/*';
if ('input' in argv) {
  input_dir = argv.input;
}

gulp.task('default', function() {
  var validators = [];
  // acculumlate validators
  glob(test_dir, function(err, matches) {
    if (err) throw err;
    matches.forEach(function(validator) {
      // add lamda validator function for this schema
      validators.push(function(data) {
        var schema = JSON.parse(fs.readFileSync(validator));
        var validate = ajv.compile(schema);
        var valid = validate(data);
        if (valid) console.log('Passed: '.green + schema.title);
        else console.log('Invalid: '.red + ajv.errorsText(validate.errors));
      });
    });

    // loop through input docs
    glob(input_dir, function(err, inputs) {
      inputs.forEach(function(input) {
        // report what's beeing tested
        console.log('Testing ' + input);
        validators.forEach(function(test) {
          // test it!
          test(JSON.parse(fs.readFileSync(input)));
        });
      });
    });
  });
});
