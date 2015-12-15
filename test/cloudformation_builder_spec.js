'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var _ = require('lodash');
var proxyquire = require('proxyquire').noPreserveCache();
var cfTemplateFixture = require('./cloudformation_template.fixture.json');
var cloudformationBuilder = require('../cloudformation_builder');

var mock = sinon.mock;
var stub = sinon.stub;

describe('cloudformation_builder', function() {
  describe('.template', function() {
    it('creates the correct cloudformation template', function() {
      var cfTemplate = cloudformationBuilder.template({
        lambdaRole: 'arn:aws:iam::xxxxxxxxx:role/lambda_basic_execution',
        lambdaRoleSnsSubscription:
        'arn:aws:iam::xxxxxxxxx:role/lambda_basic_execution',
        lambdaRuntime: 'nodejs',
        lambdaMemorySize: 128,
        lambdaHandler: 'index.handler',
        lambdaDescription: 'Demo Lambda Handler',
        lambdaS3Bucket: 'devops.example.com',
        lambdaS3Key: 'lambda/handlers/demo_handler.zip',
        lambdaTimeout: '3',
        subscriptions: [
          {arn: 'arn:aws:sns:us-east-1:xxxxxxxxx:topic_a'},
          {arn: 'arn:aws:sns:us-east-1:xxxxxxxxx:topic_b'}
        ]
      });
      expect(cfTemplate).to.eql(cfTemplateFixture);
    });
  });
});
