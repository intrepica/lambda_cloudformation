'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var _ = require('lodash');
var proxyquire = require('proxyquire').noPreserveCache();
var cfTemplateFixture = require('./cloudformation_template.fixture.json');
var cloudformationBuilder = require('../cloudformation_builder');
var uploadParamsFixture = require('./upload_params.fixture');
var mock = sinon.mock;
var stub = sinon.stub;

describe('cloudformation_builder', function() {
  describe('.template', function() {
    it('creates the correct cloudformation template', function() {
      var cfTemplate = cloudformationBuilder.template(uploadParamsFixture);
      expect(cfTemplate).to.eql(cfTemplateFixture);
    });
  });
});
