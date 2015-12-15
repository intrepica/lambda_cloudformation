'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var _ = require('lodash');
var path = require('path');
var proxyquire = require('proxyquire').noPreserveCache();
var cfTemplateFixture = require('./cloudformation_template.fixture.json');
var uploadParamsFixture = require('./upload_params.fixture');

var mock = sinon.mock;
var stub = sinon.stub;

describe('.upload', function() {
  var lambdaCloudformation;
  var aws;

  beforeEach(function() {
    aws = {};
    var requireStubs = {
      './aws': aws
    };
    lambdaCloudformation = proxyquire('../', requireStubs);
  });

  function upload(done) {
    lambdaCloudformation.upload(uploadParamsFixture, done);
  }

  function expectItToCallbackWithError(method, done) {
    var error = new Error('Boom!');
    aws[method] = stub();
    aws[method].yields(error);
    upload(function(err) {
      expect(err).to.eql(error);
      done();
    });
  }

  describe('in parallel', function() {
    describe('uploads to s3', function() {
      beforeEach(function() {
        aws.describeStack = stub();
        aws.describeStack.yields(null, false);
      });

      it('calls aws.uploadToS3', function(done) {
        aws.uploadToS3 = mock();
        aws.uploadToS3
          .withArgs({
            region: uploadParamsFixture.stackRegion,
            filePath: uploadParamsFixture.zipFilePath,
            s3Bucket: uploadParamsFixture.lambdaS3Bucket,
            s3Key: uploadParamsFixture.lambdaS3Key
          })
          .yields(null);
        upload(function() {
          aws.uploadToS3.verify();
          done();
        });
      });

      describe('when aws.uploadToS3 fails', function() {
        it('calls back with an error', function(done) {
          expectItToCallbackWithError('uploadToS3', done);
        });
      });
    });

    describe('queries cloudformation to see if stack exists', function() {
      beforeEach(function() {
        aws.uploadToS3 = stub();
        aws.uploadToS3.yields(null);
      });

      it('calls aws.describeStack', function(done) {
        aws.describeStack = mock();
        aws.describeStack
          .withArgs({
            region: uploadParamsFixture.stackRegion,
            stackName: uploadParamsFixture.stackName
          })
          .yields(null);
        upload(function() {
          aws.describeStack.verify();
          done();
        });
      });

      describe('when aws.describeStack fails', function() {
        it('calls back with an error', function(done) {
          expectItToCallbackWithError('describeStack', done);
        });
      });
    });
  });

  describe('when aws.uploadToS3 and' +
  ' aws.describeStack are successful', function() {

    beforeEach(function() {
      aws.uploadToS3 = stub();
      aws.uploadToS3.yields(null);
    });

    describe('when the stack exists', function() {
      beforeEach(function() {
        aws.describeStack = stub();
        aws.describeStack.yields(null, {stack: 'some obj'});
      });

      it('calls aws.updateStack', function(done) {
        aws.updateStack = mock();
        aws.updateStack
          .withArgs({
            region: uploadParamsFixture.stackRegion,
            stackName: uploadParamsFixture.stackName,
            jsonTemplate: cfTemplateFixture
          })
          .yields(null);
        upload(function() {
          aws.updateStack.verify();
          done();
        });
      });
    });

    describe('when the stack doesnt exist', function() {
      beforeEach(function() {
        aws.describeStack = stub();
        aws.describeStack.yields(null, false);
      });

      it('calls aws.createStack', function(done) {
        aws.createStack = mock();
        aws.createStack
          .withArgs({
            region: uploadParamsFixture.stackRegion,
            stackName: uploadParamsFixture.stackName,
            jsonTemplate: cfTemplateFixture
          })
          .yields(null);
        upload(function() {
          aws.createStack.verify();
          done();
        });
      });
    });
  });

});
