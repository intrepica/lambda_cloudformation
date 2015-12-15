var _ = require('lodash');
var origCfTemplate = require('./cloudformation_template.json');
var origsubscriptionTemplate = require('./subscription_template.json');

exports.template = function(options) {
  var cfTemplate = _.cloneDeep(origCfTemplate);
  var props = cfTemplate.Resources.LambdaHandlerLambda.Properties;
  props.Code.S3Bucket = options.lambdaS3Bucket;
  props.Code.S3Key = options.lambdaS3Key;
  props.Description = options.lambdaDescription;
  props.Handler = options.lambdaHandler;
  props.MemorySize = options.lambdaMemorySize;
  props.Role = options.lambdaRole;
  props.Runtime = options.lambdaRuntime;
  props.Timeout = options.lambdaTimeout;
  cfTemplate.Resources.FunctionTopicSubscription.Properties.Role =
  options.lambdaRoleSnsSubscription;

  options.subscriptions.forEach(function(subscription, index) {
    var subscriptionName = 'Subscription' + index;
    var subscriptionTemplate = _.cloneDeep(origsubscriptionTemplate);
    subscriptionTemplate.Properties.TopicArn = subscription.arn;
    cfTemplate.Resources[subscriptionName] = subscriptionTemplate;
  });

  return cfTemplate;
};
