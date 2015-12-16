var _ = require('lodash');
var origLambdaTemplate = require('./cf_templates/lambda.json');
var origSubscriptionTemplate = require('./cf_templates/subscription.json');
var origFnTopicSubscriptionTemplate =
require('./cf_templates/function_topic_subscription.json');
var origFnEventSourceTemplate =
require('./cf_templates/function_event_source.json');
var origEventSourceTemplate = require('./cf_templates/event_source.json');

exports.template = function(options) {
  var lambdaTemplate = _.cloneDeep(origLambdaTemplate);
  var props = lambdaTemplate.Resources.lambdaHandler.Properties;
  props.Code.S3Bucket = options.lambdaS3Bucket;
  props.Code.S3Key = options.lambdaS3Key;
  props.Description = options.lambdaDescription;
  props.Handler = options.lambdaHandler;
  props.MemorySize = options.lambdaMemorySize;
  props.Role['Fn::Join'][1].push(options.lambdaRole);
  props.Runtime = options.lambdaRuntime;
  props.Timeout = options.lambdaTimeout;

  if (options.subscriptions) {
    var fnTopicSubscriptionTemplate = _.cloneDeep(
      origFnTopicSubscriptionTemplate
    );
    fnTopicSubscriptionTemplate
      .functionTopicSubscription
      .Properties
      .Role['Fn::Join'][1].push(options.lambdaRoleSnsSubscription);
    _.merge(lambdaTemplate.Resources, fnTopicSubscriptionTemplate);
    options.subscriptions.forEach(function(subscription, index) {
      var subscriptionName = 'Subscription' + index;
      var subscriptionTemplate = _.cloneDeep(origSubscriptionTemplate);
      subscriptionTemplate.Properties.TopicArn = subscription.arn;
      lambdaTemplate.Resources[subscriptionName] = subscriptionTemplate;
    });
  }

  if (options.eventSources) {
    var fnEventSourceTemplate = _.cloneDeep(
      origFnEventSourceTemplate
    );
    fnEventSourceTemplate
      .functionEventSource
      .Properties
      .Role['Fn::Join'][1].push(options.lambdaRoleDynamoSubscription);
    _.merge(lambdaTemplate.Resources, fnEventSourceTemplate);
    options.eventSources.forEach(function(eventSource, index) {
      var eventSourceName = 'EventSource' + index;
      var eventSourceTemplate = _.cloneDeep(origEventSourceTemplate);
      eventSourceTemplate.Properties.EventSourceArn = eventSource.arn;
      eventSourceTemplate.Properties.StartingPosition =
      eventSource.startingPosition;
      eventSourceTemplate.Properties.Enabled = eventSource.enabled;
      eventSourceTemplate.Properties.BatchSize = eventSource.batchSize;
      lambdaTemplate.Resources[eventSourceName] = eventSourceTemplate;
    });
  }

  return lambdaTemplate;
};
