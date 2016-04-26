'use strict';

var fs = require('fs');

var Ajv = require('ajv');
var argv = require('yargs').argv;
var colors = require('colors');
var jsonld = require('jsonld');
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
        if (valid) return 'Passed: '.green + schema.title;
        else return 'Invalid: '.red + ajv.errorsText(validate.errors);
      });
    });

    // loop through input docs
    glob(input_dir, function(err, inputs) {
      inputs.forEach(function(input) {
        // report what's beeing tested
        var json = JSON.parse(fs.readFileSync(input));
        var validations = [];
        validators.forEach(function(test) {
          // test it!
          validations.push(test(json));
        });
        // dump nquads
        // TODO: collect results then output, so nquads stay with validation
        // TODO: eventually validate this to (obviously...)
        jsonld.toRDF(json, {format: 'application/nquads'},
          function(err, nquads) {
            console.log('Results for ' + input.blue);
            validations.forEach(function(msg) {
              console.log(msg);
            });
            console.log("NQuads:".grey);
            if (!err) console.log(nquads);
            else console.log(err.red);
          }
        );
      });
    });
  });
});
