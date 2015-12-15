var fs = require('fs');
var AWS = require('aws-sdk');

function cfFactory(options) {
  return new AWS.CloudFormation({
    apiVersion: '2010-05-15',
    region: options.region
  });
}

function buildStackParams(options) {
  return {
    StackName: options.stackName,
    TemplateBody: JSON.stringify(options.jsonTemplate)
  };
}

exports.uploadToS3 = function(options, callback) {
  var s3 = new AWS.S3({
    region: options.region
  });
  var fileStream = fs.createReadStream(options.filePath);
  var params = {
    Bucket: options.s3Bucket,
    Key: options.s3Key,
    Body: fileStream
  };
  s3.upload(params)
    .send(callback);
};

exports.createStack = function(options, callback) {
  var params = buildStackParams(options);
  var cloudformation = cfFactory(options);
  cloudformation.createStack(params, callback);
};

exports.updateStack = function(options, callback) {
  var params = buildStackParams(options);
  var cloudformation = cfFactory(options);
  cloudformation.updateStack(params, callback);
};

exports.describeStack = function(options, callback) {
  var params = {
    StackName: options.stackName
  };
  var cloudformation = cfFactory(options);
  cloudformation.describeStacks(params, function(err, response) {
    if (err && err.message.match(/does not exist/)) {
      return callback(null, false);
    }
    if (err) {
      return callback(err);
    }
    if (response.Stacks.length) {
      callback(null, response.Stacks[0]);
    } else {
      callback(null, false);
    }
  });
};
