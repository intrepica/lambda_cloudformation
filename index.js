var async = require('async');
var _ = require('lodash');

var aws = require('./aws');
var cloudformationBuilder = require('./cloudformation_builder');

exports.upload = function(options, callback) {
  async.parallel({
    upload: function(cb) {
      aws.uploadToS3({
        region: options.stackRegion,
        filePath: options.zipFilePath,
        s3Bucket: options.lambdaS3Bucket,
        s3Key: options.lambdaS3Key
      }, cb);
    },
    stackExists: function(cb) {
      aws.describeStack({
        region: options.stackRegion,
        stackName: options.stackName
      }, cb);
    }
  }, function(err, response) {
    if (err) {
      return callback(err);
    }
    var templateProperties = _.pick(options,
      'lambdaRole',
      'lambdaRoleSnsSubscription',
      'lambdaRoleDynamoSubscription',
      'lambdaRuntime',
      'lambdaMemorySize',
      'lambdaHandler',
      'lambdaDescription',
      'lambdaS3Bucket',
      'lambdaS3Key',
      'lambdaTimeout',
      'subscriptions',
      'eventSources'
    );
    var cfTemplateFixture = cloudformationBuilder
      .template(templateProperties);
    var stackParams = {
      region: options.stackRegion,
      stackName: options.stackName,
      jsonTemplate: cfTemplateFixture
    };
    if (response.stackExists) {
      aws.updateStack(stackParams, callback);
    } else {
      aws.createStack(stackParams, callback);
    }
  });
};
