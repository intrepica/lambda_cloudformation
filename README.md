##AWS Lambda Cloudformation

1. uploads a zip file to s3, 
2. creates or updates a cloud formation template
3. Invokes the template

###Setup

```sh
npm install @literacyplanet/lambda_cloudformation --save
```

#### Usage

```js
var lambdaCloudformation = require('@literacyplanet/lambda_cloudformation');
var uploadParams = {
  stackRegion: 'us-east-1',
  stackName: 'test-stack',
  zipFilePath: path.join(__dirname, 'lambda.zip'),
  lambdaRole: 'lambda_basic_execution',
  lambdaRoleSnsSubscription:
  'lambda_basic_execution',
  lambdaRoleDynamoSubscription:
  'lambda_basic_execution',
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
  ],
  eventSources: [
    {
      arn: 'arn:aws:dynamodb:us-east-1:xxxxxxxxx:table/my_dynamo_table/stream/2015-12-03T01:01:02.357',
      startingPosition: 'TRIM_HORIZON',
      enabled: true,
      batchSize: 1      
    }
  ]  
};

lambdaCloudformation.upload(uploadParams, done);
```

###Run tests

```sh
npm run test
```

###Cloudformation Lambda template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "lambdaHandler": {      
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket": "devops.example.com",
          "S3Key": "lambda/handlers/demo_handler.zip"
        },
        "Description": "Demo Lambda Handler",
        "Handler": "index.handler",
        "MemorySize": 128,
        "Role": {
          "Fn::Join": [ "", [ 
              "arn:aws:iam::", 
              { "Ref": "AWS::AccountId" }, 
              ":role/",
              "lambda_basic_execution"
            ]
          ]
        },
        "Runtime": "nodejs",
        "Timeout": "3"
      }
    },
    "Subscription0": {
      "Type": "Custom::TopicSubscription",
      "DependsOn": ["functionTopicSubscription","lambdaHandler"],
      "Properties": {
        "ServiceToken": { "Fn::GetAtt": ["functionTopicSubscription", "Arn"] },
        "TopicArn": "arn:aws:sns:us-east-1:xxxxxxxxx:topic_a",
        "Endpoint": { "Fn::GetAtt": ["lambdaHandler", "Arn"] },
        "Protocol": "lambda"
      }
    },
    "Subscription1": {
      "Type": "Custom::TopicSubscription",
      "DependsOn": ["functionTopicSubscription","lambdaHandler"],
      "Properties": {
        "ServiceToken": { "Fn::GetAtt": ["functionTopicSubscription", "Arn"] },
        "TopicArn": "arn:aws:sns:us-east-1:xxxxxxxxx:topic_b",
        "Endpoint": { "Fn::GetAtt": ["lambdaHandler", "Arn"] },
        "Protocol": "lambda"
      }
    }, 
    "functionTopicSubscription": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Handler": "index.handler",
        "Role": {
          "Fn::Join": [ "", [ 
              "arn:aws:iam::", 
              { "Ref": "AWS::AccountId" }, 
              ":role/",
              "lambda_basic_execution"
            ]
          ]
        },
        "Code": {
          "ZipFile":  { "Fn::Join": ["\n", [
            "var response = require('cfn-response');",
            "exports.handler = function(event, context) {",
            "  console.log('REQUEST RECEIVED:\\n', JSON.stringify(event));",
            "  var responseData = {};",
            "  if (event.RequestType == 'Delete') {",
            "    var subscriptionArn = event.PhysicalResourceId;",
            "    var aws = require('aws-sdk');",
            "    var sns = new aws.SNS();",
            "    sns.unsubscribe({SubscriptionArn: subscriptionArn}, function(err, data) {",
            "      if (err) {",
            "          responseData = {Error: 'Failed to unsubscribe from SNS Topic'};",
            "          response.send(event, context, response.FAILED, responseData);",
            "      } else {",
            "          response.send(event, context, response.SUCCESS, data, data.SubscriptionArn);",
            "      }",
            "    });",
            "    return;",
            "  }",
            "  if (event.RequestType == 'Create' || event.RequestType == 'Update') {",
            "    var topicArn = event.ResourceProperties.TopicArn;",
            "    var endpoint = event.ResourceProperties.Endpoint;",
            "    var protocol = event.ResourceProperties.Protocol;",
            "    if (topicArn && endpoint && protocol) {",
            "      var aws = require('aws-sdk');",
            "      var sns = new aws.SNS();",
            "      sns.subscribe({TopicArn: topicArn, Endpoint: endpoint, Protocol: protocol}, function(err, data) {",
            "        if (err) {",
            "          responseData = {Error: 'Failed to subscribe to SNS Topic'};",
            "          console.log(responseData.Error + ':\\n', err);",
            "          response.send(event, context, response.FAILED, responseData);",
            "        } else {",
            "          response.send(event, context, response.SUCCESS, data, data.SubscriptionArn);",
            "        }",
            "      });",
            "    } else {",
            "      responseData = {Error: 'Missing one of required arguments'};",
            "      console.log(responseData.Error);",
            "      response.send(event, context, response.FAILED, responseData);",
            "    }",
            "  }",
            "};"
          ]]}
        },
        "Runtime": "nodejs",
        "Timeout": "30"
      }
    },
    "EventSource0": {
      "Type": "Custom::EventSourceSubscription",
      "DependsOn": ["functionEventSource","lambdaHandler"],
      "Properties": {
        "ServiceToken": { "Fn::GetAtt": ["functionEventSource", "Arn"] },
        "Function": { "Fn::GetAtt": ["lambdaHandler", "Arn"] },
        "EventSourceArn": "arn:aws:dynamodb:us-east-1:xxxxxxxxx:table/my_dynamo/stream/2015-12-03T01:01:02.357",
        "StartingPosition": "TRIM_HORIZON",
        "Enabled": true,
        "BatchSize": 1
      }
    },     
    "functionEventSource": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Handler": "index.handler",
        "Role": {
          "Fn::Join": [ "", [ 
              "arn:aws:iam::", 
              { "Ref": "AWS::AccountId" }, 
              ":role/",
              "lambda_basic_execution"
            ]
          ]
        },
        "Code": {
          "ZipFile":  { "Fn::Join": ["\n", [
            "var response = require('cfn-response');",
            "exports.handler = function(event, context) {",
            "  console.log('REQUEST RECEIVED:\\n', JSON.stringify(event));",
            "  var responseData = {};",
            "  var aws = require('aws-sdk');",
            "  var lambda = new aws.Lambda();",
            "  function cb(err, data) {",
            "    if (err) {",
            "      responseData = {Error: 'Failed to subscribe to event source'};",
            "      console.log(responseData.Error + ':\\n', err);",
            "      response.send(event, context, response.FAILED, responseData);",
            "    } else {",
            "      response.send(event, context, response.SUCCESS, data, data.UUID);",
            "    }",
            "  }",
            "  var eventSrcArn = event.ResourceProperties.EventSourceArn;",
            "  var functionName = event.ResourceProperties.Function;",
            "  if (event.RequestType == 'Delete') {",
            "    lambda.listEventSourceMappings({EventSourceArn: eventSrcArn, FunctionName:functionName}, function(err, data) {",
            "      if (err) return cb(err);",
            "      lambda.deleteEventSourceMapping({UUID:data.EventSourceMappings[0].UUID}, cb);",
            "    });",
            "    return;",
            "  } else {",
            "    var enabled = event.ResourceProperties.Enabled === 'true' ? true : false;",
            "    var startingPos = event.ResourceProperties.StartingPosition;",
            "    var batchSize = event.ResourceProperties.BatchSize || 0;",
            "    var params = {EventSourceArn:eventSrcArn, FunctionName:functionName, StartingPosition:startingPos, BatchSize:batchSize, Enabled:enabled}",
            "    if (eventSrcArn && functionName && startingPos) {",
            "      if (event.RequestType == 'Create') {",            
            "        lambda.createEventSourceMapping(params, cb);",
            "      }",            
            "      if (event.RequestType == 'Update') {",
            "        sns.updateEventSourceMapping(params, cb);",
            "      }",            
            "    } else {",
            "      responseData = {Error: 'Missing one of required arguments'};",
            "      console.log(responseData.Error);",
            "      console.log(eventSrcArn, 'eventSrcArn');",
            "      console.log(functionName, 'functionName');",
            "      console.log(startingPos, 'startingPos');",
            "      response.send(event, context, response.FAILED, responseData);",
            "    }",            
            "  }",
            "};"
          ]]}
        },
        "Runtime": "nodejs",
        "Timeout": "30"
      }
    }    
  }
}
```json

